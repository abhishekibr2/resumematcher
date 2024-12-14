import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { authOptions } from "@/utils/authOptions";
import { Prompt } from "@/models/Prmopt";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "You are not logged in" });
        }
        await connectToDatabase();
        const prompts = await Prompt.find({}).lean() // Use .lean() for better performance

        // Convert MongoDB documents to plain objects
        const promptsData = prompts.map((prompt: any) => ({
            _id: prompt._id.toString(),
            title: prompt.title,
            prompt: prompt.prompt
        }));
        if (!prompts) {
            return NextResponse.json({ message: "Prompts not found" }, { status: 404 });
        }
        return NextResponse.json(promptsData);
    } catch (error) {
        console.error("Error fetching prompts:", error);
        return NextResponse.json(
            { message: "Error fetching prompts" },
            { status: 500 }
        );
    }
}
