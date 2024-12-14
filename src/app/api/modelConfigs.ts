import { Prompt } from "@/models/Prmopt"
import { Resume } from "@/models/resume"

export const modelConfigs = {
  resume: {
    model: Resume,
    searchableFields: ['fullName', 'contact.email', 'contact.phone', 'status.Expertise'],
    exportFields: ['fullName', 'contact.email', 'contact.phone', 'status.Expertise'],
    importFields: ['fullName', 'contact.email', 'contact.phone', 'status.Expertise'],
    permissions: ['read', 'create', 'update', 'delete', 'bulk-operation']
  },
  prompt: {
    model: Prompt,
    searchableFields: ['title', 'prompt'],
    exportFields: ['title', 'prompt'],
    importFields: ['title', 'prompt'],
    permissions: ['read', 'create', 'update', 'delete', 'bulk-operation']
  }
}

export type ModelConfigKey = keyof typeof modelConfigs 