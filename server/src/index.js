import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import transactionsRoutes from "./routes/transactions.js";
import categoriesRoutes from "./routes/categories.js";
import budgetsRoutes from "./routes/budgets.js";
import seedRoutes, { ensureDefaultCategories } from "./routes/seed.js";
import resetRoutes from "./routes/reset.js";
import { connectDB } from "./db.js";
import passport from "./passport.js";
import authRoutes from "./routes/auth.js";

export const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const whitelist = [
  process.env.CLIENT_URL,
  "https://your-nest-egg.onrender.com",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || whitelist.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

const isTestEnv = process.env.NODE_ENV === "test";
const allowInitInTest = process.env.TEST_INIT_DB === "1";
const shouldInitData = !isTestEnv || allowInitInTest;

if (shouldInitData && connectDB) {
  const uri = process.env.MONGO_URI;
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && !uri) {
    console.error("🚨 MONGO_URI is required in production. Aborting start.");
    process.exit(1);
  }
  connectDB(uri).catch((err) => console.error("DB connect error:", err));
}

if (shouldInitData && ensureDefaultCategories) {
  ensureDefaultCategories().catch?.((err) =>
    console.error("ensureDefaultCategories error:", err),
  );
}

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/budgets", budgetsRoutes);

if (process.env.NODE_ENV !== "production") {
  app.use("/api/seed", seedRoutes);
  app.use("/api/reset", resetRoutes);
}

export default app;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const directPath = process.argv[1] ? resolve(process.argv[1]) : "";
const isDirectRun = directPath === __filename || directPath === resolve(__dirname, "index.js");

if (isDirectRun) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT} (${process.env.NODE_ENV})`);
  });
}
 
