"use client"
import { TableConfig } from "../../types/table.types";

interface StatusData {
  status: string;
}

const commonApi = "table/status"

export const statusTableConfig: TableConfig<StatusData> = {
  id: "status-table",
  title: "Status",
  description: "List of all submitted status",
  endpoints: {
    getAll: `${commonApi}`,
    create: `${commonApi}`,
    export: `${commonApi}?action=export`,
    import: `${commonApi}?action=import`,
    update: `${commonApi}`,
    delete: `${commonApi}`,
    getOne: `${commonApi}/get`,
    bulkEdit: `${commonApi}?action=bulk-update`,
    bulkDelete: `${commonApi}?action=bulk-delete`
  },
  styles: {
    wrapper: "py-8",
    title: "text-4xl font-semibold text-primary mb-2",
    description: "text-sm text-secondary mb-6",
    table: "min-w-full divide-border rounded-lg overflow-hidden shadow-sm ",
    header: "bg-background/50 backdrop-blur-sm sticky top-0",
    headerRow: "divide-x divide-border",
    headerCell: "px-6 py-4 text-left text-xs font-medium text-muted uppercase tracking-wider bg-card/50",
    body: "divide-y divide-border bg-card",
    bodyRow: "divide-x divide-border transition-colors hover:bg-background/50",
    bodyCell: "px-6 py-4 text-sm text-muted font-medium whitespace-nowrap",
    noResults: "px-6 py-12 text-center text-muted bg-card/50 backdrop-blur-sm"
  },
  columns: [
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      className: "w-[200px] text-gray-900 font-semibold",
      sortable: true,
      filterable: true,
      defaultVisible: true,
      type: "text"
    },
    {
      id: "createdBy",
      header: "Created By",
      accessorKey: "createdBy",
      className: "w-[200px] text-gray-900 font-semibold",
      sortable: true,
      filterable: true,
      defaultVisible: true,
      type: "hidden"
    },
    {
      id: "color",
      header: "Color",
      accessorKey: "color",
      className: "w-[200px] text-gray-900 font-semibold",
      sortable: true,
      filterable: true,
      defaultVisible: true,
      type: "color"
    },
    {
      id: "createdAt",
      header: "Created At",
      accessorKey: "createdAt",
      className: "w-[200px] text-gray-900 font-semibold",
      sortable: true,
      filterable: true,
      defaultVisible: true,
      type: "date"
    }
  ],
  search: {
    enabled: true,
    placeholder: "Search status...",
    searchableColumns: ["status", "title"]
  },
  pagination: {
    enabled: true,
    pageSize: 10,
    pageSizeOptions: [5, 10, 20, 50]
  },
  filter: {
    enabled: true,
    operators: [
    ]
  },
  columnToggle: {
    enabled: true,
    defaultVisible: true
  },
  export: {
    enabled: false,
    formats: ['csv', 'excel', 'pdf'],
    filename: 'resumes-export'
  },
  import: {
    enabled: false,
    formats: ['csv'],
    template: '/templates/status-import-template.csv'
  },
  select: {
    enabled: true,
    type: 'multiple',
    onSelect: (selectedRows) => {
      console.log('Selected rows:', selectedRows)
    }
  },
  edit: {
    enabled: true,
    allowDelete: true,
    allowUpdate: true,
    confirmDelete: true,
    allowAdd: true,
    style: {
      column: "w-[50px]",
      editButton: "hover:text-blue-600",
      deleteButton: "hover:text-red-600"
    },
    messages: {
      deleteConfirm: {
        title: "Are you sure?",
        description: "This action cannot be undone. This will permanently delete the status and remove their data from our servers.",
        confirm: "Delete",
        cancel: "Cancel"
      },
      success: {
        update: "Status has been updated successfully",
        delete: "Status has been deleted successfully"
      },
      error: {
        update: "Failed to update status",
        delete: "Failed to delete status"
      },
      loading: {
        update: "Updating status...",
        delete: "Deleting status..."
      }
    }
  },
  bulkEdit: {
    enabled: true,
    allowDelete: true,
    fields: [
      {
        name: 'status',
        label: 'Status',
        type: 'input'
      }
    ]
  }
};