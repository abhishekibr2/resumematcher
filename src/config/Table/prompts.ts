"use client"
import { TableConfig } from "../../types/table.types";

interface PromptsData {
  prompt: string;
}

const commonApi = "table/prompt"

export const promptsTableConfig: TableConfig<PromptsData> = {
  id: "prompts-table",
  title: "Prompts",
  description: "List of all submitted prompts",
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
      id: "title",
      header: "Title",
      accessorKey: "title",
      className: "w-[200px] text-gray-900 font-semibold",
      sortable: true,
      filterable: true,
      defaultVisible: true,
      type: "text"
    },
    {
      id: "prompt",
      header: "Prompt",
      accessorKey: "prompt",
      className: "w-[200px] text-gray-900 font-semibold",
      sortable: true,
      filterable: true,
      defaultVisible: true,
      type: "text"
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
    placeholder: "Search prompts...",
    searchableColumns: ["prompt", "title"]
  },
  pagination: {
    enabled: true,
    pageSize: 10,
    pageSizeOptions: [5, 10, 20, 50]
  },
  filter: {
    enabled: true,
    operators: [
      { label: 'Equals', value: 'equals' },
      { label: 'Not Equals', value: 'notEquals' },
      { label: 'Contains', value: 'contains' },
      { label: 'Not Contains', value: 'notContains' }
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
    template: '/templates/prompts-import-template.csv'
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
        description: "This action cannot be undone. This will permanently delete the prompt and remove their data from our servers.",
        confirm: "Delete",
        cancel: "Cancel"
      },
      success: {
        update: "Prompt has been updated successfully",
        delete: "Prompt has been deleted successfully"
      },
      error: {
        update: "Failed to update prompt",
        delete: "Failed to delete prompt"
      },
      loading: {
        update: "Updating prompt...",
        delete: "Deleting prompt..."
      }
    }
  },
  bulkEdit: {
    enabled: true,
    allowDelete: true,
    fields: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea'
      }
    ]
  }
};