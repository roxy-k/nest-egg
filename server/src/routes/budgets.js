import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import Budget from "../models/Budget.js";

const router = express.Router();

function serialize(doc) {
  const json = doc.toObject({ versionKey: false });
  json._id = doc._id?.toString();
  if (json.user && typeof json.user === "object") json.user = json.user.toString();
  if ("ownerKey" in json) delete json.ownerKey;
  if ("userId" in json) delete json.userId;
  return json;
}

const MonthSchema = z
  .string()
  .regex(/^(\d{4}-\d{2})(-\d{2})?$/, "month must be YYYY-MM or YYYY-MM-DD")
  .transform((s) => s.slice(0, 7));

const Body = z.object({
  categoryId: z.string().min(1, "categoryId is required"),
  month: MonthSchema,
  limit: z.coerce.number().positive("limit must be > 0"),
});

const computeBudgetId = (ownerKey, categoryId, month) =>
  [ownerKey, categoryId, month].map((part) => String(part ?? "").trim()).join(":");

function normalizePayload(data, ownerKey) {
  const { categoryId, month, limit } = data;
  const payload = {
    ownerKey,
    categoryId,
    month,
    limit,
    id: computeBudgetId(ownerKey, categoryId, month),
  };
  if (mongoose.Types.ObjectId.isValid(ownerKey)) {
    payload.user = ownerKey;
  }
  return payload;
}
// GET /api/budgets
router.get("/", requireAuth, async (req, res) => {
  try {
    const ownerKey = typeof req.user.id === "string" ? req.user.id.trim() : "";
    if (!ownerKey) return res.status(400).json({ error: "Invalid user id." });

    const isObjectId = mongoose.Types.ObjectId.isValid(ownerKey);
    const clause = isObjectId
      ? { $or: [{ ownerKey }, { user: ownerKey }] }
      : { ownerKey };

    const list = await Budget.find(clause).sort({ month: -1, createdAt: -1 });
    res.json(list.map(serialize));
  } catch (e) {
    console.error("Failed to fetch budgets:", e);
    res.status(500).json({ error: "Failed to load budgets." });
  }
});

// POST /api/budgets
router.post("/", requireAuth, async (req, res) => {
  try {
    const ownerKey = typeof req.user.id === "string" ? req.user.id.trim() : "";
    if (!ownerKey) return res.status(400).json({ error: "Invalid user id." });

    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      const first = parsed.error.issues?.[0];
      return res.status(400).json({ error: first?.message || "Bad payload" });
    }

    const payload = normalizePayload(parsed.data, ownerKey);

    const existing = await Budget.findOne({
      ownerKey,
      categoryId: payload.categoryId,
      month: payload.month,
    });

    if (existing) {
      existing.limit = payload.limit;
      if (payload.user) existing.user = payload.user;
      await existing.save();
      return res.json(serialize(existing));
    }

    const doc = await Budget.create(payload);

    res.status(201).json(serialize(doc));
  } catch (e) {
    if (e?.name === "ValidationError") {
      const first = Object.values(e.errors || {})[0];
      const message = typeof first?.message === "string" ? first.message : "Validation failed.";
      return res.status(400).json({ error: message });
    }
    if (e?.code === 11000) {
      console.error("Duplicate budget detected during create:", e);
      return res
        .status(409)
        .json({ error: "Budget already exists for this category and month." });
    }
    console.error("Failed to create budget:", e);
    res.status(500).json({ error: "Failed to create budget." });
  }
});

// PUT /api/budgets/:id
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const ownerKey = typeof req.user.id === "string" ? req.user.id.trim() : "";
    if (!ownerKey) return res.status(400).json({ error: "Invalid user id." });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      const first = parsed.error.issues?.[0];
      return res.status(400).json({ error: first?.message || "Bad payload" });
    }

    const payload = normalizePayload(parsed.data, ownerKey);

    const clause = mongoose.Types.ObjectId.isValid(ownerKey)
      ? { _id: id, $or: [{ ownerKey }, { user: ownerKey }] }
      : { _id: id, ownerKey };

    const current = await Budget.findOne(clause);
    if (!current) {
      const fallback = await Budget.findOne({
        ownerKey,
        categoryId: payload.categoryId,
        month: payload.month,
      });
      if (fallback) {
        fallback.limit = payload.limit;
        if (payload.user) fallback.user = payload.user;
        await fallback.save();
        await Budget.deleteOne({ _id: id, ownerKey });
        return res.json(serialize(fallback));
      }
      return res.status(404).json({ error: "Not found" });
    }

    if (
      current.categoryId !== payload.categoryId ||
      current.month !== payload.month
    ) {
      const conflict = await Budget.findOne({
        ownerKey,
        categoryId: payload.categoryId,
        month: payload.month,
        _id: { $ne: current._id },
      });

      if (conflict) {
        conflict.limit = payload.limit;
        if (payload.user) conflict.user = payload.user;
        await conflict.save();
        await current.deleteOne();
        return res.json(serialize(conflict));
      }
    }

    current.categoryId = payload.categoryId;
    current.month = payload.month;
    current.limit = payload.limit;
    if (payload.user) current.user = payload.user;

    await current.save();

    res.json(serialize(current));
  } catch (e) {
    if (e?.name === "ValidationError") {
      const first = Object.values(e.errors || {})[0];
      const message = typeof first?.message === "string" ? first.message : "Validation failed.";
      return res.status(400).json({ error: message });
    }
    if (e?.code === 11000) {
      console.error("Duplicate budget detected during update:", e);
      return res
        .status(409)
        .json({ error: "Budget already exists for this category and month." });
    }
    console.error("Failed to update budget:", e);
    res.status(500).json({ error: "Failed to update budget." });
  }
});

// DELETE /api/budgets/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const ownerKey = typeof req.user.id === "string" ? req.user.id.trim() : "";
    if (!ownerKey) return res.status(400).json({ error: "Invalid user id." });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });

    const isObjectId = mongoose.Types.ObjectId.isValid(ownerKey);
    const clause = isObjectId
      ? { _id: id, $or: [{ ownerKey }, { user: ownerKey }] }
      : { _id: id, ownerKey };

    const ok = await Budget.findOneAndDelete(clause);
    if (!ok) return res.status(404).json({ error: "Not found" });

    res.json({ ok: true });
  } catch (e) {
    console.error("Failed to delete budget:", e);
    res.status(500).json({ error: "Failed to delete budget." });
  }
});

export default router;
