import mongoose from 'mongoose';

export interface ModulePermission {
  module_id: string;
  module_name: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface AdminPermission {
  can_access_admin_panel: boolean;
  can_change_gemini_api_key: boolean;
  can_change_gemini_prompts: boolean;
  can_change_company_settings: boolean;
  can_change_gemini_model: boolean;
}

export interface UserPermission {
  can_delete_users: boolean;
  can_update_user_password: boolean;
  can_update_users: boolean;
  can_change_gemini_model: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: ModulePermission[];
  adminPermissions: AdminPermission;
  userPermissions: UserPermission;
}

const RoleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            required: false,
        },
        permissions: [
            {
                module_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Module',
                    required: true,
                },
                module_name: {
                    type: String,
                    required: true,
                },
                read: {
                    type: Boolean,
                    default: false,
                },
                create: {
                    type: Boolean,
                    default: false,
                },
                update: {
                    type: Boolean,
                    default: false,
                },
                delete: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        adminPermissions: {
            can_access_admin_panel: {
                type: Boolean,
                default: false
            },
            can_change_gemini_api_key: {
                type: Boolean,
                default: false
            },
            can_change_gemini_prompts: {
                type: Boolean,
                default: false
            },
            can_change_company_settings: {
                type: Boolean,
                default: false
            },
            can_change_gemini_model: {
                type: Boolean,
                default: false
            }
        },
        userPermissions: {
            can_delete_users: {
                type: Boolean,
                default: false
            },
            can_update_user_password: {
                type: Boolean,
                default: false
            },
            can_update_users: {
                type: Boolean,
                default: false
            }
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Roles || mongoose.model('Roles', RoleSchema);
