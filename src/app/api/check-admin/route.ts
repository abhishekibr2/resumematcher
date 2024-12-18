import { NextResponse } from 'next/server';
import { Role } from '@/models/Roles';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json(
        { ok: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const userRole = await Role.findById(role);

    if (!userRole) {
      return NextResponse.json(
        { ok: false, message: "Role not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      userRole,
    });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json(
      { ok: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}