"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TableColumn } from "@/types/table.types"
import { useState, useTransition, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Download } from "lucide-react";
import { nanoid } from 'nanoid'
import { useRouter } from "next/navigation";

interface Post {
    _id: string;
    title: string;
    post: string;
}

interface TableViewDataProps {
    isOpen: boolean
    onClose: () => void
    data: any
    columns: any[]
}

export function TableResumeViewData({ isOpen, onClose, data, columns }: TableViewDataProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [selectedPost, setSelectedPost] = useState('');
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const router = useRouter();
    const [retrievedFile, setRetrievedFile] = useState<string | null>(null);
    const [showResumePopup, setShowResumePopup] = useState(false);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await fetch('/api/posts');
                if (response.ok) {
                    const data = await response.json();
                    setPosts(data);
                }
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const selectedPostData = posts.find(p => p._id === selectedPost);
        if (!selectedPostData) return;

        const slug = nanoid();
        const encodedData = encodeURIComponent(JSON.stringify(data));

        startTransition(() => {
            router.push(`/analysis/${slug}?jobPost=${encodeURIComponent(selectedPostData.post)}&data=${encodedData}`);
        });
    };

    const formatValue = (value: any, column: TableColumn): string => {
        if (value === null || value === undefined) {
            return '-';
        }

        // Handle Date fields
        const dateFields = ['createdAt', 'updatedAt', 'dateIssued', 'dueDate', 'date', 'birthDate', 'joinedAt'];
        if (value instanceof Date ||
            dateFields.some(field => column.accessorKey.toLowerCase().includes(field.toLowerCase())) ||
            (typeof value === 'string' && !isNaN(Date.parse(value)))) {
            try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    return new Intl.DateTimeFormat('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }).format(date);
                }
            } catch (error) {
                console.error('Error formatting date:', error);
            }
        }

        // Handle select/status fields
        if (column.type === 'select' && column.options) {
            const option = column.options.find(opt => opt.value === value);
            return option ? option.label : value;
        }

        // Handle arrays
        if (Array.isArray(value)) {
            return value.map(item => {
                if (typeof item === 'object') {
                    return Object.entries(item)
                        .map(([key, val]) => `${key}: ${val}`)
                        .join(', ');
                }
                return String(item);
            }).join(' | ');
        }

        // Handle objects (including nested objects)
        if (typeof value === 'object') {
            return Object.entries(value)
                .map(([key, val]) => {
                    if (typeof val === 'object' && val !== null) {
                        return `${key}: ${formatValue(val, column)}`;
                    }
                    return `${key}: ${val}`;
                })
                .join(' | ');
        }

        return String(value);
    };

    const handleViewResume = async () => {
        if (!data?._id) return;

        try {
            setIsDownloading(true);
            const response = await fetch(`/api/get-resume`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: data._id }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch resume');
            }

            const { fileContent } = await response.json();

            if (!fileContent) {
                throw new Error('No file content received');
            }

            // Create blob directly from base64 content
            const blob = new Blob([Buffer.from(fileContent, 'base64')], {
                type: 'application/pdf'
            });
            const fileURL = URL.createObjectURL(blob);

            setRetrievedFile(fileURL);
            setShowResumePopup(true);

        } catch (error) {
            console.error('Error viewing resume:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>View Details</DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                    <div className="space-y-4">
                        {columns.map((column) => {
                            const value = column.accessorKey.includes('.')
                                ? column.accessorKey.split('.').reduce((obj: any, key: string) => obj?.[key], data)
                                : data[column.accessorKey];

                            return (
                                <div key={column.accessorKey} className="grid grid-cols-[100px,1fr] gap-4 items-start">
                                    <label className="text-sm font-medium text-gray-500">
                                        {column.header}
                                    </label>
                                    <div className="text-sm break-words">
                                        {formatValue(value, column)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>

                <div className="mt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Select Job Post</label>
                            {isLoading ? (
                                <div className="flex items-center justify-center p-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                            ) : (
                                <Select value={selectedPost} onValueChange={setSelectedPost}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a job post" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {posts.map((post) => (
                                            <SelectItem key={post._id} value={post._id}>
                                                {post.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={handleViewResume}
                                disabled={isDownloading}
                                type="button"
                            >
                                {isDownloading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                View Resume
                            </Button>

                            <Button
                                type="submit"
                                disabled={isPending || !selectedPost}
                                variant="outline"
                            >
                                {isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <svg fill="none" className="w-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                                        <path d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z" fill="url(#prefix__paint0_radial_980_20147)" />
                                        <defs>
                                            <radialGradient id="prefix__paint0_radial_980_20147" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(16.1326 5.4553 -43.70045 129.2322 1.588 6.503)">
                                                <stop offset=".067" stopColor="#9168C0" />
                                                <stop offset=".343" stopColor="#5684D1" />
                                                <stop offset=".672" stopColor="#1BA1E3" />
                                            </radialGradient>
                                        </defs>
                                    </svg>
                                )}
                                Open Analysis Page
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Resume Popup */}
                {showResumePopup && retrievedFile && (
                    <Dialog open={showResumePopup} onOpenChange={() => {
                        setShowResumePopup(false);
                        if (retrievedFile) {
                            URL.revokeObjectURL(retrievedFile);
                            setRetrievedFile(null);
                        }
                    }}>
                        <DialogContent className="max-w-5xl h-[90vh]">
                            <DialogHeader>
                                <DialogTitle>Resume Preview</DialogTitle>
                            </DialogHeader>
                            <div className="w-full h-full overflow-scroll">
                                <iframe
                                    src={retrievedFile}
                                    title="PDF Viewer"
                                    width="100%"
                                    height="1200px"
                                    style={{ border: 'none'}}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </DialogContent>
        </Dialog>
    );
}