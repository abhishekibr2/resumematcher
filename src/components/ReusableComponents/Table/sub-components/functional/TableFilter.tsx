import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Plus, Filter, X } from "lucide-react"
import { FilterConfig, FilterValue, TableColumn } from "@/types/table.types"
import { useState } from "react"
import { filterOptions } from "../../data/filterOptions"

interface TableFilterProps {
    config: FilterConfig;
    columns: TableColumn[];
    onFilterChange: (filters: FilterValue[]) => void;
}

const defaultOperators = [
    { label: 'Equals', value: 'equals' },
    { label: 'Not Equals', value: 'notEquals' },
    { label: 'Contains', value: 'contains' },
    { label: 'Not Contains', value: 'notContains' }
] as const;

export function TableFilter({ columns, onFilterChange }: TableFilterProps) {
    const [filters, setFilters] = useState<FilterValue[]>([])
    const [isOpen, setIsOpen] = useState(false)

    const addNewFilter = () => {
        const newFilter: FilterValue = {
            column: '',
            operator: 'equals' as const,
            value: ''
        }
        setFilters(prev => [...prev, newFilter])
    }

    const removeFilter = (index: number) => {
        const newFilters = filters.filter((_, i) => i !== index)
        setFilters(newFilters)
        onFilterChange(newFilters)
    }

    const updateFilter = (index: number, field: keyof FilterValue, value: string) => {
        const newFilters = filters.map((filter, i) =>
            i === index ? { ...filter, [field]: value } : filter
        )
        setFilters(newFilters)
        onFilterChange(newFilters)
    }

    const renderValueInput = (filter: FilterValue, index: number) => {
        const selectedColumn = columns.find(col => col.accessorKey === filter.column)

        if (selectedColumn && filterOptions[selectedColumn.type as keyof typeof filterOptions]) {
            return (
                <Select
                    value={filter.value}
                    onValueChange={(value) => updateFilter(index, 'value', value)}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                        {filterOptions[selectedColumn.type as keyof typeof filterOptions]?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        }

        return (
            <Input
                placeholder="Enter value"
                value={filter.value}
                onChange={(e) => updateFilter(index, 'value', e.target.value)}
                className="w-[200px]"
            />
        )
    }

    return (
        <div>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[800px] p-4" align="start">
                    <div className="space-y-4">
                        {filters.map((filter, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Select
                                    value={filter.column}
                                    onValueChange={(value) => updateFilter(index, 'column', value)}
                                >
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Select column" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {columns
                                            .filter(column => column.filterable)
                                            .map((column) => (
                                                <SelectItem key={column.id} value={column.accessorKey}>
                                                    {column.header}
                                                </SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={filter.operator}
                                    onValueChange={(value) => updateFilter(index, 'operator', value)}
                                >
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Select operator" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {defaultOperators.map((op) => (
                                            <SelectItem key={op.value} value={op.value}>
                                                {op.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {renderValueInput(filter, index)}

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFilter(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={addNewFilter}
                        >
                            <Plus className="h-4 w-4" />
                            Add Filter
                        </Button>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
} 