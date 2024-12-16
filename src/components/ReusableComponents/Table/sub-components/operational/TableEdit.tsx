"use client"

import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TableColumn, TableConfig } from "@/types/table.types"
import { filterOptions } from "../../data/filterOptions"
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
import { cn } from "@/lib/utils"

interface TableEditProps {
    config: TableConfig;
    data: any;
    onSuccess?: () => void;
}

type FormDataType = {
    [key: string]: any;
}


// Move helper functions outside the component
const setNestedValue = (obj: any, path: string, value: any) => {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
            current[parts[i]] = {};
        }
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
};

const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => {
        return acc && acc[part] !== undefined ? acc[part] : null;
    }, obj);
};

export function TableEdit({ config, data, onSuccess }: TableEditProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState<FormDataType>(() => {
        const initialData: FormDataType = {};
        config.columns.forEach(column => {
            if (column.accessorKey.includes('.')) {
                const parts = column.accessorKey.split('.');
                const value = getNestedValue(data, column.accessorKey);
                setNestedValue(initialData, column.accessorKey, value ?? '');
            } else {
                initialData[column.accessorKey] = data[column.accessorKey] ?? '';
            }
        });
        return initialData;
    });
    const { toast } = useToast()



    useEffect(() => {
        console.log({ config })
    }, [])

    const handleUpdate = async () => {
        try {
            setIsLoading(true)
            toast({
                title: "Updating user...",
                description: "Please wait while we process your request.",
            })

            const response = await fetch(`/api/${config.endpoints.update}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    _id: data._id,
                    ...formData
                }),
            })

            const responseData = await response.json()

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to update user')
            }

            setIsOpen(false)
            toast({
                title: "Success",
                description: "User has been updated successfully.",
                variant: "default"
            })
            onSuccess?.()
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update user",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        try {
            setIsLoading(true)
            toast({
                title: "Deleting user...",
                description: "Please wait while we process your request.",
            })

            const response = await fetch(`/api/${config.endpoints.delete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ _id: data._id }),
            })

            const responseData = await response.json()

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to delete user')
            }

            setIsOpen(false)
            setShowDeleteDialog(false)
            toast({
                title: "Success",
                description: "User has been deleted successfully.",
                variant: "default"
            })
            onSuccess?.()
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete user",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const renderField = (column: TableColumn) => {
        const commonProps = {
            id: column.accessorKey,
            required: true,
            disabled: isLoading,
            className: cn(
                isLoading && "opacity-50 pointer-events-none"
            )
        }
        // Skip parent object fields
        if (typeof formData[column.accessorKey] === 'object' && !Array.isArray(formData[column.accessorKey])) {
            return null;
        }

        // Handle nested fields
        if (column.accessorKey.includes('.')) {
            return (
                <div className="space-y-2" key={column.id}>
                    <Label htmlFor={column.accessorKey}>{column.header}</Label>
                    <Input
                        {...commonProps}
                        type={column.type === 'email' ? 'email' : 'text'}
                        value={getNestedValue(formData, column.accessorKey) || ''}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setFormData(prev => {
                                const newData = { ...prev };
                                setNestedValue(newData, column.accessorKey, newValue);
                                return newData;
                            });
                        }}
                    />
                </div>
            );
        }

        // Handle array fields
        if (column.type === 'array' && column.arrayType === 'items') {
            return (
                <div className="space-y-2" key={column.id}>
                    <Label>{column.header}</Label>
                    <div className="space-y-4">
                        {formData[column.accessorKey]?.map((item: any, index: number) => (
                            <div key={item._id || index} className="space-y-2 p-4 border rounded-lg">
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label>Description</Label>
                                        <Input
                                            value={item.description || ''}
                                            onChange={(e) => {
                                                const newItems = [...formData[column.accessorKey]];
                                                newItems[index] = { ...newItems[index], description: e.target.value };
                                                setFormData(prev => ({ ...prev, [column.accessorKey]: newItems }));
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <Label>Quantity</Label>
                                        <Input
                                            type="number"
                                            value={item.quantity || ''}
                                            onChange={(e) => {
                                                const newItems = [...formData[column.accessorKey]];
                                                newItems[index] = { ...newItems[index], quantity: Number(e.target.value) };
                                                setFormData(prev => ({ ...prev, [column.accessorKey]: newItems }));
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <Label>Price</Label>
                                        <Input
                                            type="number"
                                            value={item.price || ''}
                                            onChange={(e) => {
                                                const newItems = [...formData[column.accessorKey]];
                                                newItems[index] = { ...newItems[index], price: Number(e.target.value) };
                                                setFormData(prev => ({ ...prev, [column.accessorKey]: newItems }));
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        switch (column.type) {
            case 'text':
            case 'email':
            case 'phone':
                return (
                    <div className="space-y-2" key={column.id}>
                        <Label htmlFor={column.accessorKey}>{column.header}</Label>
                        <Input
                            {...commonProps}
                            type={column.type === 'email' ? 'email' : column.type === 'phone' ? 'tel' : 'text'}
                            value={formData[column.accessorKey] ?? ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, [column.accessorKey]: e.target.value }))}
                        />
                    </div>
                )

            case 'number':
                return (
                    <div className="space-y-2" key={column.id}>
                        <Label htmlFor={column.accessorKey}>{column.header}</Label>
                        <Input
                            {...commonProps}
                            type="number"
                            value={formData[column.accessorKey]}
                            onChange={(e) => setFormData(prev => ({ ...prev, [column.accessorKey]: e.target.value }))}
                        />
                    </div>
                )

            case 'select':
            case 'boolean':
            case 'gender':
                return (
                    <div className="space-y-1" key={column.id}>
                        <Label htmlFor={column.accessorKey} className="text-sm font-medium">
                            {column.header}
                        </Label>
                        <Select
                            value={formData[column.accessorKey]}
                            onValueChange={(value) =>
                                setFormData((prev) => ({ ...prev, [column.accessorKey]: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={`Select ${column.header.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {column.options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )
            case 'hidden':
                return null
            case 'address':
                return (
                    <div className="space-y-4" key={column.id}>
                        <Label>{column.header}</Label>
                        <div className="space-y-2">
                            <Input
                                {...commonProps}
                                placeholder="Street"
                                value={formData[column.accessorKey]?.street}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    [column.accessorKey]: { ...prev[column.accessorKey], street: e.target.value }
                                }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Input
                                    {...commonProps}
                                    placeholder="City"
                                    value={formData[column.accessorKey]?.city}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        [column.accessorKey]: { ...prev[column.accessorKey], city: e.target.value }
                                    }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    {...commonProps}
                                    placeholder="State"
                                    value={formData[column.accessorKey]?.state}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        [column.accessorKey]: { ...prev[column.accessorKey], state: e.target.value }
                                    }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Input
                                    {...commonProps}
                                    placeholder="Country"
                                    value={formData[column.accessorKey]?.country}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        [column.accessorKey]: { ...prev[column.accessorKey], country: e.target.value }
                                    }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    {...commonProps}
                                    placeholder="Postal Code"
                                    value={formData[column.accessorKey]?.postalCode}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        [column.accessorKey]: { ...prev[column.accessorKey], postalCode: e.target.value }
                                    }))}
                                />
                            </div>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    // Filter out system fields
    const columns = config.columns.filter(col =>
        col.accessorKey !== 'createdAt' &&
        col.accessorKey !== 'updatedAt'
    )

    return (
        <>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={config.edit?.style?.editButton}
                        disabled={!config.edit?.allowUpdate}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                        <SheetTitle>Edit {config.title?.slice(0, -1) || 'User'}</SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
                        <div className={cn(
                            "space-y-6 py-6",
                            isLoading && "opacity-50 pointer-events-none"
                        )}>
                            {columns.map(renderField)}
                        </div>
                    </ScrollArea>
                    <SheetFooter className="flex justify-between sm:justify-between pt-4">
                        {config.edit?.allowDelete && (
                            <Button
                                variant="destructive"
                                onClick={() => setShowDeleteDialog(true)}
                                type="button"
                                disabled={isLoading}
                                className={config.edit?.style?.deleteButton}
                            >
                                {isLoading ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent mr-2" />
                                ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                )}
                                Delete
                            </Button>
                        )}
                        {config.edit?.allowUpdate && (
                            <Button
                                onClick={handleUpdate}
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent mr-2" />
                                ) : null}
                                Update
                            </Button>
                        )}
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {config.edit?.confirmDelete && (
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {config.edit?.messages?.deleteConfirm?.title || "Are you sure?"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {config.edit?.messages?.deleteConfirm?.description ||
                                    "This action cannot be undone. This will permanently delete the user and remove their data from our servers."}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isLoading}>
                                {config.edit?.messages?.deleteConfirm?.cancel || "Cancel"}
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-destructive text-destructive-foreground"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent mr-2" />
                                ) : null}
                                {config.edit?.messages?.deleteConfirm?.confirm || "Delete"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    )
} 