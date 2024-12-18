import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Columns } from "lucide-react"
import { TableColumn } from "@/types/table.types"
import { useEffect } from "react"

interface TableColumnToggleProps {
    columns: TableColumn[];
    visibleColumns: string[];
    onColumnToggle: (columns: string[]) => void;
    tableId: string;
}

export function TableColumnToggle({ 
    columns, 
    visibleColumns, 
    onColumnToggle,
    tableId 
}: TableColumnToggleProps) {
    useEffect(() => {
        const savedColumns = localStorage.getItem(`table-columns-${tableId}`);
        if (savedColumns) {
            onColumnToggle(JSON.parse(savedColumns));
        }
    }, [tableId, onColumnToggle]);

    const handleColumnToggle = (checked: boolean, columnKey: string) => {
        let newVisibleColumns: string[];
        
        if (checked) {
            newVisibleColumns = [...visibleColumns, columnKey];
        } else {
            newVisibleColumns = visibleColumns.filter(col => col !== columnKey);
        }

        localStorage.setItem(`table-columns-${tableId}`, JSON.stringify(newVisibleColumns));
        onColumnToggle(newVisibleColumns);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Columns className="h-4 w-4" />
                    Columns
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
                {columns.map((column) => (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={visibleColumns.includes(column.accessorKey)}
                        onCheckedChange={(checked) => handleColumnToggle(checked, column.accessorKey)}
                    >
                        {column.header}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
} 