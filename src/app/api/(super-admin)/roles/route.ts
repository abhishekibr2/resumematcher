import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { User } from "@/models/user";
import { Role } from '@/models/Roles';

// Helper function to check permissions
async function checkEditPermission(userId: string) {
  const user = await User.findById(userId).populate('role');
  if (!user?.role?.adminPermissions?.can_edit_roles) {
    throw new Error('You do not have permission to modify roles');
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const roles = await Role.find({}).sort({ createdAt: -1 });

    return NextResponse.json({
      ok: true,
      roles
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({
      ok: false,
      message: "Internal server error"
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    // Get session and check permissions
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json({
        ok: false,
        message: "Unauthorized"
      }, { status: 401 });
    }

    // Check edit permission
    try {
      await checkEditPermission(session.user._id);
    } catch (error) {
      return NextResponse.json({
        ok: false,
        message: error instanceof Error ? error.message : "Unauthorized"
      }, { status: 403 });
    }

    const data = await request.json();

    // Check if role with same name exists
    const existingRole = await Role.findOne({ name: data.name });

    if (existingRole) {
      return NextResponse.json({
        ok: false,
        message: "Role with this name already exists."
      }, { status: 409 });
    }

    // Create new role
    const newRole = await Role.create({
      name: data.name,
      description: data.description,
      permissions: data.permissions,
      adminPermissions: data.adminPermissions || {
        can_access_admin_panel: false,
        can_change_gemini_api_key: false,
        can_change_gemini_prompts: false,
        can_change_company_settings: false,
        can_change_gemini_model: false,
        can_access_roles: false,
        can_edit_roles: false
      },
      userPermissions: data.userPermissions || {
        can_delete_users: false,
        can_update_user_password: false,
        can_update_users: false
      }
    });

    return NextResponse.json({
      ok: true,
      message: "Role created successfully",
      role: newRole
    });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json({
      ok: false,
      message: "Internal server error"
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();

    // Get session and check permissions
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json({
        ok: false,
        message: "Unauthorized"
      }, { status: 401 });
    }

    // Check edit permission
    try {
      await checkEditPermission(session.user._id);
    } catch (error) {
      return NextResponse.json({
        ok: false,
        message: error instanceof Error ? error.message : "Unauthorized"
      }, { status: 403 });
    }

    const { id, ...updateData } = await request.json();

    // Check if role with same name exists (excluding current role)
    const existingRole = await Role.findOne({
      name: updateData.name,
      _id: { $ne: id }
    });

    if (existingRole) {
      return NextResponse.json({
        ok: false,
        message: "Role with this name already exists."
      }, { status: 409 });
    }

    // Update role
    const updatedRole = await Role.findByIdAndUpdate(
      id,
      {
        ...updateData,
        // adminPermissions: updateData.adminPermissions || {
        //   can_access_admin_panel: false,
        //   can_change_gemini_api_key: false,
        //   can_change_gemini_prompts: false,
        //   can_change_company_settings: false,
        //   can_change_gemini_model: false,
        //   can_access_roles: false,
        //   can_edit_roles: false
        // },
        // userPermissions: updateData.userPermissions || {
        //   can_delete_users: false,
        //   can_update_user_password: false,
        //   can_update_users: false
        // }
      },
      { new: true } // Return updated document
    );

    if (!updatedRole) {
      return NextResponse.json({
        ok: false,
        message: "Role not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      message: "Role updated successfully",
      role: updatedRole
    });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({
      ok: false,
      message: "Internal server error"
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();

    // Get session and check permissions
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json({
        ok: false,
        message: "Unauthorized"
      }, { status: 401 });
    }

    // Check edit permission
    try {
      await checkEditPermission(session.user._id);
    } catch (error) {
      return NextResponse.json({
        ok: false,
        message: error instanceof Error ? error.message : "Unauthorized"
      }, { status: 403 });
    }

    const { id } = await request.json();

    const deletedRole = await Role.findByIdAndDelete(id);

    if (!deletedRole) {
      return NextResponse.json({
        ok: false,
        message: "Role not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      message: "Role deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json({
      ok: false,
      message: "Internal server error"
    }, { status: 500 });
  }
}
