import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { authOptions } from "@/utils/authOptions";
import { Post } from "@/models/posts";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "You are not logged in" });
        }
        await connectToDatabase();
        const posts = await Post.find({}).lean() // Use .lean() for better performance
        // Convert MongoDB documents to plain objects
        const postsData = posts.map((post: any) => ({
            _id: post._id.toString(),
            title: post.title,
            post: post.post
        }));
        if (!posts) {
            return NextResponse.json({ message: "Posts not found" }, { status: 404 });
        }
        return NextResponse.json(postsData);
    } catch (error) {
        console.error("Error fetching posts:", error);
        return NextResponse.json(
            { message: "Error fetching posts" },
            { status: 500 }
        );
    }
}
