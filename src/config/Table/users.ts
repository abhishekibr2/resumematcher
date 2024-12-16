"use client"
import { TableConfig } from "../../types/table.types";

interface UserData {
  name: string;
  email: string;
  role: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
}

const commonApi = "table/users"

export const userTableConfig: TableConfig<UserData> = {
  id: "user-table",
  title: "Users",
  description: "List of all registered users",
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
      id: "name",
      header: "Name",
      accessorKey: "name",
      className: "w-[200px] text-gray-900 font-semibold",
      sortable: true,
      filterable: true,
      defaultVisible: true,
      type: "text"
    },
    {
      id: "email",
      header: "Email",
      accessorKey: "email",
      className: "min-w-[250px] text-blue-600 hover:text-blue-800",
      sortable: true,
      filterable: true,
      type: "email"
    },
    {
      id: "password",
      header: "Password",
      accessorKey: "password",
      className: "w-[150px]",
      sortable: true,
      filterable: true,
      type: "text"
    },
    {
      id: "role",
      header: "Role",
      accessorKey: "role",
      className: "w-[150px]",
      sortable: true,
      filterable: true,
      type: "select",
      options: [
        { label: "Admin", value: "admin" },
        { label: "User", value: "user" },
      ]
    },
  ],
  search: {
    enabled: true,
    placeholder: "Search users...",
    searchableColumns: ["name", "email", "role"]
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
    enabled: true,
    formats: ['csv', 'excel', 'pdf'],
    filename: 'users-export'
  },
  import: {
    enabled: true,
    formats: ['csv'],
    template: '/templates/users-import-template.csv'
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
        description: "This action cannot be undone. This will permanently delete the user and remove their data from our servers.",
        confirm: "Delete",
        cancel: "Cancel"
      },
      success: {
        update: "User has been updated successfully",
        delete: "User has been deleted successfully"
      },
      error: {
        update: "Failed to update user",
        delete: "Failed to delete user"
      },
      loading: {
        update: "Updating user...",
        delete: "Deleting user..."
      }
    }
  },
  bulkEdit: {

    enabled: true,
    allowDelete: true,
    fields: [
      {
        name: 'role',
        label: 'Role',
        type: 'select',
        options: [
          { label: 'User', value: 'user' },
          { label: 'Admin', value: 'admin' },
        ]
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'Enter email'
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        placeholder: 'Enter password'
      }
    ]
  },
};