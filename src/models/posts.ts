import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  post: { type: String, required: true },
  createdBy: { type: String, required: true },
}, { timestamps: true }

);

export const Post =
  mongoose.models.posts || mongoose.model("posts", postSchema);
