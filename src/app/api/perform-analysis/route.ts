import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";


export async function POST(req: NextRequest) {
    try {
        const { data, jobPost } = await req.json();

        // Validate API key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key is missing" }, { status: 500 });
        }

        // Initialize Gemini AI
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-exp-1206' });

        // Generate content
        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [
                    {
                        "text": `Please provide an honest and concise analysis of this resume based on the following criteria:
                        
                        1. Job Post: ${JSON.stringify(jobPost)}
                        2. Resume: ${JSON.stringify(data)}
                        
                        Guidelines:
                        - Evaluate how well the candidate's experience, skills, and qualifications align with the job post requirements. 
                        - Highlight key strengths and any notable gaps in qualifications or skills.
                        - Do not attempt to compensate for missing skills or experience; focus solely on the match with the job requirements.
                        - Provide a score from 1 to 100 that strictly reflects the degree of alignment between the resume and the job post. Ensure the score is unbiased and does not account for factors outside the provided information.
                      
                        The score should represent:
                        - 1-20: Completely mismatched
                        - 21-40: Partially matched with significant gaps
                        - 41-60: Partially matched with some gaps
                        - 61-80: Mostly matched with minor gaps
                        - 81-100: Perfect alignment
                        
                        Conclude the analysis with key insights into the candidate's suitability for the job based on the evaluation.`
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