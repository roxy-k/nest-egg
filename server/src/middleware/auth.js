// server/src/middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
  
};


const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

function normalizeId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && typeof value.toString === "function") {
    const str = value.toString();
    return str && str !== "[object Object]" ? str : "";
  }
  return "";
}

function resolveUserFromPayload(payload) {
  if (typeof payload === "string" || typeof payload === "number") {
    return { payload: { id: normalizeId(payload) }, id: normalizeId(payload) };
  }

  if (!payload || typeof payload !== "object") return { payload, id: "" };

  const nestedUser =
    typeof payload.user === "object" && payload.user !== null ? payload.user : null;

  const candidates = [
    payload.id,
    payload._id,
    payload.userId,
    payload.sub,
    nestedUser?.id,
    nestedUser?._id,
    nestedUser?.userId,
    payload.data?.id,
    payload.data?._id,
    payload.data?.userId,
  ];

  for (const candidate of candidates) {
    const id = normalizeId(candidate);
    if (id) {
      return {
        payload: { ...(nestedUser || {}), ...payload },
        id,
      };
    }
  }

  return {
    payload: { ...(nestedUser || {}), ...payload },
    id: "",
  };
}

async function resolveWithUser(decoded, req, res, next) {
  try {
    let { payload, id } = resolveUserFromPayload(decoded);

    if (!id && payload?.email) {
      const user = await User.findOne({ email: payload.email.toLowerCase() }).lean();
      if (user?._id) {
        id = normalizeId(user._id);
        payload = {
          ...payload,
          id,
          name: payload.name || user.name || "",
        };
      }
    }

    if (!id && payload?.sub) {
      const user = await User.findOne({ _id: payload.sub }).lean();
      if (user?._id) {
        id = normalizeId(user._id);
        payload = {
          ...payload,
          id,
          email: payload.email || user.email,
          name: payload.name || user.name || "",
        };
      }
    }

    if (!id) {
      console.warn("Auth payload missing id:", decoded);
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.user = { ...payload, id };
    next();
  } catch (err) {
    console.warn("Auth user resolution failed:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}

export async function requireAuth(req, res, next) {
  if (process.env.TEST_BYPASS_AUTH === "1") {
    req.user = { id: "test-user-id" }; // фиктивный пользователь для тестов
    return next();
  }

  try {
    const authHeader = req.headers.authorization || "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const cookieToken = req.cookies?.token || null;
    const token = bearer || cookieToken;

    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    await resolveWithUser(decoded, req, res, next);
  } catch (err) {
    console.warn("Auth verification failed:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}
