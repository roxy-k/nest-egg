import mongoose from "mongoose";

export const SHARED_OWNER_KEY = "__shared__";

const CategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true }, 
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, default: undefined },
    ownerKey: { type: String, required: true, index: true, default: SHARED_OWNER_KEY },
  },
  { timestamps: true }
);

CategorySchema.index(
  { user: 1, id: 1 },
  { unique: true, partialFilterExpression: { user: { $type: "objectId" } } }
);
CategorySchema.index({ ownerKey: 1, id: 1 }, { unique: true });

export default mongoose.model("Category", CategorySchema);
