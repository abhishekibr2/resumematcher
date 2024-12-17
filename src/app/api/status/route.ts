import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { authOptions } from "@/utils/authOptions";
import { Status } from "@/models/Status";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "You are not logged in" });
        }
        await connectToDatabase();
        const status = await Status.find({}).lean() // Use .lean() for better performance

        // Convert MongoDB documents to plain objects
        const statusData = status.map((status: any) => ({
            _id: status._id.toString(),
            status: status.status,
            createdBy: status.createdBy,
            color: status.color
        }));
        if (!status) {
            return NextResponse.json({ message: "Status not found" }, { status: 404 });
        }
        return NextResponse.json(statusData);
    } catch (error) {
        console.error("Error fetching status:", error);
        return NextResponse.json(
            { message: "Error fetching status" },
            { status: 500 }
        );
    }
}
