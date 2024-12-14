import mongoose from "mongoose";

const promptSchema = new mongoose.Schema({
  title: { type: String, required: true },
  prompt: { type: String, required: true },
}, { timestamps: true }

);

export const Prompt =
  mongoose.models.prompts || mongoose.model("prompts", promptSchema);
