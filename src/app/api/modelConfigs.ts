import { Prompt } from "@/models/Prmopt"
import { Resume } from "@/models/resume"
import { Status } from "@/models/Status"
import { User } from "@/models/user"

export const modelConfigs = {
  resume: {
    model: Resume,
    searchableFields: ['fullName', 'contact.email', 'contact.phone', 'stats.Expertise'],
    exportFields: ['fullName', 'contact.email', 'contact.phone', 'stats.Expertise'],
    importFields: ['fullName', 'contact.email', 'contact.phone', 'stats.Expertise'],
    permissions: ['read', 'create', 'update', 'delete', 'bulk-operation']
  },
  prompt: {
    model: Prompt,
    searchableFields: ['title', 'prompt'],
    exportFields: ['title', 'prompt'],
    importFields: ['title', 'prompt'],
    permissions: ['read', 'create', 'update', 'delete', 'bulk-operation']
  },
  users: {
    model: User,
    searchableFields: ['name', 'email', 'role'],
    exportFields: ['name', 'email', 'role'],
    importFields: ['name', 'email', 'role'],
    permissions: ['read', 'create', 'update', 'delete', 'bulk-operation']
  },
  status: {
    model: Status,
    searchableFields: ['status'],
    exportFields: ['status'],
    importFields: ['status'],
    permissions: ['read', 'create', 'update', 'delete', 'bulk-operation']
  }
}

export type ModelConfigKey = keyof typeof modelConfigs 