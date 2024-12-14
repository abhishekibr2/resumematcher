"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileUp, File } from "lucide-react";
import { toast } from '@/hooks/use-toast';

// Define Prompt type to match your Mongoose schema
type Prompt = {
  _id: string;
  title: string;
  prompt: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // New state for prompts and selected prompt
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [selectedPromptText, setSelectedPromptText] = useState<string>('');
  const [promptsLoading, setPromptsLoading] = useState(true);
  const [promptsError, setPromptsError] = useState<string | null>(null);

  // Fetch prompts on component mount
  useEffect(() => {
    async function fetchPrompts() {
      try {
        setPromptsLoading(true);
        const response = await fetch('/api/prompts');

        if (!response.ok) {
          throw new Error('Failed to fetch prompts');
        }

        const data = await response.json();

        // Ensure data is an array
        const promptsArray = Array.isArray(data) ? data : [];

        setPrompts(promptsArray);
        setPromptsError(promptsArray.length === 0 ? 'No prompts found' : null);
      } catch (error) {
        console.error('Error fetching prompts:', error);
        setPromptsError(error instanceof Error ? error.message : 'An unknown error occurred');
        setPrompts([]);
      } finally {
        setPromptsLoading(false);
      }
    }
    fetchPrompts();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);

      // Create preview URLs
      const previews = filesArray.map(file => {
        // Check if file is an image
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreviewUrls(prev => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(file);
          return URL.createObjectURL(file);
        }
        // For PDFs, use a PDF icon or placeholder
        return '/pdf-icon.png'; // You'll need to add this icon to your public folder
      });

      setPreviewUrls(previews);
    }
  };

  const handlePromptChange = (promptId: string) => {
    // Find the selected prompt
    const prompt = prompts.find(p => p._id === promptId);

    // Update selected prompt ID and prompt text
    setSelectedPrompt(promptId);
    setSelectedPromptText(prompt ? prompt.prompt : '');
  };

  const processFiles = async () => {
    setLoading(true);

    if (selectedFiles.length === 0) {
      toast({
        title: 'Please select files first',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (!selectedPrompt) {
      toast({
        title: 'Please select a prompt',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      // Helper function to add delay
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Process files sequentially with a delay
      for (const [index, file] of selectedFiles.entries()) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('promptId', selectedPrompt);
        formData.append('promptText', selectedPromptText);

        try {
          // Show processing status for current file
          toast({
            title: `Processing file ${index + 1} of ${selectedFiles.length}`,
            description: file.name,
            variant: 'default',
          });

          const response = await fetch("/api/resume-upload", {
            method: "POST",
            body: formData
          });

          const data = await response.json();

          // Check if the upload was successful
          if (!response.ok) {
            // Handle API errors
            toast({
              title: `Failed to upload ${file.name}`,
              description: data.error || 'Unknown error occurred',
              variant: 'destructive',
            });
            setLoading(false);
            return;
          }

          // Add a delay between file uploads (e.g., 2 seconds)
          await delay(2000);

        } catch (error) {
          console.error(`Error processing file ${file.name}`, error);
          toast({
            title: `Error processing ${file.name}`,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      // If all files processed successfully
      toast({
        title: 'All Resumes added and analysed successfully',
        variant: 'default',
      });
      router.push('/all-resumes');
    } catch (error) {
      console.error("Error processing files", error);
      toast({
        title: 'An error occurred while processing files',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Resume Analysis</CardTitle>
          <CardDescription>
            Upload multiple resumes (PDF or image) to analyze their content using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid w-full items-center gap-4">
            {/* Prompt Dropdown */}
            <Select
              value={selectedPrompt}
              onValueChange={handlePromptChange}
              disabled={promptsLoading || prompts.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  promptsLoading
                    ? "Loading prompts..."
                    : (promptsError || "Select an Analysis Prompt")
                } />
              </SelectTrigger>
              <SelectContent>
                {prompts.length > 0 ? (
                  prompts.map((prompt) => (
                    <SelectItem key={prompt._id} value={prompt._id}>
                      {prompt.title}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-muted-foreground">
                    {promptsError || "No prompts available"}
                  </div>
                )}
              </SelectContent>
            </Select>

            <Input
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleFileChange}
              className="cursor-pointer"
            />

            {/* File Preview Section */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="relative overflow-hidden rounded-lg border bg-background p-2"
                  >
                    <File/>
                    <div className="text-center mt-2 text-sm truncate">
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={processFiles}
              disabled={selectedFiles.length === 0 || !selectedPrompt || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Resumes...
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Analyze Resumes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}