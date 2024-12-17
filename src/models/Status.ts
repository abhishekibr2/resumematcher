import mongoose from "mongoose";

const statusSchema = new mongoose.Schema({
  status: { type: String, required: true },
  color: { type: String, required: true, default: '#000000' },
  createdBy: { type: String, required: true },
}, { timestamps: true }

);

export const Status =
  mongoose.models.status || mongoose.model("status", statusSchema);
