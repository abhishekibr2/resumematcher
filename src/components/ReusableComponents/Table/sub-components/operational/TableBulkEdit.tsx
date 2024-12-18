"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Download, Edit2, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { TableConfig } from "@/types/table.types"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface TableBulkEditProps {
    config: TableConfig
    selectedData: any[]
    onSuccess: () => void
    onClearSelection: () => void
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

type Status = {
    _id: string;
    status: string;
    createdBy: string;
};

export function TableBulkEdit({
    config,
    selectedData,
    onSuccess,
    onClearSelection,
    isOpen,
    onOpenChange
}: TableBulkEditProps) {
    const [selectedColumn, setSelectedColumn] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleteTimer, setDeleteTimer] = useState(5)
    const [canDelete, setCanDelete] = useState(false)
    const [statusLoading, setStatusLoading] = useState(true);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [status, setStatus] = useState<Status[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast()
    const form = useForm()

    useEffect(() => {
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
    }, []);

    const selectedField = config.bulkEdit?.fields?.find(
        field => field.name === selectedColumn
    )

    useEffect(() => {
        let timer: NodeJS.Timeout
        if (showDeleteDialog && deleteTimer > 0) {
            timer = setTimeout(() => {
                setDeleteTimer(prev => prev - 1)
            }, 1000)
        } else if (deleteTimer === 0) {
            setCanDelete(true)
        }
        return () => {
            if (timer) clearTimeout(timer)
        }
    }, [deleteTimer, showDeleteDialog])

    const handleSubmit = async (formData: any) => {
        if (!selectedColumn || !formData.value) {
            toast({
                title: "Error",
                description: "Please select a column and enter a value",
                variant: "destructive"
            })
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(`/api/${config.endpoints.bulkEdit}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ids: selectedData.map(item => item._id),
                    updates: {
                        [selectedColumn]: formData.value
                    }
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.message || 'Failed to update items')
            }

            toast({
                title: "Success",
                description: `Successfully updated ${selectedData.length} items`,
            })

            onOpenChange(false)
            onSuccess()
            onClearSelection()
            form.reset()
            setSelectedColumn("")
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update items",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteClick = () => {
        setShowDeleteDialog(true)
        setDeleteTimer(5)
        setCanDelete(false)
    }

    const handleDeleteCancel = () => {
        setShowDeleteDialog(false)
        setDeleteTimer(5)
        setCanDelete(false)
    }

    const handleDelete = async () => {
        if (!config.bulkEdit?.allowDelete) return
        setIsLoading(true)
        try {
            const response = await fetch(`/api/${config.endpoints.bulkDelete}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ids: selectedData.map(item => item._id)
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.message || 'Failed to delete items')
            }

            toast({
                title: "Success",
                description: `Successfully deleted ${selectedData.length} items`,
            })

            onSuccess()
            onClearSelection()
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete items",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
            setShowDeleteDialog(false)
            setDeleteTimer(5)
            setCanDelete(false)
        }
    }

    const renderValueField = () => {
        if (!selectedField) return null

        switch (selectedField.type) {
            case 'select':
                return (
                    <div >
                        {config.title?.toLowerCase() !== 'resumes' ? (
                            <Select
                                value={form.watch('value')}
                                onValueChange={(value) => form.setValue('value', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={selectedField.placeholder || "Select value"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedField.options?.map((option) => (
                                        <SelectItem
                                            key={option.value.toString()}
                                            value={option.value.toString()}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Select
                                value={form.watch('value')}
                                onValueChange={(value) => form.setValue('value', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={selectedField.placeholder || "Select value"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {status.map((option) => (
                                        <SelectItem
                                            key={option.status}
                                            value={option.status}
                                        >
                                            {option.status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div >

                )
            default:
                return (
                    <Input
                        {...form.register('value')}
                        type={selectedField.type}
                        placeholder={selectedField.placeholder || "Enter value"}
                    />
                )
        }
    }

    return (
        <>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => onOpenChange(true)}
                    disabled={selectedData.length === 0}
                >
                    <Edit2 className="h-4 w-4" />
                    Bulk Edit ({selectedData.length})
                </Button>

                {config.bulkEdit?.allowDelete && (
                    <Button
                        variant="destructive"
                        className="gap-2"
                        onClick={handleDeleteClick}
                        disabled={selectedData.length === 0 || isLoading}
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete ({selectedData.length})
                    </Button>
                )}
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={handleDeleteCancel}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2">
                                <div>
                                    This action cannot be undone. This will permanently delete{' '}
                                    <span className="font-medium">{selectedData.length}</span> items
                                    and remove their data from our servers.
                                </div>
                                {!canDelete && (
                                    <div className="text-muted-foreground">
                                        Confirm in {deleteTimer} seconds...
                                    </div>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={!canDelete || isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm mr-2"></span>
                                    Deleting...
                                </>
                            ) : (
                                'Delete Items'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Edit {selectedData.length} Items</DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="column"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>Select Field</FormLabel>
                                        <FormControl>
                                            <Select
                                                value={selectedColumn}
                                                onValueChange={setSelectedColumn}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select field to edit" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {config.bulkEdit?.fields?.map(field => (
                                                        <SelectItem
                                                            key={field.name}
                                                            value={field.name}
                                                        >
                                                            {field.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {selectedField && (
                                <FormField
                                    control={form.control}
                                    name="value"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>{selectedField.label} Value</FormLabel>
                                            <FormControl>
                                                {renderValueField()}
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            )}

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm mr-2"></span>
                                            Updating...
                                        </>
                                    ) : (
                                        'Update All'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    )
} 