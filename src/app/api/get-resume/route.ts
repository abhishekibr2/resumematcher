// File: src/app/api/resume/file/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Resume } from '@/models/resume';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        // Connect to database
        await connectToDatabase();
        const body = await req.json();
        const { id } = body;
        // Find the resume by ID
        const resume = await Resume.findById(id);

        if (!resume) {
            return NextResponse.json(
                { error: 'Resume not found' },
                { status: 404 }
            );
        }

        // Check if resume file path exists
        const filePath = resume.resumeFilePath;

        if (!filePath) {
            return NextResponse.json(
                { error: 'No file associated with this resume' },
                { status: 404 }
            );
        }

        // Check if file exists on the filesystem
        if (!fs.existsSync(filePath)) {
            return NextResponse.json(
                { error: 'Resume file is missing' },
                { status: 404 }
            );
        }

        // Read the file
        const fileBuffer = fs.readFileSync(filePath);

        // Determine file type
        const fileExtension = path.extname(filePath).toLowerCase();
        const mimeType = fileExtension === '.pdf'
            ? 'application/pdf'
            : fileExtension === '.docx'
                ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                : 'application/msword';

        // Create a response with the file
        const response = new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `inline; filename="${path.basename(filePath)}"`
            }
        });

        return response;

    } catch (error) {
        console.error('Resume file retrieval error:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}