import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

function serialize(doc) {
  const json = doc.toObject({ versionKey: false });
  json._id = doc._id?.toString();
  if (json.user && typeof json.user === "object") json.user = json.user.toString();
  if ("ownerKey" in json) delete json.ownerKey;
  if ("userId" in json) delete json.userId;
  return json;
}

const TxBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  categoryId: z.string().min(1),
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
});

// GET /api/transactions
router.get("/", requireAuth, async (req, res) => {
  try {
    const ownerKey = typeof req.user.id === "string" ? req.user.id.trim() : "";
    if (!ownerKey) return res.status(400).json({ error: "Invalid user id." });

    const isObjectId = mongoose.Types.ObjectId.isValid(ownerKey);
    const clause = isObjectId
      ? { $or: [{ ownerKey }, { user: ownerKey }] }
      : { ownerKey };

    const list = await Transaction.find(clause).sort({ date: -1, createdAt: -1 });
    res.json(list.map(serialize));
  } catch (e) {
    console.error("❌ Failed to fetch transactions:", e);
    res.status(500).json({ error: "Failed to load transactions." });
  }
});

// POST /api/transactions
router.post("/", requireAuth, async (req, res) => {
  try {
    const ownerKey = typeof req.user.id === "string" ? req.user.id.trim() : "";
    if (!ownerKey) return res.status(400).json({ error: "Invalid user id." });

    const parsed = TxBody.safeParse({
      ...req.body,
      amount: Number(req.body?.amount),
    });
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues?.[0]?.message || "Bad payload" });
    }

    const payload = { ...parsed.data, ownerKey };
    if (mongoose.Types.ObjectId.isValid(ownerKey)) payload.user = ownerKey;

    const doc = await Transaction.create(payload);
    res.status(201).json(serialize(doc));
  } catch (e) {
    console.error("❌ Failed to create transaction:", e);
    res.status(500).json({ error: "Failed to create transaction." });
  }
});

// PUT /api/transactions/:id
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const ownerKey = typeof req.user.id === "string" ? req.user.id.trim() : "";
    if (!ownerKey) return res.status(400).json({ error: "Invalid user id." });

    const parsed = TxBody.safeParse({
      ...req.body,
      amount: Number(req.body?.amount),
    });
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues?.[0]?.message || "Bad payload" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });

    const isObjectId = mongoose.Types.ObjectId.isValid(ownerKey);
    const clause = isObjectId
      ? { _id: id, $or: [{ ownerKey }, { user: ownerKey }] }
      : { _id: id, ownerKey };

    const updated = await Transaction.findOneAndUpdate(clause, parsed.data, { new: true });
    if (!updated) return res.status(404).json({ error: "Not found" });

    res.json(serialize(updated));
  } catch (e) {
    console.error("❌ Failed to update transaction:", e);
    res.status(500).json({ error: "Failed to update transaction." });
  }
});

// DELETE /api/transactions/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const ownerKey = typeof req.user.id === "string" ? req.user.id.trim() : "";
    if (!ownerKey) return res.status(400).json({ error: "Invalid user id." });

    const { id } = req.params;
    const isId = mongoose.Types.ObjectId.isValid(id);
    if (!isId) return res.status(400).json({ error: "Invalid id" });

    const isObjectId = mongoose.Types.ObjectId.isValid(ownerKey);
    const clause = isObjectId
      ? { _id: id, $or: [{ ownerKey }, { user: ownerKey }] }
      : { _id: id, ownerKey };

    const ok = await Transaction.findOneAndDelete(clause);
    if (!ok) return res.status(404).json({ error: "Not found" });

    res.json({ ok: true });
  } catch (e) {
    console.error("❌ Failed to delete transaction:", e);
    res.status(500).json({ error: "Failed to delete transaction." });
  }
});

export default router;
