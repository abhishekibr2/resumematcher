import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/user";

export async function GET() {
    try {
        await connectToDatabase();
        
        // Fetch all users that have created resumes (HR users)
        const hrUsers = await User.find(
            { role: "676261d48c23ae37e333c63c" }, // Only get users with roles
            { name: 1, _id: 1 } // Only get name and _id fields
        );

        return NextResponse.json(hrUsers);
    } catch (error) {
        console.error('Failed to fetch HR users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch HR users' },
            { status: 500 }
        );
    }
}
