import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Module from '@/models/Module';

export async function GET() {
  try {
    await connectToDatabase();
    const modules = await Module.find({}).sort({ createdAt: -1 });

    return NextResponse.json({
      ok: true,
      modules
    });
  } catch (error) {
    console.error("Error fetching modules:", error);
    return NextResponse.json({
      ok: false,
      message: "Internal server error"
    }, { status: 500 });
  }
}

