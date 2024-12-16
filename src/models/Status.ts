import mongoose from "mongoose";

const statusSchema = new mongoose.Schema({
  status: { type: String, required: true },
  createdBy: { type: String, required: true },
}, { timestamps: true }

);

export const Status =
  mongoose.models.status || mongoose.model("status", statusSchema);
