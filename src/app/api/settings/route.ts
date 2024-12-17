import { NextResponse } from 'next/server';
import Settings from '@/models/settings';
import { connectToDatabase } from '@/lib/mongodb';
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from 'next-auth';
import { User } from '@/models/user';
import Roles from '@/models/Roles';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "You are not logged in" });
        }
        await connectToDatabase();
        const settings = await Settings.findOne({});

        return NextResponse.json({
            success: true,
            settings: {
                companyName: settings.companyName,
                geminiApiKey: settings.geminiApiKey,
                redirectToResume: settings.redirectToResume,
                overwritePrompt: settings.overwritePrompt,
                geminiModel: settings.geminiModel,
            }
        });
    } catch (error) {
        console.log(error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, message: "You are not logged in" },
                { status: 401 }
            );
        }

        await connectToDatabase();
        const user = await User.findOne({ email: session?.user?.email });
        const role = await Roles.findById(user.role);
        if (!role) {
            console.log("Role not found");
            return NextResponse.json(
                { success: false, message: "Role not found" },
                { status: 403 }
            );
        }

        // Check permissions based on what's being updated
        if (body.geminiApiKey !== undefined && !role.adminPermissions.can_change_gemini_api_key) {
            console.log("You don't have permission to change API key");
            return NextResponse.json(
                { success: false, message: "You don't have permission to change API key" },
                { status: 403 }
            );
        }

        if (body.overwritePrompt !== undefined && !role.adminPermissions.can_change_gemini_prompts) {
            console.log("You don't have permission to change prompts"); 
            return NextResponse.json(
                { success: false, message: "You don't have permission to change prompts" },
                { status: 403 }
            );
        }

        if (body.geminiModel !== undefined && !role.adminPermissions.can_change_gemini_model) {
            console.log("You don't have permission to change Gemini model");
            return NextResponse.json(
                { success: false, message: "You don't have permission to change Gemini model" },
                { status: 403 }
            );
        }

        if (body.companyName !== undefined && !role.adminPermissions.can_change_company_settings) {
            console.log("You don't have permission to change company settings");
            return NextResponse.json(
                { success: false, message: "You don't have permission to change company settings" },
                { status: 403 }
            );
        }

        // If all permission checks pass, proceed with the update
        let settings = await Settings.findOne({});

        if (!settings) {
            settings = new Settings({
                companyName: body.companyName,
                geminiApiKey: body.geminiApiKey,
                redirectToResume: body.redirectToResume,
                overwritePrompt: body.overwritePrompt,
                geminiModel: body.geminiModel,
            });
        } else {
            // Only update fields that the user has permission to change
            if (role.adminPermissions.can_change_company_settings) {
                settings.companyName = body.companyName;
                settings.redirectToResume = body.redirectToResume;
            }
            if (role.adminPermissions.can_change_gemini_api_key) {
                settings.geminiApiKey = body.geminiApiKey;
            }
            if (role.adminPermissions.can_change_gemini_prompts) {
                settings.overwritePrompt = body.overwritePrompt;
            }
            if (role.adminPermissions.can_change_gemini_model) {
                settings.geminiModel = body.geminiModel;
            }
        }

        await settings.save();

        return NextResponse.json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Settings update error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update settings' },
            { status: 500 }
        );
    }
} 