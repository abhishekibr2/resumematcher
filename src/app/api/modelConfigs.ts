import { Resume } from "@/models/resume"
import { Status } from "@/models/Status"
import { User } from "@/models/user"
import { Post } from "@/models/posts"

export const modelConfigs = {
  resume: {
    model: Resume,
    searchableFields: ['fullName', 'contact.email', 'contact.phone', 'status'],
    exportFields: ['fullName', 'contact.email', 'contact.phone', 'stats.Expertise'],
    importFields: ['fullName', 'contact.email', 'contact.phone', 'stats.Expertise'],
    permissions: ['read', 'create', 'update', 'delete', 'bulk-operation']
  },
  posts: {
    model: Post,
    searchableFields: ['title', 'post', 'createdBy'],
    exportFields: ['title', 'post', 'createdBy'],
    importFields: ['title', 'post', 'createdBy'],
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