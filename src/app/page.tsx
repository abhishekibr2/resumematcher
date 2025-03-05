"use client"

import { Button } from "@/components/ui/button";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [redirectToResume, setRedirectToResume] = useState(false);
  const router = useRouter();

  const words = "Find the perfect match for your team using AI-powered resume analysis.";

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.success) {
        setRedirectToResume(data.settings.redirectToResume);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setRedirectToResume(false);
    }
  };

  useEffect(() => {
    if (redirectToResume) {
      console.log("Redirecting to all resumes");
      console.log(redirectToResume);
      router.push("/all-resumes");
    }
  }, [redirectToResume]);

  useEffect(() => {
    Promise.all([fetchSettings()]).finally(() => {
      setIsLoading(false);
    });
  }, []);

  return (
    <>
      {!isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-secondary/20 px-4">
          <div className="w-full max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Resume<span className="text-primary">Matcher</span>
            </h1>
            
            <div className="h-16">
              <TextGenerateEffect words={words} />
            </div>

            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our AI-powered platform helps you analyze resumes efficiently, identify top talent, 
              and make data-driven hiring decisions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
              <Button 
                size="lg"
                onClick={() => router.push('/log-in')}
                className="w-full sm:w-auto"
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => router.push('/about')}
                className="w-full sm:w-auto"
              >
                Learn More
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <div className="p-6 rounded-lg bg-card">
                <h3 className="font-semibold text-xl mb-2">AI Analysis</h3>
                <p className="text-muted-foreground">Advanced machine learning algorithms to evaluate resumes</p>
              </div>
              <div className="p-6 rounded-lg bg-card">
                <h3 className="font-semibold text-xl mb-2">Smart Matching</h3>
                <p className="text-muted-foreground">Automatically match candidates to job requirements</p>
              </div>
              <div className="p-6 rounded-lg bg-card">
                <h3 className="font-semibold text-xl mb-2">Time Saving</h3>
                <p className="text-muted-foreground">Reduce hiring time by up to 75% with automated screening</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </>
  );
}
