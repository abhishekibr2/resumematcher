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
        <div className="flex flex-col items-center justify-center h-screen">
          <TextGenerateEffect words="This website lets you analyze resumes and find the best candidates for your job postings." />
          <div className="mt-4 underline"><a href="/log-in"><TextGenerateEffect words="Log in to get started" /></a></div>

        </div>
      ) : (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </>
  );
}
