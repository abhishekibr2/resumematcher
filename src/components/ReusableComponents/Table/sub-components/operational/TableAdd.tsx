"use client"

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TableColumn, TableConfig } from "@/types/table.types";
import { filterOptions } from "../../data/filterOptions";
import { useSession } from "next-auth/react";
import { Textarea } from "@/components/ui/textarea";

interface TableAddProps {
    config: TableConfig;
    onSuccess?: () => void;
}

type FormDataType = {
    [key: string]: any;
    createdBy?: string;
    updatedBy?: string;
};

interface ArrayFieldValue {
    id: string;
    value: any;
}

export function TableAdd({ config, onSuccess }: TableAddProps) {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState<FormDataType>(() => {
        const initialData: FormDataType = {};
        config.columns.forEach((column) => {
            if (column.accessorKey.includes('.')) {
                const parts = column.accessorKey.split('.');
                let current = initialData;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!current[parts[i]]) {
                        current[parts[i]] = {};
                    }
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = '';
            } else {
                switch (column.type) {
                    case 'number':
                        initialData[column.accessorKey] = '0';
                        break;
                    case 'date':
                        initialData[column.accessorKey] = new Date().toISOString().slice(0, 16);
                        break;
                    case 'select':
                        initialData[column.accessorKey] = column.options?.[0]?.value || '';
                        break;
                    case 'address':
                        initialData[column.accessorKey] = {
                            street: '',
                            city: '',
                            state: '',
                            country: '',
                            postalCode: ''
                        };
                        break;
                    default:
                        initialData[column.accessorKey] = '';
                }
            }
        });
        return initialData;
    });
    const { toast } = useToast();
    const [arrayFields, setArrayFields] = useState<Record<string, ArrayFieldValue[]>>(() => {
        const initialArrayFields: Record<string, ArrayFieldValue[]> = {};
        config.columns.forEach((column) => {
            if (column.type === 'array' && column.arrayType === 'items') {
                initialArrayFields[column.accessorKey] = [{
                    id: crypto.randomUUID(),
                    value: {
                        description: '',
                        quantity: '0',
                        price: '0'
                    }
                }];
            }
        });
        return initialArrayFields;
    });

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const initialArrayFields: Record<string, ArrayFieldValue[]> = {};
        config.columns.forEach((column) => {
            if (column.type === 'array' && column.arrayType === 'items') {
                initialArrayFields[column.accessorKey] = [{
                    id: crypto.randomUUID(),
                    value: {
                        description: '',
                        quantity: '',
                        price: ''
                    }
                }];
            }
        });
        setArrayFields(initialArrayFields);
    }, [config.columns]);


    const handleAddArrayField = (accessorKey: string) => {
        setArrayFields(prev => ({
            ...prev,
            [accessorKey]: [
                ...(prev[accessorKey] || []),
                {
                    id: crypto.randomUUID(),
                    value: {
                        description: '',
                        quantity: '',
                        price: ''
                    }
                }
            ]
        }));
    };

    const handleRemoveArrayField = (accessorKey: string, id: string) => {
        setArrayFields(prev => ({
            ...prev,
            [accessorKey]: prev[accessorKey].filter(field => field.id !== id)
        }));
    };

    const handleArrayFieldChange = (accessorKey: string, id: string, fieldKey: string, value: any) => {
        setArrayFields(prev => ({
            ...prev,
            [accessorKey]: prev[accessorKey].map(field =>
                field.id === id
                    ? {
                        ...field,
                        value: {
                            ...field.value,
                            [fieldKey]: value || ''
                        }
                    }
                    : field
            )
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const cleanArrayFields = Object.entries(arrayFields).reduce((acc, [key, fields]) => ({
            ...acc,
            [key]: fields.map(field => ({
                description: field.value.description || '',
                quantity: Number(field.value.quantity || 0),
                price: Number(field.value.price || 0)
            }))
        }), {});

        const submitData = {
            ...formData,
            ...cleanArrayFields
        };

        config.columns.forEach(column => {
            if (column.accessorKey === 'createdBy' && session?.user) {
                submitData.createdBy = session.user.name || '';
            }
            if (column.accessorKey === 'updatedBy' && session?.user) {
                submitData.updatedBy = session.user.name || '';
            }
        });

        try {
            const response = await fetch(`/api/${config.endpoints.create}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submitData),
            });
            if (!response.ok) {
                throw new Error(`Failed to add ${config.title || "User"}`);
            }

            setIsOpen(false);
            resetFormData();
            toast({
                title: "Success",
                description: `${config.title || "User"} has been added successfully.`,
                variant: "default",
            });
            onSuccess?.();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : `Failed to add ${config.title?.slice(0, -4) || "User"}`,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const resetFormData = () => {
        const initialData: FormDataType = {};
        const initialArrayFields: Record<string, ArrayFieldValue[]> = {};

        config.columns.forEach((column) => {
            if (column.type === 'array' && column.arrayType === 'items') {
                initialArrayFields[column.accessorKey] = [{
                    id: crypto.randomUUID(),
                    value: {
                        description: '',
                        quantity: '0',
                        price: '0'
                    }
                }];
            } else if (column.accessorKey.includes('.')) {
                const parts = column.accessorKey.split('.');
                let current = initialData;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!current[parts[i]]) {
                        current[parts[i]] = {};
                    }
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = '';
            } else {
                switch (column.type) {
                    case 'number':
                        initialData[column.accessorKey] = '0';
                        break;
                    case 'date':
                        initialData[column.accessorKey] = new Date().toISOString().slice(0, 16);
                        break;
                    case 'select':
                        initialData[column.accessorKey] = column.options?.[0]?.value || '';
                        break;
                    case 'address':
                        initialData[column.accessorKey] = {
                            street: '',
                            city: '',
                            state: '',
                            country: '',
                            postalCode: ''
                        };
                        break;
                    default:
                        initialData[column.accessorKey] = '';
                }
            }
        });

        setFormData(initialData);
        setArrayFields(initialArrayFields);
    };

    const getNestedValue = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => {
            return acc && acc[part] !== undefined ? acc[part] : null;
        }, obj);
    };

    const renderField = (column: TableColumn) => {
        if (['createdAt', 'updatedAt', 'createdBy', 'updatedBy'].includes(column.accessorKey)) {
            return null;
        }

        if (column.accessorKey === 'client') {
            return null;
        }

        if (column.accessorKey.includes('.')) {
            const parts = column.accessorKey.split('.');
            return (
                <div className="space-y-1" key={column.id}>
                    <Label htmlFor={column.accessorKey} className="text-sm font-medium">
                        {column.header}
                    </Label>
                    <Input
                        id={column.accessorKey}
                        required
                        type={column.type === "email" ? "email" : "text"}
                        value={getNestedValue(formData, column.accessorKey) || ''}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setFormData(prev => {
                                const newData = { ...prev };
                                let current = newData;
                                for (let i = 0; i < parts.length - 1; i++) {
                                    if (!current[parts[i]]) {
                                        current[parts[i]] = {};
                                    }
                                    current = current[parts[i]];
                                }
                                current[parts[parts.length - 1]] = newValue;
                                return newData;
                            });
                        }}
                    />
                </div>
            );
        }

        if (column.type === 'array' && column.arrayType === 'items') {
            return (
                <div className="space-y-2 col-span-2" key={column.id}>
                    <Label className="text-sm font-medium">
                        {column.header}
                    </Label>
                    <div className="space-y-2">
                        {arrayFields[column.accessorKey]?.map(field =>
                            <div key={field.id} className="space-y-2 p-4 border rounded-lg relative">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => handleRemoveArrayField(column.accessorKey, field.id)}
                                >
                                    ×
                                </Button>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label>Description</Label>
                                        <Input
                                            placeholder="Enter description"
                                            value={field.value.description ?? ''}
                                            onChange={(e) => handleArrayFieldChange(
                                                column.accessorKey,
                                                field.id,
                                                'description',
                                                e.target.value
                                            )}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Quantity</Label>
                                        <Input
                                            type="number"
                                            placeholder="Enter quantity"
                                            value={field.value.quantity ?? '0'}
                                            onChange={(e) => handleArrayFieldChange(
                                                column.accessorKey,
                                                field.id,
                                                'quantity',
                                                e.target.value
                                            )}
                                            required
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Price</Label>
                                        <Input
                                            type="number"
                                            placeholder="Enter price"
                                            value={field.value.price ?? '0'}
                                            onChange={(e) => handleArrayFieldChange(
                                                column.accessorKey,
                                                field.id,
                                                'price',
                                                e.target.value
                                            )}
                                            required
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddArrayField(column.accessorKey)}
                        >
                            Add Item
                        </Button>
                    </div>
                </div>
            );
        }

        const commonProps = {
            id: column.accessorKey,
            required: true,
        };

        switch (column.type) {
            case "text":
            case "email":
            case "phone":
                return (
                    <div className="space-y-1" key={column.id}>
                        <Label htmlFor={column.accessorKey} className="text-sm font-medium">
                            {column.header}
                        </Label>
                        <Input
                            {...commonProps}
                            type={column.type === "email" ? "email" : column.type === "phone" ? "tel" : "text"}
                            value={formData[column.accessorKey] ?? ''}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, [column.accessorKey]: e.target.value }))
                            }
                        />
                    </div>
                );

            case "date":
                return (
                    <div className="space-y-1" key={column.id}>
                        <Label htmlFor={column.accessorKey} className="text-sm font-medium">
                            {column.header}
                        </Label>
                        <Input
                            {...commonProps}
                            type="datetime-local"
                            value={formData[column.accessorKey] || ''}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, [column.accessorKey]: e.target.value }))
                            }
                        />
                    </div>
                );
            case "textarea":
                return (
                    <div className="space-y-1" key={column.id}>
                        <Label htmlFor={column.accessorKey} className="text-sm font-medium">
                            {column.header}
                        </Label>
                        <Textarea
                            {...commonProps}
                            value={formData[column.accessorKey] ?? ''}
                            onChange={(e: any) =>
                                setFormData((prev) => ({ ...prev, [column.accessorKey]: e.target.value }))
                            }
                        />
                    </div>
                );
            case "select":
                return (
                    <div className="space-y-1" key={column.id}>
                        <Label htmlFor={column.accessorKey} className="text-sm font-medium">
                            {column.header}
                        </Label>
                        <Select
                            value={String(formData[column.accessorKey] ?? column.options?.[0]?.value ?? '')}
                            onValueChange={(value) =>
                                setFormData((prev) => ({ ...prev, [column.accessorKey]: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={`Select ${column.header.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {column.options?.map((option) => (
                                    <SelectItem key={String(option.value)} value={String(option.value)}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );

            case "number":
                return (
                    <div className="space-y-1" key={column.id}>
                        <Label htmlFor={column.accessorKey} className="text-sm font-medium">
                            {column.header}
                        </Label>
                        <Input
                            {...commonProps}
                            type="number"
                            value={formData[column.accessorKey] ?? '0'}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, [column.accessorKey]: e.target.value }))
                            }
                        />
                    </div>
                );

            case "address":
                return (
                    <div className="space-y-2" key={column.id}>
                        <Label className="text-sm font-medium">{column.header}</Label>
                        <div className="space-y-1">
                            <Input
                                placeholder="Street"
                                value={formData[column.accessorKey].street}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        [column.accessorKey]: {
                                            ...prev[column.accessorKey],
                                            street: e.target.value,
                                        },
                                    }))
                                }
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                placeholder="City"
                                value={formData[column.accessorKey].city}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        [column.accessorKey]: {
                                            ...prev[column.accessorKey],
                                            city: e.target.value,
                                        },
                                    }))
                                }
                                required
                            />
                            <Input
                                placeholder="State"
                                value={formData[column.accessorKey].state}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        [column.accessorKey]: {
                                            ...prev[column.accessorKey],
                                            state: e.target.value,
                                        },
                                    }))
                                }
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                placeholder="Country"
                                value={formData[column.accessorKey].country}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        [column.accessorKey]: {
                                            ...prev[column.accessorKey],
                                            country: e.target.value,
                                        },
                                    }))
                                }
                                required
                            />
                            <Input
                                placeholder="Postal Code"
                                value={formData[column.accessorKey].postalCode}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        [column.accessorKey]: {
                                            ...prev[column.accessorKey],
                                            postalCode: e.target.value,
                                        },
                                    }))
                                }
                                required
                            />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add {config.title || "User"}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[800px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        Add New {config.title || "User"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                    <ScrollArea className="flex-1 pr-4">
                        <div className="grid grid-cols-2 gap-4 py-4">
                            {config.columns.map(renderField)}
                        </div>
                    </ScrollArea>
                    <DialogFooter className="mt-4">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent mr-2" />
                                    Adding...
                                </>
                            ) : (
                                `Add ${config.title || "User"}`
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
