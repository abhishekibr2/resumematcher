"use client"
import { TableConfig } from "../../types/table.types";

interface ResumeData {
  fullName: string;
  contact: {
    email?: string;
    phone?: string;
    linkedin?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
  };
  status?: string;
  summary?: string;
  skills?: string[];
  stats?: {
    Expertise?: string;
    Rating?: number;
    should_contact?: boolean;
  };
  checked?: boolean;
}

const commonApi = "table/resume"

export const resumeTableConfig: TableConfig<ResumeData> = {
  id: "resume-table",
  title: "Resumes",
  description: "List of all submitted resumes",
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
    title: "text-4xl text-primary mb-2",
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
      id: "fullName",
      header: "Full Name",
      accessorKey: "fullName",
      className: "w-[200px] text-gray-900",
      sortable: true,
      filterable: true,
      defaultVisible: true,
      type: "text"
    },
    {
      id: "email",
      header: "Email",
      accessorKey: "contact.email",
      className: "min-w-[250px] text-blue-600 hover:text-blue-800",
      sortable: true,
      filterable: true,
      type: "email"
    },
    {
      id: "experience",
      header: "Experience",
      accessorKey: "stats.experience",
      className: "w-[150px]",
      sortable: true,
      filterable: true,
      type: "text"
    },
    {
      id: "phone",
      header: "Phone",
      accessorKey: "contact.phone",
      className: "w-[150px]",
      sortable: true,
      type: "phone"
    },
    {
      id: "expertise",
      header: "Expertise",
      accessorKey: "stats.Expertise",
      className: "w-[150px]",
      sortable: true,
      filterable: true,
      type: "text"
    },
    {
      id: "rating",
      header: "Rating",
      accessorKey: "stats.Rating",
      className: "w-[100px]",
      sortable: true,
      filterable: true,
      type: "number"
    },
    {
      id: "shouldContact",
      header: "Should Contact",
      accessorKey: "stats.should_contact",
      className: "w-[120px]",
      sortable: true,
      filterable: true,
      type: "boolean",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false }
      ]
    },
    {
      id: "city",
      header: "City",
      accessorKey: "contact.address.city",
      className: "w-[150px]",
      sortable: true,
      filterable: true,
      type: "text"
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      className: "w-[150px]",
      sortable: true,
      filterable: true,
      type: "select",
      options: []
    },
    {
      id: "notes",
      header: "Notes",
      accessorKey: "notes",
      className: "w-[150px]",
      sortable: true,
      filterable: true,
      type: "textarea"
    },
    {
      id: "updatedAt",
      header: "Updated At",
      accessorKey: "updatedAt",
      className: "w-[150px]",
      sortable: true,
      filterable: true,
      type: "date"
    },
    {
      id: "createdAt",
      header: "Created At",
      accessorKey: "createdAt",
      className: "w-[150px]",
      sortable: true,
      filterable: true,
      type: "date"
    }
  ],
  search: {
    enabled: true,
    placeholder: "Search resumes...",
    searchableColumns: ["fullName", "contact.email", "contact.phone", "status"]
  },
  pagination: {
    enabled: true,
    pageSize: 10,
    pageSizeOptions: [5, 10, 20, 50]
  },
  filter: {
    enabled: true,
    operators: []
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
    template: '/templates/resumes-import-template.csv'
  },
  select: {
    enabled: true,
    type: 'multiple',
    onSelect: (selectedRows) => {
    }
  },
  edit: {
    enabled: true,
    allowDelete: true,
    allowUpdate: true,
    confirmDelete: true,
    allowAdd: false,
    style: {
      column: "w-[50px]",
      editButton: "hover:text-blue-600",
      deleteButton: "hover:text-red-600"
    },
    messages: {
      deleteConfirm: {
        title: "Are you sure?",
        description: "This action cannot be undone. This will permanently delete the resume and remove their data from our servers.",
        confirm: "Delete",
        cancel: "Cancel"
      },
      success: {
        update: "Resume has been updated successfully",
        delete: "Resume has been deleted successfully"
      },
      error: {
        update: "Failed to update resume",
        delete: "Failed to delete resume"
      },
      loading: {
        update: "Updating resume...",
        delete: "Deleting resume..."
      }
    }
  },
  bulkEdit: {
    enabled: true,
    allowDelete: true,
    fields: [
      {
        name: 'stats.Expertise',
        label: 'Expertise',
        type: 'select',
        options: [
          { label: 'Junior', value: 'junior' },
          { label: 'Mid-Level', value: 'mid-level' },
          { label: 'Senior', value: 'senior' },
          { label: 'Expert', value: 'expert' }
        ]
      },
      {
        name: 'stats.Rating',
        label: 'Rating',
        type: 'number',
      },
      {
        name: 'stats.should_contact',
        label: 'Should Contact',
        type: 'checkbox'
      },
      {
        name: 'contact.email',
        label: 'Email',
        type: 'email',
        placeholder: 'Enter email'
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: []
      },
      {
        name: 'notes',
        label: 'Notes',
        type: 'textarea',
        placeholder: 'Enter notes'
      }
    ]
  }
};