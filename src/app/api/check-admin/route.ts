import { NextResponse } from 'next/server';
import { Role } from '@/models/Roles';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();
    const { role } = data;
    if (!role) {
      return NextResponse.json({
        ok: false,
        userRole: null,
        message: "No role provided"
      }, { status: 400 });
    }

    const userRole = await Role.findById(role);

    if (!userRole) {
      return NextResponse.json({
        ok: false,
        userRole: null,
        message: "Role not found"
      }, { status: 404 });
    }


    return NextResponse.json({
      ok: true,
      userRole: userRole
    });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({
      ok: false,
      userRole: null,
      message: "Internal server error"
    }, { status: 500 });
  }
}