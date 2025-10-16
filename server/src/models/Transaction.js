import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    // владелец (строка, как в categories: ownerKey = user.id или SHARED)
    ownerKey: { type: String, index: true, required: true },

    // привязка к пользователю как ObjectId — опционально
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // бизнес-поля
    date: { type: String, required: true },            // "YYYY-MM-DD"
    categoryId: { type: String, required: true },      // slug категории (а не _id)
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, min: 0.01, required: true },
  },
  { timestamps: true }
);

TransactionSchema.index({ ownerKey: 1, date: -1 });
TransactionSchema.index({ ownerKey: 1, categoryId: 1, date: -1 });

export default mongoose.model("Transaction", TransactionSchema);
