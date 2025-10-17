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
import passport from "./passport.js"

const app = express();


const FRONT = process.env.CLIENT_URL || "https://your-nest-egg.onrender.com";

const whitelist = [
  FRONT,
  "http://localhost:5173",
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || whitelist.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true, 
}));

app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", 1);
app.use(passport.initialize());






app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/budgets", budgetsRoutes);

if (process.env.NODE_ENV !== "production") {
    app.use("/api/seed", seedRoutes);
  app.use("/api/reset", resetRoutes);
}
const PORT = process.env.PORT || 4000;
let bootstrapPromise;

async function bootstrap() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await connectDB(process.env.MONGO_URI);
      await ensureDefaultCategories();
    })();
  }
  return bootstrapPromise;
}


if (process.env.NODE_ENV !== "test") {
  bootstrap()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 API running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("❌ Failed to start server:", err);
      process.exit(1);
    });
}


export { bootstrap };
export default app;
