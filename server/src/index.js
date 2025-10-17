import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import transactionsRoutes from "./routes/transactions.js";
import categoriesRoutes from "./routes/categories.js";
import budgetsRoutes from "./routes/budgets.js";
import seedRoutes, { ensureDefaultCategories } from "./routes/seed.js";
import resetRoutes from "./routes/reset.js";
import { connectDB } from "./db.js";
import passport from "./passport.js";

const app = express();

// 1) Render + https: нужно до cookieParser и CORS
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// 2) CORS: ровно один origin + credentials
const FRONT = process.env.CLIENT_URL || "https://your-nest-egg.onrender.com";
app.use(
  cors({
    origin: FRONT,        // строка, без слэша на конце
    credentials: true,
  })
);

// 3) базовые мидлвари
app.use(express.json());
app.use(cookieParser());

// 4) passport (если используешь стратегии)
app.use(passport.initialize());

// 5) health
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// 6) Подключение к БД
await connectDB();
await ensureDefaultCategories?.(); // если используется

// 7) Роуты API
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/budgets", budgetsRoutes);

// 8) dev-тулзы только вне production
if (process.env.NODE_ENV !== "production") {
  app.use("/api/seed", seedRoutes);
  app.use("/api/reset", resetRoutes);
}

// 9) Старт
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT} (${process.env.NODE_ENV})`);
});
