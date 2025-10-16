import mongoose from "mongoose";

const BudgetSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, sparse: true },
    ownerKey: { type: String, index: true, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // опц.

    categoryId: { type: String, required: true }, // slug категории
    month: { type: String, required: true },      // YYYY-MM
    limit: { type: Number, required: true, min: 0.01 },
  },
  { timestamps: true }
);

BudgetSchema.index({ ownerKey: 1, categoryId: 1, month: 1 }, { unique: true });

BudgetSchema.pre("validate", function handleBudgetId(next) {
  if (!this.id) {
    const owner = String(this.ownerKey ?? "").trim();
    const cat = String(this.categoryId ?? "").trim();
    const month = String(this.month ?? "").trim();
    this.id = [owner, cat, month].join(":");
  }
  next();
});

export default mongoose.model("Budget", BudgetSchema);
