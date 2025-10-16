// server/src/routes/seed.js
import { Router } from "express";
import mongoose from "mongoose";
import Category, { SHARED_OWNER_KEY } from "../models/Category.js";
import { defaultCategories } from "../utils/defaultCategories.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  const defaults = [
    { id: "salary", name: "Salary", type: "income" },
    { id: "groceries", name: "Groceries", type: "expense" },
    { id: "rent", name: "Rent", type: "expense" },
  ];
  const ownerKey = typeof req.user.id === "string" ? req.user.id.trim() : "";
  if (!ownerKey) {
    return res.status(400).json({ error: "Invalid user id." });
  }
  const asObjectId = mongoose.Types.ObjectId.isValid(ownerKey) ? ownerKey : null;
  const docs = defaults.map((c) => ({
    ...c,
    ownerKey,
    ...(asObjectId ? { user: asObjectId } : {}),
  }));

  for (const doc of docs) {
    const { id, ownerKey, name, type, ...rest } = doc;
    await Category.findOneAndUpdate(
      { id, ownerKey },
      {
        $set: { name, type },
        $setOnInsert: { id, ownerKey, ...rest },
      },
      { upsert: true, new: true }
    );
  }
  res.json({ ok: true, added: docs.length });
});

export async function ensureDefaultCategories() {
  const collection = Category.collection;
  try {
    if (await collection.indexExists("id_1")) {
      await collection.dropIndex("id_1");
      console.log("🧹 Dropped legacy categories.id unique index");
    }
  } catch (err) {
    console.warn("ℹ️ Unable to drop legacy categories.id index (may already be removed):", err.message);
  }
  await Category.syncIndexes();

  await backfillOwnerKeys();

  const defaults = defaultCategories.map(({ id, name, type }) => ({
    id,
    name,
    type,
    ownerKey: SHARED_OWNER_KEY,
  }));

  let created = 0;
  for (const doc of defaults) {
    const { id, ownerKey, name, type, ...rest } = doc;
    const result = await Category.updateOne(
      { id, ownerKey: SHARED_OWNER_KEY },
      {
        $set: { name, type },
        $setOnInsert: { id, ownerKey, ...rest },
      },
      { upsert: true }
    );
    if (result.upsertedCount > 0) {
      created += result.upsertedCount;
    }
  }

  if (created > 0) {
    console.log(`✅ Default categories ensured (${created} inserted)`);
  } else {
    console.log("ℹ️ Default categories already present");
  }
}

async function backfillOwnerKeys() {
  const cursor = Category.collection.find(
    { ownerKey: { $exists: false } },
    { projection: { _id: 1, user: 1, userId: 1 } }
  );

  const ops = [];
  let processed = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const ownerKey =
      doc.user ? doc.user.toString() : doc.userId ? String(doc.userId) : SHARED_OWNER_KEY;
    ops.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { ownerKey } },
      },
    });
    if (ops.length >= 500) {
      await Category.collection.bulkWrite(ops, { ordered: false });
      processed += ops.length;
      ops.length = 0;
    }
  }
  if (ops.length) {
    await Category.collection.bulkWrite(ops, { ordered: false });
    processed += ops.length;
  }
  if (processed > 0) {
    console.log(`🔧 Backfilled ownerKey for ${processed} categories`);
  }
}

export default router;
