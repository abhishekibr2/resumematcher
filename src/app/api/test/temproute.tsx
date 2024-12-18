// File: src/app/api/resume/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold
} from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { connectToDatabase } from '@/lib/mongodb';
import { Resume } from '@/models/resume';
import Settings from '@/models/settings';

// Resume parsing configuration
const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
    try {
        // Parse form data
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const status = formData.get('status') as string;
        const post = formData.get('postText') as string;

        // Validate file
        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type and size
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return NextResponse.json({
                error: "Invalid file type. Only PDF and Word documents are allowed."
            }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({
                error: "File size exceeds 5MB limit"
            }, { status: 400 });
        }
        // Generate unique filename
        // const uniqueSuffix = `${uuidv4()}${path.extname(file.name)}`;
        // const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
        // const filePath = path.join(uploadDir, uniqueSuffix);

        // Use original filename instead of unique suffix
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
        const filePath = path.join(uploadDir, file.name);

        // Ensure upload directory exists
        await fs.promises.mkdir(uploadDir, { recursive: true });

        // Convert file to buffer and write to disk
        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        // Validate Gemini API key
        const settings = await Settings.findOne({});
        const apiKey = settings?.geminiApiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            fs.unlinkSync(filePath);
            return NextResponse.json({ error: "API key is missing" }, { status: 500 });
        }

        // Initialize Gemini services
        const genAI = new GoogleGenerativeAI(apiKey);
        const fileManager = new GoogleAIFileManager(apiKey);

        // Upload file to Gemini
        const uploadResult = await fileManager.uploadFile(filePath, {
            mimeType: file.type,
            displayName: file.name,
        });

        // Wait for file to be processed
        let uploadedFile = uploadResult.file;
        while (uploadedFile.state === "PROCESSING") {
            await new Promise((resolve) => setTimeout(resolve, 10_000));
            uploadedFile = await fileManager.getFile(uploadedFile.name);
        }

        if (uploadedFile.state !== "ACTIVE") {
            fs.unlinkSync(filePath);
            return NextResponse.json({
                error: "File processing failed",
                state: uploadedFile.state
            }, { status: 500 });
        }

        // Configure Gemini model
        const model = genAI.getGenerativeModel({
            model: settings?.geminiModel || "gemini-1.5-flash-8b",
        });

        const generationConfig = {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
        };

        // Safety settings
        const safetySettings = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
        ];

        // Prepare the post
        const postParts = [
            {
                fileData: {
                    mimeType: uploadedFile.mimeType,
                    fileUri: uploadedFile.uri,
                },
            },
            {
                text: `Extract data from this resume and return a detailed JSON with the following structure:
${JSON.stringify(resumeSchema, null, 2)}\n\n${settings?.overwritePrompt}\n\nSpecific requirements: ${post}`
            }
        ];
        // Generate content
        const result = await model.generateContent({
            contents: [{ role: "user", parts: postParts }],
            generationConfig,
            safetySettings,
        });

        // Parse response
        const responseText = result.response.text();
        const parsedResume = parseGeminiResponse(responseText);

        // Check for existing resume
        try {
            await connectToDatabase();
            const existingResume = await Resume.findOne({
                'contact.email': parsedResume.contact?.email,
                'fullName': parsedResume.fullName
            });

            if (existingResume) {
                return NextResponse.json({
                    error: "Duplicate resume",
                    message: `Resume for ${parsedResume.fullName} with email ${parsedResume.contact?.email} already exists.`,
                    isDuplicate: true
                }, { status: 409 }); // 409 Conflict status code
            }

            // If no duplicate, save the resume
            const resume = new Resume({
                ...parsedResume,
                resumeFilePath: filePath,
                status: status
            });
            await resume.save();

            return NextResponse.json({
                message: "Resume processed successfully",
                data: parsedResume
            });

        } catch (error) {
            console.error("Error during file processing:", error);
            return NextResponse.json({
                error: "Internal Server Error",
                details: error instanceof Error ? error.message : String(error)
            }, { status: 500 });
        }

    } catch (error) {
        console.error("Error during file processing:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// Parse Gemini response
const parseGeminiResponse = (response: string) => {
    const cleanedResponse = response
        .replace(/^```json\s*/, '')
        .replace(/```\s*$/, '')
        .trim();

    try {
        return JSON.parse(cleanedResponse);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return { original: response };
    }
};

// Resume schema
const resumeSchema = {
    "fullName": "",
    "contact": {
        "email": "",
        "phone": "",
        "linkedin": "",
        "address": {
            "street": "",
            "city": "",
            "state": "",
            "zip": "",
            "country": ""
        }
    },
    "summary": "",
    "skills": [],
    "workExperience": [
        {
            "company": "",
            "position": "",
            "startDate": "",
            "endDate": "",
            "responsibilities": []
        }
    ],
    "education": [
        {
            "institution": "",
            "degree": "",
            "startDate": "",
            "endDate": "",
            "grade": ""
        }
    ],
    "certifications": [
        {
            "name": "",
            "issuer": "",
            "dateIssued": ""
        }
    ],
    "projects": [
        {
            "name": "",
            "description": "",
            "technologies": [],
            "url": ""
        }
    ],
    "languages": [
        {
            "language": "",
            "proficiency": ""
        }
    ],
    "stats": {
        "Expertise": "give a shrot expertise title like MERN Stack,PHP developeretc ",
        "Rating": "give a rating from 1 to 10 according to the specific requirements.",
        "should_contact": "true or false according to the specific requirements. if he is not eligible for the specific requirements then return false.",
        "experience": "calculate the experience in years and should be calculated based on the specific requirements.For example '2.2 years'"
    }
};