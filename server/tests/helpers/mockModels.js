import mongoose from "mongoose";
import Budget from '../../src/models/Budget.js';
import Category from '../../src/models/Category.js';

const SHARED_OWNER_KEY = "shared";


function createDoc(initial) {
  const doc = {
    ...initial,
    _id: initial._id || new mongoose.Types.ObjectId(),
    createdAt: initial.createdAt || new Date(),
    updatedAt: initial.updatedAt || new Date(),
  };

  Object.defineProperty(doc, "toObject", {
    enumerable: false,
    value(options = {}) {
      const clone = { ...doc };
      if (options.versionKey === false) {
        delete clone.__v;
      }
      return clone;
    },
  });

  Object.defineProperty(doc, "save", {
    enumerable: false,
    async value() {
      doc.updatedAt = new Date();
      return doc;
    },
  });

  Object.defineProperty(doc, "lean", {
    enumerable: false,
    value() {
      return doc.toObject();
    },
  });

  return doc;
}

function matches(doc, query = {}) {
  if (!query || Object.keys(query).length === 0) return true;

  if (Array.isArray(query.$or)) {
    return query.$or.some((clause) => matches(doc, clause));
  }

  return Object.entries(query).every(([key, value]) => {
    if (key === "$or") return true;
    const docValue = doc[key];
    if (value && typeof value === "object" && "$ne" in value) {
      return docValue !== value.$ne;
    }
    return String(docValue) === String(value);
  });
}

function sortDocs(list, sortSpec = {}) {
  const entries = Object.entries(sortSpec);
  if (!entries.length) return [...list];

  return [...list].sort((a, b) => {
    for (const [field, direction] of entries) {
      const dir = direction >= 0 ? 1 : -1;
      let cmp = 0;

      if (field === "month") {
        cmp = a.month.localeCompare(b.month);
      } else if (field === "name") {
        cmp = (a.name || "").localeCompare(b.name || "");
      } else if (field === "createdAt" || field === "updatedAt") {
        cmp = new Date(a[field]) - new Date(b[field]);
      } else {
        cmp = String(a[field] || "").localeCompare(String(b[field] || ""));
      }

      if (cmp !== 0) {
        return dir === 1 ? cmp : -cmp;
      }
    }
    return 0;
  });
}

export function mockBudgetModel() {
  const store = [];
  const originals = {
    find: Budget.find?.bind(Budget),
    findOne: Budget.findOne?.bind(Budget),
    create: Budget.create?.bind(Budget),
    deleteOne: Budget.deleteOne?.bind(Budget),
    findOneAndDelete: Budget.findOneAndDelete?.bind(Budget),
  };

  Budget.find = (query = {}) => ({
    sort(sortSpec = {}) {
      return Promise.resolve(sortDocs(store.filter((doc) => matches(doc, query)), sortSpec));
    },
  });

  Budget.findOne = async (query = {}) => store.find((doc) => matches(doc, query)) || null;

  Budget.create = async (payload = {}) => {
    const base = { ...payload };
    if (!base.id) {
      base.id = [base.ownerKey, base.categoryId, base.month].map((part) => String(part ?? "").trim()).join(":");
    }
    const doc = createDoc(base);
    store.push(doc);
    return doc;
  };

  Budget.deleteOne = async (query = {}) => {
    const index = store.findIndex((doc) => matches(doc, query));
    if (index === -1) return { deletedCount: 0 };
    store.splice(index, 1);
    return { deletedCount: 1 };
  };

  Budget.findOneAndDelete = async (query = {}) => {
    const index = store.findIndex((doc) => matches(doc, query));
    if (index === -1) return null;
    const [removed] = store.splice(index, 1);
    return removed;
  };

  return {
    store,
    reset() {
      store.length = 0;
    },
    restore() {
      if (originals.find) Budget.find = originals.find;
      if (originals.findOne) Budget.findOne = originals.findOne;
      if (originals.create) Budget.create = originals.create;
      if (originals.deleteOne) Budget.deleteOne = originals.deleteOne;
      if (originals.findOneAndDelete) Budget.findOneAndDelete = originals.findOneAndDelete;
    },
  };
}

export function mockCategoryModel() {
  const store = [];
  const originals = {
    find: Category.find?.bind(Category),
    create: Category.create?.bind(Category),
    findOneAndDelete: Category.findOneAndDelete?.bind(Category),
  };

  // seed shared categories store with empty array
  const sharedStore = [];

  Category.find = (query = {}) => ({
    sort(sortSpec = {}) {
      let target;
      if (query.ownerKey === SHARED_OWNER_KEY) {
        target = sharedStore;
      } else if (Array.isArray(query.$or)) {
        target = store.filter((doc) => matches(doc, query));
      } else {
        target = store.filter((doc) => matches(doc, query));
      }
      return Promise.resolve(sortDocs(target, sortSpec));
    },
  });

  Category.create = async (payload = {}) => {
    if (
      store.some(
        (doc) =>
          doc.ownerKey === payload.ownerKey &&
          (doc.id === payload.id || String(doc._id) === String(payload._id)),
      )
    ) {
      const error = new Error("Duplicate category");
      error.code = 11000;
      throw error;
    }

    const doc = createDoc(payload);
    if (payload.ownerKey === SHARED_OWNER_KEY) {
      sharedStore.push(doc);
    } else {
      store.push(doc);
    }
    return doc;
  };

  Category.findOneAndDelete = async (query = {}) => {
    const target = query.ownerKey === SHARED_OWNER_KEY ? sharedStore : store;
    const index = target.findIndex((doc) => matches(doc, query));
    if (index === -1) return null;
    const [removed] = target.splice(index, 1);
    return removed;
  };

  return {
    store,
    sharedStore,
    reset() {
      store.length = 0;
      sharedStore.length = 0;
    },
    restore() {
      if (originals.find) Category.find = originals.find;
      if (originals.create) Category.create = originals.create;
      if (originals.findOneAndDelete) Category.findOneAndDelete = originals.findOneAndDelete;
    },
  };
}
