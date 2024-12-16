import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { authOptions } from "@/utils/authOptions"
import { Filter } from "@/models/filter.model"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        await connectToDatabase()
        const body = await req.json()
        const { name, filters, sorting, tableName } = body
        console.log(session.user._id)
        const filter = await Filter.create({
            name,
            filters,
            sorting,
            tableName,
            createdBy: session.user._id
        })

        return NextResponse.json(filter)
    } catch (error) {
        console.error("[FILTERS_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        await connectToDatabase()
        const { searchParams } = new URL(req.url)
        const tableName = searchParams.get("tableName")

        const filters = await Filter.find({
            createdBy: session.user._id,
            ...(tableName ? { tableName } : {})
        }).sort({ createdAt: -1 })

        return NextResponse.json(filters)
    } catch (error) {
        console.error("[FILTERS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
} 