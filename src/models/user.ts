import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true, default: 'user' },
  password: { type: String, required: true },
  resetToken: { type: String, required: false },
  resetTokenExpiry: { type: Date, required: false },
}, { timestamps: true }

);

export const User =
  mongoose.models.users || mongoose.model("users", userSchema);
