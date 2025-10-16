import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    ownerKey: { type: String, index: true, required: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    date: { type: String, required: true },            
    categoryId: { type: String, required: true },      
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, min: 0.01, required: true },
  },
  { timestamps: true }
);

TransactionSchema.index({ ownerKey: 1, date: -1 });
TransactionSchema.index({ ownerKey: 1, categoryId: 1, date: -1 });

export default mongoose.model("Transaction", TransactionSchema);
