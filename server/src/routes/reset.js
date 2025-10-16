// server/src/routes/reset.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import Category from "../models/Category.js";

const router = Router();

const resetHandler = async (req, res) => {  
  try {
    const userId = req.user?.id || null;
    // универсальный фильтр: поддержим обе схемы — user, ownerKey или legacy userId
    const filter = userId
      ? {
          $or: [
            { user: userId },
            { ownerKey: userId },
            { userId },
          ],
        }
      : {};
    const [t, b, c] = await Promise.all([
      Transaction.deleteMany(filter),
      Budget.deleteMany(filter),
      Category.deleteMany(filter),
    ]);

    return res.json({
      ok: true,
      deleted: {
        transactions: t.deletedCount,
        budgets: b.deletedCount,
        categories: c.deletedCount,
      },
    });
  } catch (err) {
    console.error("RESET ERROR:", err);
    return res.status(500).json({ ok: false, error: "reset_failed" });
  }
};

router.delete("/", requireAuth, resetHandler);
router.post("/", requireAuth, resetHandler);

export default router;
