import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/user";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();
    
    // Find user by email
    const user = await User.findOne({ email: data.email });

    if (!user) {
      return NextResponse.json({
        ok: false,
        message: "Invalid credentials",
        status: 401
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      return NextResponse.json({
        ok: false,
        message: "Invalid credentials",
        status: 401
      });
    }

    // Remove password from response
    const userWithoutPassword = {
      ...user.toObject(),
      password: undefined
    };

    return NextResponse.json({
      ok: true,
      message: "Login successful",
      user: userWithoutPassword,
      status: 200
    });

  } catch (error) {
    console.error("Error Login user:", error);
    return NextResponse.json({
      ok: false,
      message: "Internal server error",
      status: 500
    });
  }
}
