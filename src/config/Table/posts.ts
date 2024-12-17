"use client"
import { TableConfig } from "../../types/table.types";

interface PostsData {
  title: string;
  post: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const commonApi = "table/posts"

export const postsTableConfig: TableConfig<PostsData> = {
  id: "posts-table",
  title: "Posts",
  description: "List of all submitted posts",
  endpoints: {
    getAll: `${commonApi}`,
    create: `${commonApi}`,
    update: `${commonApi}`,
    delete: `${commonApi}`,
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
      id: "post",
      header: "Post",
      accessorKey: "post",
      className: "w-[300px]",
      sortable: true,
      filterable: true,
      type: "textarea"
    },
    {
      id: "createdBy",
      header: "Created By",
      accessorKey: "createdBy",
      className: "w-[150px]",
      sortable: true,
      filterable: true,
      type: "text"
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
    placeholder: "Search posts...",
    searchableColumns: ["title", "post"]
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
  select: {
    enabled: true,
    type: 'multiple',
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
        description: "This action cannot be undone. This will permanently delete the post.",
        confirm: "Delete",
        cancel: "Cancel"
      },
      success: {
        update: "Post has been updated successfully",
        delete: "Post has been deleted successfully"
      },
      error: {
        update: "Failed to update post",
        delete: "Failed to delete post"
      },
      loading: {
        update: "Updating post...",
        delete: "Deleting post..."
      }
    }
  },
  bulkEdit: {
    enabled: true,
    allowDelete: true,
    fields: [
      {
        name: 'title',
        label: 'Title',
        type: 'input'
      },
      {
        name: 'post',
        label: 'Post',
        type: 'textarea'
      }
    ]
  }
};