"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileUp, File, FileX, FileText, Upload } from "lucide-react";
import { toast } from '@/hooks/use-toast';
// Define Post type to match your Mongoose schema
type Post = {
  _id: string;
  title: string;
  post: string;
};
type Status = {
  _id: string;
  status: string;
  createdBy: string;
};

// Add this new type near your existing types
type FileWithStatus = {
  file: File;
  loading: boolean;
  uploaded: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<FileWithStatus[]>([]);
  const [loading, setLoading] = useState(false);

  // New state for posts and selected post
  const [posts, setPosts] = useState<Post[]>([]);
  const [status, setStatus] = useState<Status[]>([]);
  const [selectedPost, setSelectedPost] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPostText, setSelectedPostText] = useState<string>('');
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Add this state to track overall upload process
  const [isUploading, setIsUploading] = useState(false);

  // Constants for file validation
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  // Fetch posts on component mount
  useEffect(() => {
    async function fetchPosts() {
      try {
        setPostsLoading(true);
        const response = await fetch('/api/posts');

        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }

        const data = await response.json();
        const postsArray = Array.isArray(data) ? data : [];

        setPosts(postsArray);
        setPostsError(postsArray.length === 0 ? 'No posts found' : null);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setPostsError(error instanceof Error ? error.message : 'An unknown error occurred');
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    }
    async function fetchStatus() {
      try {
        setStatusLoading(true);
        const response = await fetch('/api/status');

        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }

        const data = await response.json();
        const statusArray = Array.isArray(data) ? data : [];

        setStatus(statusArray);
        setStatusError(statusArray.length === 0 ? 'No status found' : null);
      } catch (error) {
        console.error('Error fetching status:', error);
        setStatusError(error instanceof Error ? error.message : 'An unknown error occurred');
        setStatus([]);
      } finally {
        setStatusLoading(false);
      }
    }
    fetchStatus();
    fetchPosts();
  }, []);

  // Improved file validation
  const validateFiles = (files: FileList | null): File[] => {
    if (!files) return [];

    const validFiles = Array.from(files).filter(file => {
      // Check file type
      const isValidType = ALLOWED_FILE_TYPES.includes(file.type);

      // Check file size
      const isValidSize = file.size <= MAX_FILE_SIZE;

      if (!isValidType) {
        toast({
          title: `Invalid file type: ${file.name}`,
          description: 'Only PDF and Word documents are allowed.',
          variant: 'destructive',
        });
      }

      if (!isValidSize) {
        toast({
          title: `File too large: ${file.name}`,
          description: 'Maximum file size is 5MB.',
          variant: 'destructive',
        });
      }

      return isValidType && isValidSize;
    });

    return validFiles;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validFiles = validateFiles(e.target.files);

    if (validFiles.length > 0) {
      const filesWithStatus = validFiles.map(file => ({
        file,
        loading: false,
        uploaded: false
      }));
      setSelectedFiles(filesWithStatus);
    }
  };

  // Render file icon based on type
  const renderFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'application/pdf':
        return <File className="w-8 h-8 text-red-500" />;
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return <FileText className="w-8 h-8 text-blue-500" />;
      default:
        return <FileX className="w-8 h-8 text-gray-500" />;
    }
  };

  const handlePostChange = (postId: string) => {
    setSelectedPost(postId);
    // Find the selected post and update the text
    const selectedPostData = posts.find(p => p._id === postId);
    setSelectedPostText(selectedPostData?.post || '');
  };

  const handleStatusChange = (statusId: string) => {
    setSelectedStatus(statusId);
  };

  const processFiles = async () => {
    setLoading(true);
    setIsUploading(true);

    // Enhanced validation
    if (!selectedPost || !selectedPostText) {
      toast({
        title: 'Invalid Post Selection',
        description: 'Please select a valid post to continue',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (!selectedStatus) {
      toast({
        title: 'Invalid Status Selection',
        description: 'Please select a valid status to continue',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        title: 'No Files Selected',
        description: 'Please select at least one file to upload',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      let successCount = 0;
      let failureCount = 0;
      let duplicateCount = 0;

      for (const [index, fileWithStatus] of selectedFiles.entries()) {
        setSelectedFiles(prev => prev.map((item, i) =>
          i === index ? { ...item, loading: true } : item
        ));

        const formData = new FormData();
        formData.append('file', fileWithStatus.file);
        formData.append('postId', selectedPost);
        formData.append('postText', selectedPostText);

        const selectedStatusObj = status.find(s => s._id === selectedStatus);
        formData.append('status', selectedStatusObj?.status || '');

        try {
          const response = await fetch("/api/resume-upload", {
            method: "POST",
            body: formData
          });

          const data = await response.json();

          if (!response.ok) {
            if (response.status === 409) {
              duplicateCount++;
              toast({
                title: "Duplicate Resume",
                description: data.message,
                variant: 'destructive',
              });
              setSelectedFiles(prev => prev.map((item, i) =>
                i === index ? { ...item, loading: false, uploaded: false } : item
              ));
            } else {
              failureCount++;
              toast({
                title: `Failed to upload ${fileWithStatus.file.name}`,
                description: data.error || 'Unknown error occurred',
                variant: 'destructive',
              });
              setSelectedFiles(prev => prev.map((item, i) =>
                i === index ? { ...item, loading: false, uploaded: false } : item
              ));
            }
            continue;
          }

          successCount++;
          setSelectedFiles(prev => prev.map((item, i) =>
            i === index ? { ...item, loading: false, uploaded: true } : item
          ));

          await delay(1000);

        } catch (error) {
          failureCount++;
          console.error(`Error processing file ${fileWithStatus.file.name}`, error);
          toast({
            title: `Error processing ${fileWithStatus.file.name}`,
            variant: 'destructive',
          });
          setSelectedFiles(prev => prev.map((item, i) =>
            i === index ? { ...item, loading: false, uploaded: false } : item
          ));
        }
      }

      // Show final summary toast
      const summaryParts = [];
      if (successCount > 0) summaryParts.push(`${successCount} uploaded`);
      if (duplicateCount > 0) summaryParts.push(`${duplicateCount} duplicates`);
      if (failureCount > 0) summaryParts.push(`${failureCount} failed`);

      toast({
        title: 'Upload Summary',
        description: summaryParts.join(', '),
        variant: successCount > 0 ? 'default' : 'destructive',
      });

    } catch (error) {
      console.error("Error processing files", error);
      toast({
        title: 'An error occurred while processing files',
        variant: 'destructive',
      });
    } finally {
      // Navigate after a short delay, regardless of the upload results
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/all-resumes');
      setLoading(false);
      setIsUploading(false);
    }
  };

  const FileUploadZone = ({
    onFileChange,
    disabled
  }: {
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
  }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragIn = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragOut = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      const fakeEvent = {
        target: {
          files
        }
      } as React.ChangeEvent<HTMLInputElement>;

      onFileChange(fakeEvent);
    };

    return (
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 dark:border-gray-700 hover:border-primary'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={disabled ? undefined : handleDragIn}
        onDragLeave={disabled ? undefined : handleDragOut}
        onDragOver={disabled ? undefined : handleDrag}
        onDrop={disabled ? undefined : handleDrop}
      >
        <input
          type="file"
          accept={ALLOWED_FILE_TYPES.join(',')}
          multiple
          onChange={onFileChange}
          disabled={disabled}
          className={`absolute inset-0 w-full h-full opacity-0 
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} z-10`}
        />
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">
              Drag & drop your files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PDF and Word documents (max 5MB each)
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Resume Analysis</CardTitle>
          <CardDescription>
            Upload multiple resumes (PDF or Word) to analyze their content using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid w-full items-center gap-4">
            {/* Post Dropdown */}
            <Select
              value={selectedPost}
              onValueChange={handlePostChange}
              disabled={postsLoading || posts.length === 0 || isUploading}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  postsLoading
                    ? "Loading posts..."
                    : (postsError || "Select an Analysis Post")
                } />
              </SelectTrigger>
              <SelectContent>
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <SelectItem key={post._id} value={post._id}>
                      {post.title}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-muted-foreground">
                    {postsError || "No posts available"}
                  </div>
                )}
              </SelectContent>
            </Select>
            <Select
              value={selectedStatus}
              onValueChange={handleStatusChange}
              disabled={statusLoading || status.length === 0 || isUploading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    statusLoading
                      ? "Loading status..."
                      : (statusError || "Select a Status")
                  } />
              </SelectTrigger>
              <SelectContent >
                {status.length > 0 ? (
                  status.map((status) => (
                    <SelectItem key={status._id} value={status._id}>
                      {status.status}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-muted-foreground">
                    {statusError || "No status available"}
                  </div>
                )}
              </SelectContent>
            </Select>
            <FileUploadZone
              onFileChange={handleFileChange}
              disabled={isUploading}
            />

            {/* File Preview Section */}
            {selectedFiles.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {selectedFiles.length} file(s) selected
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedFiles.map((fileWithStatus, index) => (
                    <div
                      key={index}
                      className="relative overflow-hidden rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="shrink-0">
                          {fileWithStatus.loading ? (
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          ) : fileWithStatus.uploaded ? (
                            <div className="text-green-500">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-8 h-8"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </div>
                          ) : (
                            renderFileIcon(fileWithStatus.file.type)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {fileWithStatus.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(fileWithStatus.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={processFiles}
              disabled={selectedFiles.length === 0 || !selectedPost || loading || isUploading}
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