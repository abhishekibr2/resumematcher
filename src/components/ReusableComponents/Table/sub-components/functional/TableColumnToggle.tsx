import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Columns } from "lucide-react"
import { TableColumn } from "@/types/table.types"

interface TableColumnToggleProps {
    columns: TableColumn[];
    visibleColumns: string[];
    onColumnToggle: (columns: string[]) => void;
}

export function TableColumnToggle({ columns, visibleColumns, onColumnToggle }: TableColumnToggleProps) {
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
                        onCheckedChange={(checked) => {
                            if (checked) {
                                onColumnToggle([...visibleColumns, column.accessorKey])
                            } else {
                                onColumnToggle(visibleColumns.filter(col => col !== column.accessorKey))
                            }
                        }}
                    >
                        {column.header}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
} 