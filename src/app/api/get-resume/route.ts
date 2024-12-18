// File: src/app/api/resume/file/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Resume } from '@/models/resume';
import * as ftp from "basic-ftp";
import { Readable, Writable } from 'stream';

export async function POST(req: NextRequest) {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    
    try {
        await connectToDatabase();
        const body = await req.json();
        const { id } = body;
        
        const resume = await Resume.findById(id);
        if (!resume) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        const filePath = resume.resumeFilePath;
        if (!filePath) {
            return NextResponse.json({ error: 'No file associated with this resume' }, { status: 404 });
        }

        console.log('Fetching file from path:', `/resumes/${resume._id.toString()}`);

        await client.access({
            host: "storage.bunnycdn.com",
            user: "ibr-resumes",
            password: "85f77125-3524-498e-9a9655a805b7-690d-4600",
            port: 21,
            secure: false,
        });

        const fileBuffer: Buffer[] = [];
        const writable = new Writable({
            write(chunk, encoding, callback) {
                fileBuffer.push(chunk);
                callback();
            }
        });

        await client.downloadTo(writable, `/resumes/${resume._id.toString()}`);
        const concatenatedBuffer = Buffer.concat(fileBuffer);
        
        console.log('File size downloaded:', concatenatedBuffer.length, 'bytes');
        
        if (concatenatedBuffer.length === 0) {
            throw new Error('Downloaded file is empty');
        }

        const fileBase64 = concatenatedBuffer.toString('base64');
        console.log('Base64 length:', fileBase64.length);

        return NextResponse.json({ 
            fileName: filePath.split('/').pop(),
            fileContent: fileBase64 
        }, { status: 200 });

    } catch (error) {
        console.error('FTP Download Error:', error);
        return NextResponse.json({ 
            error: 'Failed to download file.',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    } finally {
        client.close();
    }
}