import mongoose from "mongoose";

const columnSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['string', 'number', 'boolean', 'date'],
  },
  required: {
    type: Boolean,
    default: false,
  },
});

export const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    columns: [columnSchema],
  },
  {
    timestamps: true,
  }
);

const Module = mongoose.models.Module || mongoose.model("Module", moduleSchema);

export default Module;
