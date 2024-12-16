import mongoose from 'mongoose';

const filterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    filters: { type: mongoose.Schema.Types.Mixed, required: true },
    sorting: { type: mongoose.Schema.Types.Mixed, required: true },
    tableName: { type: String, required: true },
    createdBy: { type: String, required: true },
}, {
    timestamps: true
});

// Add indexes
filterSchema.index({ createdBy: 1 });
filterSchema.index({ tableName: 1 });

export const Filter = mongoose.models.Filter || mongoose.model('Filter', filterSchema); 