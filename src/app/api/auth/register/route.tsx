import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/user";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();

    // Check if user with same email exists
    const existingUser = await User.findOne({
      email: data.email
    });

    if (existingUser) {
      return NextResponse.json({
        ok: false,
        message: "Email already exists."
      }, { status: 409 });
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // Create new user with hashed password
    const newUser = await User.create({
      ...data,
      password: hashedPassword,
      authenticationType: 'credentials'
    });

    // Remove password from response
    const userWithoutPassword = {
      ...newUser.toObject(),
      password: undefined
    };

    return NextResponse.json({
      ok: true,
      message: "User registered successfully",
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json({
      ok: false,
      message: "Internal server error"
    }, { status: 500 });
  }
}
