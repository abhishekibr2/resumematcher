import mongoose from "mongoose";
const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zip: String,
  country: String,
});

const contactSchema = new mongoose.Schema({
  email: { type: String, required: false },
  phone: String,
  linkedin: String,
  address: addressSchema,
});

const workExperienceSchema = new mongoose.Schema({
  company: { type: String, required: false },
  position: { type: String, required: false },
  startDate: { type: String, required: false },
  endDate: String,
  responsibilities: [String],
});

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: false },
  degree: { type: String, required: false },
  startDate: { type: String, required: false },
  endDate: String,
  grade: String,
});

const certificationSchema = new mongoose.Schema({
  name: { type: String, required: false },
  issuer: { type: String, required: false },
  dateIssued: { type: String, required: false },
});

const projectSchema = new mongoose.Schema({
  name: { type: String, required: false },
  description: String,
  technologies: [String],
  url: String,
});

const languageSchema = new mongoose.Schema({
  language: { type: String, required: false },
  proficiency: String,
});

const resumeSchema = new mongoose.Schema({
  fullName: { type: String, required: false },
  contact: contactSchema,
  summary: String,
  skills: [String],
  custom_status: String,
  workExperience: [workExperienceSchema],
  education: [educationSchema],
  certifications: [certificationSchema],
  projects: [projectSchema],
  languages: [languageSchema],
  status: {
    Expertise: String,
    Rating: Number,
    should_contact: Boolean
  },
  checked: {
    type: Boolean,
    default: false
  }
},
  {
    timestamps: true
  });



export const Resume =
  mongoose.models.resume || mongoose.model("resume", resumeSchema);