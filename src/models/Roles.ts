import mongoose from 'mongoose';

export const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: String,
    permissions: [{
        module_id: String,
        module_name: String,
        create: Boolean,
        read: Boolean,
        update: Boolean,
        delete: Boolean,
    }],
    adminPermissions: {
        can_access_admin_panel: Boolean,
        can_change_gemini_api_key: Boolean,
        can_change_gemini_prompts: Boolean,
        can_change_company_settings: Boolean,
        can_change_gemini_model: Boolean,
        can_access_roles: Boolean,
        can_edit_roles: Boolean,
    },
    userPermissions: {
        can_delete_users: Boolean,
        can_update_user_password: Boolean,
        can_update_users: Boolean,
        can_change_gemini_model: Boolean,
    }
}, {
    timestamps: true
});

export const Role =
    mongoose.models.roles || mongoose.model("roles", roleSchema); 
