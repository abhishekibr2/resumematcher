import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  geminiApiKey: {
    type: String,
    required: true,
  },
  redirectToResume: {
    type: Boolean,
    default: false,
  },
  overwritePrompt: {
    type: String,
    required: false,
  },
  geminiModel: {
    type: String,
    required: false,
  }
}, { timestamps: true });

// Since we only want one settings document, we'll use a constant ID
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      companyName: 'Default Company',
      geminiApiKey: '',
      redirectToResume: false,
      overwritePrompt: '',
    });
  }
  return settings;
};

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

export default Settings; 