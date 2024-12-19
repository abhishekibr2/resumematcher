"use client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { TableProps, SortingState, PaginationState, FilterValue } from "@/types/table.types"
import { fetchTableData } from "@/lib/utils"
import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableSearch } from "./sub-components/functional/TableSearch"
import { TablePagination } from "./sub-components/functional/TablePagination"
import { TableFilter } from "./sub-components/functional/TableFilter"
import { TableColumnToggle } from "./sub-components/functional/TableColumnToggle"
import { TableExport } from "./sub-components/operational/TableExport"
import { TableImport } from "./sub-components/operational/TableImport"
import { useToast } from "@/hooks/use-toast"
import { TableSelect } from "./sub-components/functional/TableSelect"
import { TableAdd } from "./sub-components/operational/TableAdd"
import { TableEdit } from "./sub-components/operational/TableEdit"
import { TableViewData } from "./sub-components/functional/TableViewData"
import { TableBulkEdit } from "./sub-components/operational/TableBulkEdit"
import { ratingStyles } from "./data/rating"
import { TableResumeViewData } from "./sub-components/functional/TableResumeViewData"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { TableAddStatusData } from "./sub-components/operational/TableAddStatusData"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

// Define a type for the status data
interface StatusData {
    _id: string;
    status: string;
    createdBy: string;
    color: string;
}

export function TableComponent({ config }: TableProps) {
    const router = useRouter();
    const [data, setData] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)
    const [sorting, setSorting] = useState<SortingState>({
        column: null,
        direction: null
    })
    const [searchTerm, setSearchTerm] = useState("")
    const searchDebounce = useRef<NodeJS.Timeout | null>(null)
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: config.pagination?.pageSize || 10,
        totalPages: 0,
        totalItems: 0
    })
    const [filters, setFilters] = useState<FilterValue[]>([])
    const [visibleColumns, setVisibleColumns] = useState<string[]>(
        config.columns
            .filter(col => col.defaultVisible !== false)
            .map(col => col.accessorKey)
    )
    const [initialLoading, setInitialLoading] = useState(true)
    const [operationLoading, setOperationLoading] = useState(false)
    const { toast } = useToast()
    const [selectedRows, setSelectedRows] = useState<Record<number, boolean>>({})
    const [selectedRowData, setSelectedRowData] = useState<any>(null)
    const [isViewDataOpen, setIsViewDataOpen] = useState(false)
    const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)

    // New state for status filter
    const [statusOptions, setStatusOptions] = useState<StatusData[]>([])
    const [selectedStatus, setSelectedStatus] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('selectedResumeStatus') || null;
        }
        return null;
    });

    // Add these new states near your other state declarations
    const [hrOptions, setHrOptions] = useState<{ _id: string; name: string; }[]>([]);
    const [selectedHr, setSelectedHr] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('selectedResumeHr') || null;
        }
        return null;
    });

    // Fetch status options on component mount
    useEffect(() => {
        const fetchStatusOptions = async () => {
            try {
                const response = await fetch('/api/status')
                const data = await response.json()
                setStatusOptions(data)
            } catch (error) {
                console.error('Failed to fetch status options', error)
                toast({
                    title: "Error",
                    description: "Failed to load status options",
                    variant: "destructive"
                })
            }
        }

        fetchStatusOptions()
    }, [])

    // Update filters when status changes
    useEffect(() => {
        // Remove existing status filter if any
        const filteredFilters = filters.filter(f => f.column !== 'status')

        // Add new status filter if a status is selected
        if (selectedStatus !== "all_statuses") {
            const statusFilter: FilterValue = {
                column: 'status',
                operator: 'equals',
                value: selectedStatus || ""
            }
            setFilters([...filteredFilters, statusFilter])
        } else {
            setFilters(filteredFilters)
        }
    }, [selectedStatus])

    // Add this useEffect to fetch HR users
    useEffect(() => {
        const fetchHrOptions = async () => {
            try {
                const response = await fetch('/api/get-hr');
                const data = await response.json();
                setHrOptions(data);
            } catch (error) {
                console.error('Failed to fetch HR options', error);
                toast({
                    title: "Error",
                    description: "Failed to load HR options",
                    variant: "destructive"
                });
            }
        };

        fetchHrOptions();
    }, []);

    // Add this useEffect to update filters when HR selection changes
    useEffect(() => {
        // Remove existing createdBy filter if any
        const filteredFilters = filters.filter(f => f.column !== 'createdBy');

        // Add new createdBy filter if an HR is selected
        if (selectedHr !== "all_hr") {
            const hrFilter: FilterValue = {
                column: 'createdBy',
                operator: 'equals',
                value: selectedHr || ""
            };
            setFilters([...filteredFilters, hrFilter]);
        } else {
            setFilters(filteredFilters);
        }
    }, [selectedHr]);

    const loadTableData = useCallback(async (sortParams = '', searchParams = '') => {
        if (initialLoading) {
            setInitialLoading(true)
        } else {
            setOperationLoading(true)
        }
        try {
            const paginationParams = config.pagination?.enabled
                ? `${sortParams || searchParams ? '&' : '?'}page=${pagination.pageIndex + 1}&pageSize=${pagination.pageSize}`
                : ''

            const filterParams = filters.length > 0
                ? `${sortParams || searchParams || paginationParams ? '&' : '?'}filters=${encodeURIComponent(JSON.stringify(filters))}`
                : ''

            const response = await fetchTableData(
                `${config.endpoints.getAll}${sortParams}${searchParams}${paginationParams}${filterParams}`
            )
            setData(response.data.items)
            setPagination(prev => ({
                ...prev,
                totalPages: response.data.pagination?.totalPages || 0,
                totalItems: response.data.pagination?.totalItems || 0
            }))
            setError(null)

            // After loading table data, refresh status options if needed
            if (config.columns.some(col => col.accessorKey === 'status')) {
                try {
                    const statusResponse = await fetch('/api/status')
                    const statusData = await statusResponse.json()
                    setStatusOptions(statusData)
                } catch (error) {
                    console.error('Failed to fetch status options', error)
                }
            }
        } catch (error) {
            setError('Failed to fetch data')
            setData([])
        } finally {
            setInitialLoading(false)
            setOperationLoading(false)
        }
    }, [config.endpoints.getAll, sorting, searchTerm, pagination.pageSize, pagination.pageIndex, filters, config.title])

    useEffect(() => {
        const sortParams = sorting.column && sorting.direction
            ? `?sort=${sorting.column}&order=${sorting.direction}`
            : ''
        const searchParams = searchTerm && config.search?.searchableColumns
            ? `${sortParams ? '&' : '?'}search=${searchTerm}&searchColumns=${config.search.searchableColumns.join(',')}`
            : ''

        // Clear existing timeout
        if (searchDebounce.current) {
            clearTimeout(searchDebounce.current)
        }

        // Debounce search
        searchDebounce.current = setTimeout(() => {
            loadTableData(sortParams, searchParams)
        }, 300)

        return () => {
            if (searchDebounce.current) {
                clearTimeout(searchDebounce.current)
            }
        }
    }, [config.endpoints.getAll, sorting, searchTerm, pagination.pageSize, pagination.pageIndex, filters])

    const handleSort = (column: string) => {
        setSorting(prev => ({
            column,
            direction:
                prev.column === column && prev.direction === 'asc'
                    ? 'desc'
                    : prev.column === column && prev.direction === 'desc'
                        ? null
                        : 'asc'
        }))
    }

    const formatAddress = (address: any) => {
        if (!address) return '';
        const parts = [
            address.street,
            address.city,
            address.state,
            address.country,
            address.postalCode
        ].filter(Boolean);
        const addressString = parts.join(', ');
        return addressString.length >= 10 ? addressString.slice(0, 10) + '...' : addressString;
    };

    const truncateText = (text: string, maxLength: number = 25): string => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    };

    const formatObjectValue = (value: any): string => {
        if (!value || typeof value !== 'object') {
            return truncateText(String(value || ''));
        }

        if (Array.isArray(value)) {
            return truncateText(value.map(item => {
                if (typeof item === 'object') {
                    const { description, quantity, price } = item;
                    if (description && quantity && price) {
                        return `${description} (${quantity} × ${price})`;
                    }
                }
                return String(item);
            }).join(', '));
        }

        // Handle client object
        if ('name' in value && 'email' in value) {
            return truncateText(`${value.name} (${value.email})`);
        }

        // Handle other objects - don't format if it's a direct value
        if (Object.keys(value).length === 1) {
            const firstValue = Object.values(value)[0];
            return typeof firstValue === 'string' || typeof firstValue === 'number'
                ? String(firstValue)
                : truncateText(String(firstValue));
        }

        return truncateText(Object.entries(value)
            .map(([key, val]) => `${key}: ${formatObjectValue(val)}`)
            .join(' | '));
    };

    // Add this helper function to get nested object values
    const getNestedValue = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => {
            return acc && acc[part] !== undefined ? acc[part] : null;
        }, obj);
    };

    // Update formatValue function
    const formatValue = (value: any, accessorKey: string) => {
        // Get the actual value if it's a nested path
        const actualValue = accessorKey.includes('.')
            ? getNestedValue(value, accessorKey)
            : value[accessorKey];

        if (actualValue === null || actualValue === undefined) {
            return '-';
        }

        // Handle status with special styling
        if (accessorKey === 'status') {
            const status = String(actualValue).toLowerCase();
            // Find the matching status option to get its color
            const statusOption = statusOptions.find(
                opt => opt.status.toLowerCase() === status
            );
            return (
                <span
                    className="px-2 py-1 rounded-full text-white"
                    style={{
                        backgroundColor: statusOption?.color || '#000000',
                        display: 'inline-block',
                        color: statusOption?.color ? (statusOption.color === '#000000' ? 'white' : '#000000') : 'white'
                    }}
                >
                    {actualValue}
                </span>
            );
        }

        if (accessorKey === 'skills') {
            return actualValue.map((skill: any) => skill.name).join(', ');
        }

        if (accessorKey === 'stats.Rating') {
            const rating = String(actualValue).toLowerCase();
            return (
                <span className={`${ratingStyles[rating] || "text-primary"}`}>
                    {actualValue}
                </span>
            );
        }

        // Handle dates
        const dateFields = ['createdAt', 'updatedAt', 'dateIssued', 'dueDate'];
        if (actualValue instanceof Date ||
            dateFields.some(field => accessorKey.toLowerCase().includes(field.toLowerCase())) ||
            (typeof actualValue === 'string' && !isNaN(Date.parse(actualValue)))) {
            try {
                const date = new Date(actualValue);
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

        // Handle numbers with formatting
        if (typeof actualValue === 'number') {
            if (accessorKey === 'total' || accessorKey.includes('price')) {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(actualValue);
            }
            return actualValue.toLocaleString();
        }

        // Handle objects (including arrays)
        if (typeof actualValue === 'object') {
            return formatObjectValue(actualValue);
        }

        // Truncate regular text values
        return truncateText(String(actualValue));
    };

    const handleSelectAll = (checked: boolean) => {
        const newSelected = { ...selectedRows }
        data.forEach((row, index) => {
            newSelected[index] = checked
        })
        setSelectedRows(newSelected)
        config.select?.onSelect?.(checked ? data : [])
    }

    const handleSelectRow = (rowIndex: number, checked: boolean) => {
        const newSelected = {
            ...selectedRows,
            [rowIndex]: checked
        }
        setSelectedRows(newSelected)

        const selectedData = data.filter((_, index) => newSelected[index])
        config.select?.onSelect?.(selectedData)
    }

    const isAllSelected = data.length > 0 && data.every((_, index) => selectedRows[index])
    const isSomeSelected = data.some((_, index) => selectedRows[index])

    const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>, row: any) => {
        // Get the closest table row element from the click target
        const clickedRow = (e.target as HTMLElement).closest('tr')
        // Get the row that contains the click handler
        const currentRow = e.currentTarget

        // Only trigger if we clicked directly on this row and not on a dialog
        if (clickedRow === currentRow && !document.querySelector('[role="dialog"]')) {
            setSelectedRowData(row)
            setIsViewDataOpen(true)
        }
    }

    const getSelectedCount = () => {
        return Object.values(selectedRows).filter(Boolean).length
    }

    const getSelectedData = () => {
        return data.filter((_, index) => selectedRows[index])
    }

    if (error) {
        return (
            <div className="m-4 p-4 border border-red-200 rounded-lg bg-red-50 text-red-600">
                {error}
            </div>
        )
    }

    return (
        <div className={cn("m-4 rounded-lg", config.styles?.wrapper)}>
            {config.title && (
                <h1 className={cn(
                    "text-4xl font-bold text-left pt-4",
                    config.styles?.title
                )}>
                    {config.title}
                </h1>
            )}
            {config.description && (
                <p className={cn(
                    "text-left text-sm text-primary pb-4 pl-2",
                    config.styles?.description
                )}>
                    {config.description}
                </p>
            )}
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    {config.search?.enabled && (
                        <TableSearch
                            config={config.search}
                            value={searchTerm}
                            onChange={setSearchTerm}
                        />
                    )}
                    {config.edit?.allowAdd && (
                        config.title?.toLowerCase() === 'status' ? (
                            <TableAddStatusData
                                config={config}
                                onSuccess={() => loadTableData()}
                            />
                        ) : (
                            <TableAdd
                                config={config}
                                onSuccess={() => loadTableData()}
                            />
                        )
                    )}
                    {config.title?.toLowerCase() === 'resumes' && (
                        <Button variant="outline" onClick={() => router.push("/upload-resume")}>
                            Upload Resume
                        </Button>
                    )}
                    {config.filter?.enabled && (
                        <TableFilter
                            config={config.filter}
                            columns={config.columns}
                            onFilterChange={setFilters}
                            sorting={sorting}
                            onLoadFilter={(newFilters, newSorting) => {
                                setFilters(newFilters)
                                setSorting(newSorting)
                            }}
                            tableName={config.title?.toLowerCase() || 'default'}
                        />
                    )}

                    {config.title?.toLowerCase() === 'resumes' && (
                        <>
                            {/* Existing Status filter */}
                            <Select
                                value={selectedStatus || undefined}
                                onValueChange={(value) => {
                                    setSelectedStatus(value);
                                    if (typeof window !== 'undefined') {
                                        if (value === 'all_statuses') {
                                            localStorage.removeItem('selectedResumeStatus');
                                        } else {
                                            localStorage.setItem('selectedResumeStatus', value);
                                        }
                                    }
                                }}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_statuses">All Statuses</SelectItem>
                                    {statusOptions.map((statusItem) => (
                                        <SelectItem key={statusItem._id} value={statusItem.status}>
                                            {statusItem.status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* New HR filter */}
                            <Select
                                value={selectedHr || undefined}
                                onValueChange={(value) => {
                                    setSelectedHr(value);
                                    if (typeof window !== 'undefined') {
                                        if (value === 'all_hr') {
                                            localStorage.removeItem('selectedResumeHr');
                                        } else {
                                            localStorage.setItem('selectedResumeHr', value);
                                        }
                                    }
                                }}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by HR" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_hr">All HR</SelectItem>
                                    {hrOptions.map((hr) => (
                                        <SelectItem key={hr._id} value={hr.name}>
                                            {hr.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </>
                    )}

                    {config.select?.enabled && getSelectedCount() > 0 && (
                        <>
                            <span className="text-sm text-muted-foreground">
                                {getSelectedCount()} row{getSelectedCount() > 1 ? 's' : ''} selected
                            </span>
                            {config.bulkEdit?.enabled && (
                                <TableBulkEdit
                                    config={config}
                                    selectedData={getSelectedData()}
                                    onSuccess={() => loadTableData()}
                                    onClearSelection={() => setSelectedRows({})}
                                    isOpen={isBulkEditOpen}
                                    onOpenChange={setIsBulkEditOpen}
                                />
                            )}
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {config.import?.enabled && (
                        <TableImport
                            config={config.import}
                            endpoint={config.endpoints.import || `${config.endpoints.getAll}/import`}
                            onSuccess={() => loadTableData()}
                        />
                    )}

                    {config.export?.enabled && (
                        <TableExport
                            config={config.export}
                            endpoint={config.endpoints.export || `${config.endpoints.getAll}/export`}
                            filters={filters.length > 0 ? JSON.stringify(filters) : undefined}
                            search={searchTerm}
                        />
                    )}

                    {config.columnToggle?.enabled && (
                        <TableColumnToggle
                            tableId={config.title?.toLowerCase() || 'default'}
                            columns={config.columns}
                            visibleColumns={visibleColumns}
                            onColumnToggle={setVisibleColumns}
                        />
                    )}
                </div>
            </div>
            <div className="relative border rounded-lg overflow-hidden shadow-sm px-2">
                {operationLoading && (
                    <div className="absolute inset-0 bg-background backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                            <span className="text-muted-foreground">
                                Loading...
                            </span>
                        </div>
                    </div>
                )}

                <Table className={config.styles?.table}>
                    <TableHeader className={config.styles?.header}>
                        <TableRow className={config.styles?.headerRow}>
                            {config.select?.enabled && (
                                <TableHead className="w-[50px] px-4">
                                    {config.select.type === 'multiple' && (
                                        <TableSelect
                                            checked={isAllSelected}
                                            indeterminate={!isAllSelected && isSomeSelected}
                                            onChange={handleSelectAll}
                                        />
                                    )}
                                </TableHead>
                            )}
                            {config.columns
                                .filter(column => visibleColumns.includes(column.accessorKey))
                                .map((column) => (
                                    <TableHead
                                        key={column.id}
                                        className={cn(
                                            config.styles?.headerCell,
                                            column.className,
                                            column.sortable && "cursor-pointer select-none"
                                        )}
                                        onClick={() => {
                                            if (column.sortable) {
                                                handleSort(column.accessorKey)
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            {column.header}
                                            {column.sortable && (
                                                <div className="flex flex-col">
                                                    <ChevronUp
                                                        className={cn(
                                                            "h-3 w-3 -mb-1",
                                                            sorting.column === column.accessorKey &&
                                                                sorting.direction === 'asc'
                                                                ? "text-foreground"
                                                                : "text-muted-foreground opacity-50"
                                                        )}
                                                    />
                                                    <ChevronDown
                                                        className={cn(
                                                            "h-3 w-3",
                                                            sorting.column === column.accessorKey &&
                                                                sorting.direction === 'desc'
                                                                ? "text-foreground"
                                                                : "text-muted-foreground opacity-50"
                                                        )}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </TableHead>
                                ))}
                            {config.edit?.enabled && (
                                <TableHead className={cn("w-[50px]", config.edit?.style?.column)}>
                                    Actions
                                </TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody className={config.styles?.body}>
                        {initialLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={config.columns.length}
                                    className="h-24 text-center"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                                        <span className="text-muted-foreground">
                                            Loading data...
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={config.columns.length}
                                    className={cn(
                                        "h-24 text-center text-muted-foreground",
                                        config.styles?.noResults
                                    )}
                                >
                                    No results found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, rowIndex) => (
                                <TableRow
                                    key={rowIndex}
                                    className={cn(
                                        config.styles?.bodyRow,
                                        "cursor-pointer hover:bg-muted/50"
                                    )}
                                    onClick={(e) => {
                                        // Prevent row click if clicking on select checkbox or edit button
                                        if (
                                            (e.target as HTMLElement).closest('input[type="checkbox"]') ||
                                            (e.target as HTMLElement).closest('button') ||
                                            (e.target as HTMLElement).closest('[role="dialog"]')
                                        ) {
                                            return
                                        }
                                        handleRowClick(e, row)
                                    }}
                                >
                                    {config.select?.enabled && (
                                        <TableCell className="w-[50px] px-4">
                                            <TableSelect
                                                checked={!!selectedRows[rowIndex]}
                                                onChange={(checked) => {
                                                    if (config.select?.type === 'single') {
                                                        setSelectedRows({
                                                            [rowIndex]: checked
                                                        })
                                                        config.select?.onSelect?.(checked ? [row] : [])
                                                    } else {
                                                        handleSelectRow(rowIndex, checked)
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                    )}
                                    {config.columns
                                        .filter(column => visibleColumns.includes(column.accessorKey))
                                        .map((column) => (
                                            <TableCell
                                                key={`${rowIndex}-${column.id}`}
                                                className={cn(
                                                    config.styles?.bodyCell,
                                                    column.className
                                                )}
                                            >
                                                {formatValue(row, column.accessorKey)}
                                            </TableCell>
                                        ))}
                                    {config.edit?.enabled && (
                                        <TableCell>
                                            <TableEdit
                                                config={config}
                                                data={row}
                                                onSuccess={(updatedStatusData: any) => {
                                                    if (updatedStatusData) {
                                                        setStatusOptions(updatedStatusData)
                                                    }
                                                    loadTableData()
                                                }}
                                            />
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {config.pagination?.enabled && (
                <TablePagination
                    config={config.pagination}
                    state={pagination}
                    onChange={(newState) => setPagination(prev => ({
                        ...prev,
                        ...newState
                    }))}
                />
            )}

            {selectedRowData && (<>
                {config.title?.toLowerCase() === 'resumes' ? (<TableResumeViewData
                    isOpen={isViewDataOpen}
                    onClose={() => {
                        setIsViewDataOpen(false)
                        setSelectedRowData(null)
                    }}
                    data={selectedRowData}
                    columns={[...config.columns, { accessorKey: 'skills', header: 'Skills' }]}
                />) : (
                    <TableViewData
                        isOpen={isViewDataOpen}
                        onClose={() => {
                            setIsViewDataOpen(false)
                            setSelectedRowData(null)
                        }}
                        data={selectedRowData}
                        columns={[...config.columns, { accessorKey: 'updatedAt', header: 'Updated At' }]}

                    />
                )}
            </>
            )}
        </div>
    )
}
