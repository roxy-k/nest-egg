import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import passport from "../passport.js";
import User from "../models/User.js";

const router = express.Router();

const CLIENT =
  process.env.CLIENT_URL ||
  "https://your-nest-egg.onrender.com";



const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};



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
    return res.status(201).json({ user: buildUserPayload(user) });
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

    const user = await User.findOne({ email }).lean(false);
if (!user) {
  return res.status(401).json({ error: "Invalid credentials" });
}

const ok = await bcrypt.compare(password, user.passwordHash);
if (!ok) {
  return res.status(401).json({ error: "Invalid credentials" });
}

const token = jwt.sign(
  { id: user.id, email: user.email, name: user.name || "" },
  JWT_SECRET,
  { expiresIn: "7d" }
);

res.cookie("token", token, cookieOptions);
return res.status(200).json({
  user: { id: user.id, email: user.email, name: user.name || "" },
});

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
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

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    callbackURL: "https://nest-egg-tuwf.onrender.com/api/auth/google/callback",
  })
);


router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${CLIENT}/login`,
  }),
  async (req, res) => {
    const user = req.user; 
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name || "" }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, cookieOptions);
    return res.redirect(`${CLIENT}/dashboard`);
  }
);


router.get("/me", (req, res) => {
  const authHeader = req.headers.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  const token = bearerToken || req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ id: decoded.id, email: decoded.email, name: decoded.name });
  } catch (err) {
    console.error("❌ Invalid token:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
});


export default router;
