import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import passport from "../passport.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { sendPasswordResetEmail, isResetEmailConfigured } from "../utils/mailer.js";

const router = express.Router();

const CLIENT =
  process.env.CLIENT_URL ||
  "https://your-nest-egg.onrender.com";

const RESET_LINK_BASE =
  process.env.RESET_EMAIL_URL ||
  `${(CLIENT || "http://localhost:5173").replace(/\/$/, "")}/reset`;


const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MIN = Number(process.env.RESET_TOKEN_EXPIRES_MIN || 60);

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

const generateResetToken = () => crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");



const registerSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email"),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters."),
  name: z
    .string()
    .trim()
    .max(120, "Name must be 120 characters or less.")
    .optional()
    .or(z.literal("")),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email"),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters."),
});

const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: "Current password is required" })
    .min(6, "Password must be at least 6 characters."),
  newPassword: z
    .string({ required_error: "New password is required" })
    .min(6, "Password must be at least 6 characters."),
});

const resetRequestSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email"),
});

const resetPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email"),
  token: z.string({ required_error: "Token is required" }).min(1, "Token is required"),
  newPassword: z
    .string({ required_error: "New password is required" })
    .min(6, "Password must be at least 6 characters."),
});

const getUserId = (user) => {
  if (!user) return "";
  if (typeof user.id === "string") return user.id;
  if (user.id && typeof user.id.toString === "function") {
    const str = user.id.toString();
    if (str && str !== "[object Object]") return str;
  }
  if (user._id?.toString) return user._id.toString();
  if (user._id) return `${user._id}`;
  return "";
};

const buildUserPayload = (user) => ({
  id: getUserId(user),
  email: user.email,
  name: user.name || "",
});

const signToken = (user) =>
  jwt.sign(buildUserPayload(user), JWT_SECRET, { expiresIn: "7d" });

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors?.[0]?.message || "Invalid data";
    return res.status(400).json({ error: msg });
  }

  const { email, password, name } = parsed.data;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ error: "Email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      passwordHash,
      name: name || "",
      provider: "local",
    });



    const token = signToken(user);
    res.cookie("token", token, cookieOptions);
    return res.status(201).json({ user: buildUserPayload(user), token });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user);
    res.cookie("token", token, cookieOptions);
    return res.status(200).json({
      user: buildUserPayload(user),
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});


router.post("/change-password", requireAuth, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors?.[0]?.message || "Invalid data";
    return res.status(400).json({ error: msg });
  }

  const { currentPassword, newPassword } = parsed.data;

  if (currentPassword === newPassword) {
    return res.status(400).json({ error: "New password must be different from the current password." });
  }

  try {
    const user = await User.findById(req.user?.id).select("+passwordHash");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.provider && user.provider !== "local") {
      return res.status(400).json({ error: "Password change is not available for this account." });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ error: "Password change is not available for this account." });
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash || "");
    if (!matches) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordResetTokenHash = "";
    user.passwordResetExpiresAt = null;
    await user.save();

    const token = signToken(user);
    res.cookie("token", token, cookieOptions);
    return res.json({ ok: true, user: buildUserPayload(user), token });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ error: "Unable to change password." });
  }
});

router.post("/request-reset", async (req, res) => {
  const parsed = resetRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors?.[0]?.message || "Invalid data";
    return res.status(400).json({ error: msg });
  }

  const { email } = parsed.data;

  try {
    const emailSupported = isResetEmailConfigured();
    const user = await User.findOne({ email });
    let rawToken = "";

    if (user && user.provider === "local") {
      rawToken = generateResetToken();
      user.passwordResetTokenHash = hashResetToken(rawToken);
      user.passwordResetExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MIN * 60 * 1000);
      await user.save();

      if (emailSupported) {
        try {
          const result = await sendPasswordResetEmail({
            to: user.email,
            email: user.email,
            name: user.name || "",
            token: rawToken,
            baseUrl: RESET_LINK_BASE,
          });
          if (!result?.ok) {
            console.warn(
              "Password reset email not sent:",
              result?.reason || "unknown_reason",
            );
          }
        } catch (err) {
          console.error("Password reset email send error:", err?.message || err);
        }
      }
    }

    const payload = { ok: true, emailSupported: Boolean(emailSupported) };
    if (process.env.NODE_ENV === "test" && rawToken) {
      payload.token = rawToken;
    }
    return res.json(payload);
  } catch (err) {
    console.error("Request reset error:", err);
    return res.status(500).json({ error: "Unable to initiate password reset" });
  }
});

router.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors?.[0]?.message || "Invalid data";
    return res.status(400).json({ error: msg });
  }

  const { email, token, newPassword } = parsed.data;

  try {
    const user = await User.findOne({ email });
    if (!user || user.provider !== "local") {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    if (
      !user.passwordResetTokenHash ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() < Date.now()
    ) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const hashed = hashResetToken(token);
    if (user.passwordResetTokenHash !== hashed) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordResetTokenHash = "";
    user.passwordResetExpiresAt = null;
    await user.save();

    const authToken = signToken(user);
    res.cookie("token", authToken, cookieOptions);
    return res.json({ ok: true, user: buildUserPayload(user), token: authToken });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: "Unable to reset password" });
  }
});


router.post("/logout", (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
  });
  res.json({ ok: true });
});



router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account" })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${CLIENT}/login?err=google` }),
  async (req, res) => {
    try {
      const user = req.user;
      const token = signToken(user);
      res.cookie("token", token, cookieOptions);

      const targetBase = (CLIENT || "").replace(/\/$/, "");
      return res.redirect(`${targetBase}/oauth#token=${encodeURIComponent(token)}`);
    } catch (e) {
      return res.redirect((CLIENT || "") + "/login?err=google");
    }
  }
);


   
    


router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  const token = bearerToken || req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const uid = decoded.id || decoded.sub;          
    if (!uid) return res.status(401).json({ error: "Invalid token" });
    const user = decoded.email && decoded.name
      ? { id: uid, email: decoded.email, name: decoded.name }
      : await User.findById(uid).lean();
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    return res.json({
      user: { id: String(user._id || user.id || uid), email: user.email || "", name: user.name || "" }
    });  
  } catch (err) {
    console.error("❌ Invalid token:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
});


export default router;
