// server/src/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    name: { type: String, default: "" },
    passwordHash: { type: String, default: "" }, // пусто для Google OAuth
    provider: { type: String, default: "local" }, // "local" | "google"
    passwordResetTokenHash: { type: String, default: "" },
    passwordResetExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("User", UserSchema);
