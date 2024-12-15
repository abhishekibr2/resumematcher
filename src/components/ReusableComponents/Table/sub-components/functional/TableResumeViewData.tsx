"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScrollArea } from "@/components/ui/scroll-area"
import { TableColumn } from "@/types/table.types"
import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Form, FormField } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2 } from "lucide-react";
import { nanoid } from 'nanoid'
import { useRouter } from "next/navigation";

interface TableViewDataProps {
    isOpen: boolean
    onClose: () => void
    data: any
    columns: any[]
}

export function TableResumeViewData({ isOpen, onClose, data, columns }: TableViewDataProps) {

    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [post, setPost] = useState('');
    const [yearsOfExperience, setYearsOfExperience] = useState('');
    const [isPending, startTransition] = useTransition();
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const router = useRouter();

    const performAnalysis = () => {
        setIsAnalysisOpen(true);
        setAnalysisResult(null);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Generate a unique slug
        const slug = nanoid()

        // Encode the data to pass in URL
        const encodedData = encodeURIComponent(JSON.stringify(data))

        // Use startTransition to handle the navigation
        startTransition(() => {
            router.push(`/analysis/${slug}?jobPost=${encodeURIComponent(post)}&yearsOfExperience=${yearsOfExperience}&data=${encodedData}`)
        })
    }

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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>View Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
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
                <div className="mt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Post</label>
                            <Input
                                type="text"
                                value={post}
                                onChange={(e) => setPost(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                            <Input
                                type="number"
                                value={yearsOfExperience}
                                onChange={(e) => setYearsOfExperience(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isPending} variant="outline">
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <svg fill="none" className="w-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z" fill="url(#prefix__paint0_radial_980_20147)" /><defs><radialGradient id="prefix__paint0_radial_980_20147" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(16.1326 5.4553 -43.70045 129.2322 1.588 6.503)"><stop offset=".067" stopColor="#9168C0" /><stop offset=".343" stopColor="#5684D1" /><stop offset=".672" stopColor="#1BA1E3" /></radialGradient></defs></svg>}
                                Open Analysis Page
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}