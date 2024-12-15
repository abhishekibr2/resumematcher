"use client"

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'

export default function AnalysisPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const [analysisResult, setAnalysisResult] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchAnalysis() {
            try {
                // Parse the search parameters
                const jobPost = searchParams.get('jobPost')
                const yearsOfExperience = searchParams.get('yearsOfExperience')
                const encodedData = searchParams.get('data')

                if (!jobPost || !yearsOfExperience || !encodedData) {
                    throw new Error('Missing required parameters')
                }

                // Decode the data
                const data = JSON.parse(decodeURIComponent(encodedData))

                const response = await fetch('/api/perform-analysis', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        data,
                        jobPost,
                        yearsOfExperience
                    }),
                });

                const result = await response.json();
                setAnalysisResult(result.solution || 'Analysis completed successfully.');
            } catch (error) {
                console.error('Error fetching analysis:', error);
                setAnalysisResult('An error occurred while performing analysis.');
            } finally {
                setIsLoading(false)
            }
        }

        fetchAnalysis()
    }, [params.slug, searchParams])

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Button disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Analysis
                </Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="max-w-4xl mx-auto">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Analysis Results <svg fill="none" className="w-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z" fill="url(#prefix__paint0_radial_980_20147)" /><defs><radialGradient id="prefix__paint0_radial_980_20147" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(16.1326 5.4553 -43.70045 129.2322 1.588 6.503)"><stop offset=".067" stopColor="#9168C0" /><stop offset=".343" stopColor="#5684D1" /><stop offset=".672" stopColor="#1BA1E3" /></radialGradient></defs></svg></CardTitle>
                </CardHeader>
                <CardContent>
                    {analysisResult ? (
                        <div className="prose max-w-full space-y-4">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                            >
                                {analysisResult}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <p>No analysis results found.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}