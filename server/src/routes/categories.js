// server/src/routes/categories.js
import express from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import Category, { SHARED_OWNER_KEY } from "../models/Category.js";

const router = express.Router();

function stringifyId(doc) {
  if (!doc) return "";
  if (typeof doc.id === "string" && doc.id.length > 0) return doc.id;
  if (doc._id) return doc._id.toString();
  return "";
}

function serialize(doc) {
  if (!doc) return null;
  const json = doc.toObject({ versionKey: false });
  json._id = doc._id?.toString();
  if (json.user && typeof json.user === "object") {
    json.user = json.user.toString();
  }
  if (typeof json.ownerKey !== "undefined") {
    delete json.ownerKey;
  }
  if (typeof json.userId !== "undefined") {
    delete json.userId;
  }
  return json;
}

// Вспомогательная функция: получить массив категорий (owned + shared) для пользователя
async function loadCategoriesForOwner(ownerKey) {
  const isObjectId = mongoose.Types.ObjectId.isValid(ownerKey);
  const userClause = isObjectId ? { user: ownerKey } : null;

  const [owned, shared] = await Promise.all([
    Category.find(
      userClause
        ? { $or: [{ ownerKey }, userClause] }
        : { ownerKey }
    ).sort({ name: 1 }),
    Category.find({ ownerKey: SHARED_OWNER_KEY }).sort({ name: 1 }),
  ]);

  const map = new Map();
  for (const doc of owned) map.set(stringifyId(doc), doc);
  for (const doc of shared) {
    const key = stringifyId(doc);
    if (!map.has(key)) map.set(key, doc);
  }

  return Array.from(map.values()).map(serialize).filter(Boolean);
}

// GET /api/categories
router.get("/", requireAuth, async (req, res) => {
  try {
    const ownerKey = typeof req.user.id === "string" ? req.user.id.trim() : "";
    if (!ownerKey) {
      return res.status(400).json({ error: "Invalid user id." });
    }
    console.log(`📂 Fetching categories for user ${ownerKey}`);
    const combined = await loadCategoriesForOwner(ownerKey);
    console.log(`📂 Returning ${combined.length} categories`);
    res.json(combined);
  } catch (err) {
    console.error("❌ Failed to fetch categories:", err);
    res.status(500).json({ error: "Failed to load categories." });
  }
});

// ✅ Алиас: GET /api/categories/all (для совместимости с твоими curl-проверками)
router.get("/all", requireAuth, async (req, res) => {
  try {
    const ownerKey = typeof req.user.id === "string" ? req.user.id.trim() : "";
    if (!ownerKey) {
      return res.status(400).json({ error: "Invalid user id." });
    }
    console.log(`📂 (alias /all) Fetching categories for user ${ownerKey}`);
    const combined = await loadCategoriesForOwner(ownerKey);
    res.json(combined);
  } catch (err) {
    console.error("❌ Failed to fetch categories (alias /all):", err);
    res.status(500).json({ error: "Failed to load categories." });
  }
});

// POST /api/categories
router.post("/", requireAuth, async (req, res) => {
  try {
    const ownerKey = typeof req.user.id === "string" ? req.user.id.trim() : "";
    if (!ownerKey) {
      return res.status(400).json({ error: "Invalid user id." });
    }
    if (ownerKey === SHARED_OWNER_KEY) {
      return res.status(400).json({ error: "Invalid category owner." });
    }
    const objectId = mongoose.Types.ObjectId.isValid(ownerKey) ? ownerKey : null;

    const payload = {
      id: req.body.id?.trim(),
      name: req.body.name?.trim(),
      type: req.body.type,
      ownerKey,
    };
    if (objectId) {
      payload.user = objectId;
    }
    if (!payload.id || !payload.name) {
      return res.status(400).json({ error: "Name and id are required." });
    }
    const doc = await Category.create(payload);
    console.log(`✅ Created category ${payload.id} for user ${req.user.id}`);
    res.status(201).json(serialize(doc));
  } catch (err) {
    if (err.code === 11000) {
      console.warn(`⚠️ Duplicate category ${req.body.id} for user ${req.user.id}`);
      return res.status(409).json({ error: "Category with this id already exists." });
    }
    console.error("Failed to create category:", err);
    res.status(500).json({ error: "Failed to create category." });
  }
});

// DELETE /api/categories/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const ownerKey = typeof req.user.id === "string" ? req.user.id.trim() : "";
  if (!ownerKey) {
    return res.status(400).json({ error: "Invalid user id." });
  }
  const isObjectId = mongoose.Types.ObjectId.isValid(ownerKey);
  const idFilter = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
  const orFilters = [{ ownerKey, ...idFilter }];
  if (isObjectId) {
    orFilters.push({ user: ownerKey, ...idFilter });
  }

  const ok = await Category.findOneAndDelete({ $or: orFilters });
  if (!ok) {
    console.warn(`⚠️ Category not found for deletion (${id}) by user ${req.user.id}`);
    return res.status(404).json({ error: "Not found" });
  }
  console.log(`🗑️ Deleted category ${stringifyId(ok)} for user ${req.user.id}`);
  res.json({ ok: true });
});

export default router;
