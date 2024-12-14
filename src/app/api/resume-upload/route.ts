import { NextRequest, NextResponse } from 'next/server';
import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold
} from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { connectToDatabase } from '@/lib/mongodb';
import { Resume } from '@/models/resume';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Define the expected JSON structure for resume parsing
const resumeJson = {
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
    "status": {
        "Expertise": "give a shrot expertise title like MERN Stack,PHP developeretc ",
        "Rating": "give a rating from 1 to 10 according to the job post.",
        "should_contact": "true or false according to the job post. if he is not eligible for the job post then return false."
    }
}

export async function POST(req: NextRequest) {
    try {
        // Parse the request body
        const formData = await req.formData();
        const file = formData.get('file');
        const promptId = formData.get('promptId');
        const promptText = formData.get('promptText');

        // Validate inputs
        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Invalid file format" }, { status: 400 });
        }

        // Validate API key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key is missing" }, { status: 500 });
        }

        // Initialize Gemini services
        const genAI = new GoogleGenerativeAI(apiKey);
        const fileManager = new GoogleAIFileManager(apiKey);

        // Create a temporary file to upload
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, file.name);

        // Write file to temporary location
        const fileBuffer = await file.arrayBuffer();
        fs.writeFileSync(tempFilePath, Buffer.from(fileBuffer));

        // Upload file to Gemini
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
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
            // Clean up temporary file
            fs.unlinkSync(tempFilePath);
            return NextResponse.json({
                error: "File processing failed",
                state: uploadedFile.state
            }, { status: 500 });
        }

        // Configure model
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-8b",
        });

        const generationConfig = {
            temperature: 0.7,
            topP: 0.95,
            topK: 40, // Adjusted to be within the supported range
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
        };

        // Prepare safety settings
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

        // Prepare the prompt
        const promptParts = [
            {
                fileData: {
                    mimeType: uploadedFile.mimeType,
                    fileUri: uploadedFile.uri,
                },
            },
            {
                text: `Extract data from this resume and return a detailed JSON in the following format:
${JSON.stringify(resumeJson, null, 2)}

Job Post Context: ${promptText || "No specific job post details provided"}

Guidelines:
1. Ensure all fields are populated with appropriate data and no other fields are present.
2. Use empty arrays or null if no data is found
3. Be as precise and comprehensive as possible
4. Focus on extracting professional and educational details
5. Only return the JSON and nothing else.
6. If the resume is not eligible for the job post then return false in should_contact field.
7. All the dates should be in dd/mm/yyyy format.
`
            }
        ];

        // Generate content
        const result = await model.generateContent({
            contents: [{ role: "user", parts: promptParts }],
            generationConfig,
            safetySettings,
        });

        // Clean up temporary file
        fs.unlinkSync(tempFilePath);

        // Parse and save resume
        const responseText = result.response.text();
        const parsedResume = parseGeminiResponse(responseText);

        // Save to database
        await connectToDatabase();
        const resume = new Resume(parsedResume);
        await resume.save();

        return NextResponse.json({
            message: "Resume processed successfully",
            data: parsedResume
        });

    } catch (error) {
        console.log({ error })
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
        // Try to parse the cleaned response as JSON
        return JSON.parse(cleanedResponse);
    } catch (error) {
        // If parsing fails, return the original response
        console.error('Error parsing JSON:', error);
        return { original: response };
    }
};