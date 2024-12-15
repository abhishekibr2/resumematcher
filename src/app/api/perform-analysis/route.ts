import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";


export async function POST(req: NextRequest) {
    try {
        const { data, jobPost, yearsOfExperience } = await req.json();
        // console.log({data},{jobPost},{yearsOfExperience})

        // Validate API key
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key is missing" }, { status: 500 });
        }

        // Initialize Gemini AI
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });

        // Generate content
        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [
                    {
                        text: `Please provide a very very short analysis of this resume based on the following:
                      
                        1. Job Post: ${JSON.stringify(jobPost)}
                        2. Years of Experience: ${JSON.stringify(yearsOfExperience)}
                        3. Resume: ${JSON.stringify(data)}
                      
                        Focus on how well the candidate's experience matches the requirements of the job post and provide key insights into their qualifications. if some skills are missing , please ignore them. also in last give me a score out of 100 based on how well the candidate's experience matches the requirements of the job post and provide key insights into their qualifications.`
                    }
                ]
            }]
        });
        const responseText = result.response.text();
        return NextResponse.json({ solution: responseText });

    } catch (error) {
        console.error("Error during content generation:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}