import { NextResponse } from 'next/server';
import { User } from '@/models/user';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';
import { connectToDatabase } from '@/lib/mongodb';

// Configure your email transport here
const transporter = nodemailer.createTransport({
  // Replace with your email service configuration
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email } = await req.json();

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether a user exists or not
      return NextResponse.json(
        { message: "If you have an account with us, you will receive an email with instructions to reset your password." },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await User.findByIdAndUpdate(user._id, {
      resetToken,
      resetTokenExpiry,
    });

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset.</p>
        <p>Click this <a href="${resetUrl}">link</a> to reset your password.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    return NextResponse.json(
      { message: "If you have an account with us, you will receive an email with instructions to reset your password." },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { message: "If you have an account with us, you will receive an email with instructions to reset your password." },
      { status: 500 }
    );
  }
}
