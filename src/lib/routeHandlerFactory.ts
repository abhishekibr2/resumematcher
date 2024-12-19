import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Model } from 'mongoose'
import { FilterValue } from '@/types/table.types'
import { parse } from 'csv-parse'
import { Parser } from 'json2csv'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import bcrypt from 'bcryptjs';
import { Role } from '@/models/Roles'
import { connectToDatabase } from "./mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { User } from "@/models/user";
import * as ftp from "basic-ftp";

// Add after imports
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

interface RouteHandlerOptions {
    model: Model<any>;
    permissions?: string[];
    searchableFields?: string[];
    exportFields?: string[];
    importFields?: string[];
}

// Add this helper function before the export handler
const formatObjectForExport = (obj: any, parentKey: string = ''): string => {
    if (!obj || typeof obj !== 'object') return String(obj || '-')

    return Object.entries(obj)
        .map(([key, value]) => {
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1)
            if (value instanceof Date) {
                return `${formattedKey}: ${value.toLocaleString()}`
            }
            if (typeof value === 'object' && value !== null) {
                return `${formattedKey}: ${formatObjectForExport(value, key)}`
            }
            return `${formattedKey}: ${value}`
        })
        .join(' | ')
}

// Add this helper function at the top
const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.')
    let current = obj

    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
            current[keys[i]] = {}
        }
        current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
}

// Helper function to check user management permissions
async function checkUserPermissions(userId: string, operation: 'delete' | 'update' | 'update_password') {
    const user = await User.findById(userId).populate('role');

    switch (operation) {
        case 'delete':
            if (!user?.role?.userPermissions?.can_delete_users) {
                throw new Error('You do not have permission to delete users');
            }
            break;
        case 'update':
            if (!user?.role?.userPermissions?.can_update_users) {
                throw new Error('You do not have permission to update users');
            }
            break;
        case 'update_password':
            if (!user?.role?.userPermissions?.can_update_user_password) {
                throw new Error('You do not have permission to update user passwords');
            }
            break;
    }
}

export function createRouteHandlers({ model, permissions = [], searchableFields = [], exportFields = [], importFields = [] }: RouteHandlerOptions) {
    return {


        async getAll(request: NextRequest) {
            // Existing permission check remains the same
            if (!permissions.includes('read')) {
                return NextResponse.json({
                    status: 403,
                    message: "You are not authorized to access this resource"
                }, { status: 403 })
            }

            // Helper function to sanitize items
            const sanitizeItems = (items: any[]) => {
                return items.map(item => {
                    // Create a deep copy of the item to avoid modifying the original
                    const sanitizedItem = JSON.parse(JSON.stringify(item));

                    // Recursively mask password fields
                    const maskSensitiveFields = (obj: any) => {
                        for (const key in obj) {
                            if (obj.hasOwnProperty(key)) {
                                if (typeof obj[key] === 'object' && obj[key] !== null) {
                                    // Recursively check nested objects
                                    maskSensitiveFields(obj[key]);
                                } else if (
                                    // Check for password-related field names
                                    key.toLowerCase().includes('password') ||
                                    key.toLowerCase().includes('pwd') ||
                                    key.toLowerCase().includes('secret')
                                ) {
                                    obj[key] = "[sensitive information]";
                                }
                            }
                        }
                    };

                    maskSensitiveFields(sanitizedItem);
                    return sanitizedItem;
                });
            };

            try {
                const searchParams = request.nextUrl.searchParams
                const sort = searchParams.get('sort')
                const order = searchParams.get('order')
                const search = searchParams.get('search')
                const searchColumns = searchParams.get('searchColumns')?.split(',')
                const page = parseInt(searchParams.get('page') || '1')
                const pageSize = parseInt(searchParams.get('pageSize') || '10')
                const filters = searchParams.get('filters') ? JSON.parse(searchParams.get('filters')!) : []

                // Build sort query
                const sortOptions: any = {}
                if (sort && order) {
                    sortOptions[sort] = order === 'asc' ? 1 : -1
                    // Always include createdAt as a secondary sort
                    sortOptions.updatedAt = -1
                } else {
                    // Default sort by createdAt desc
                    sortOptions.updatedAt = -1
                }

                // Build search query
                let searchQuery = {}
                if (search && searchColumns) {
                    //check if they are objects
                    if (!searchColumns.every(col => searchableFields.includes(col))) {
                        console.log("Invalid search columns specified", { searchColumns, searchableFields })
                        return NextResponse.json({
                            status: 400,
                            message: "Invalid search columns specified"
                        }, { status: 400 })
                    }
                    searchQuery = {
                        $or: searchColumns.map(column => ({
                            [column]: { $regex: search, $options: 'i' }
                        }))
                    }
                }

                // Build filter query
                let filterQuery = {};
                if (filters.length > 0) {
                    filterQuery = {
                        $and: filters
                            .filter((filter: FilterValue) => filter.value !== undefined && filter.value !== '')
                            .map((filter: FilterValue) => {
                                switch (filter.operator) {
                                    case 'equals':
                                        return { [filter.column]: filter.value };
                                    case 'notEquals':
                                        return { [filter.column]: { $ne: filter.value } };
                                    case 'contains':
                                        return { [filter.column]: { $regex: filter.value, $options: 'i' } };
                                    case 'notContains':
                                        return { [filter.column]: { $not: { $regex: filter.value, $options: 'i' } } };
                                    default:
                                        return {};
                                }
                            })
                    };
                }


                const finalQuery = { ...searchQuery, ...filterQuery }

                try {
                    const totalItems = await model.countDocuments(finalQuery)
                    const totalPages = Math.ceil(totalItems / pageSize)

                    if (page > totalPages && totalItems > 0) {
                        console.log("Page number exceeds available pages")
                        return NextResponse.json({
                            status: 400,
                            message: "Page number exceeds available pages"
                        }, { status: 400 })
                    }

                    let items = await model.find(finalQuery)
                        .sort(sortOptions)
                        .skip((page - 1) * pageSize)
                        .limit(pageSize);

                    if (model.modelName === 'users') {
                        items = await Promise.all(items.map(async (item) => {
                            const plainItem = item.toObject();
                            if (plainItem.role) {
                                // Fetch the role document using the role ID
                                const roleDoc = await Role.findById(plainItem.role);
                                // Replace role ID with role name
                                plainItem.roleName = roleDoc?.name || 'Unknown Role';
                            }
                            return plainItem;
                        }));
                    }

                    // Sanitize items before sending
                    const sanitizedItems = sanitizeItems(items);

                    if (sanitizedItems.length === 0) {
                        return NextResponse.json({
                            status: 200,
                            message: "No records found",
                            data: {
                                items: [],
                                pagination: {
                                    totalItems: 0,
                                    totalPages: 0,
                                    currentPage: page,
                                    pageSize
                                }
                            }
                        });
                    }

                    return NextResponse.json({
                        status: 200,
                        message: "Data fetched successfully",
                        data: {
                            items: sanitizedItems,
                            pagination: {
                                totalItems,
                                totalPages,
                                currentPage: page,
                                pageSize
                            }
                        }
                    })
                } catch (error) {
                    throw new Error("Database query failed")
                }
            } catch (error) {
                console.error('GET error:', error)
                return NextResponse.json({
                    status: 500,
                    message: error instanceof Error ? error.message : "Failed to fetch data"
                }, { status: 500 })
            }
        },

        // POST handler for creating new items
        async create(request: Request) {
            try {
                const data = await request.json()

                // Get session and check permissions if this is a user operation
                if (model.modelName === 'users') {
                    const session = await getServerSession(authOptions);
                    if (!session?.user?._id) {
                        return NextResponse.json({
                            status: 401,
                            message: "Unauthorized"
                        }, { status: 401 });
                    }

                    try {
                        await checkUserPermissions(session.user._id, 'update');
                    } catch (error) {
                        return NextResponse.json({
                            status: 403,
                            message: error instanceof Error ? error.message : "Unauthorized"
                        }, { status: 403 });
                    }
                }

                // If this is a user creation and we have roleName but no role
                if (model.modelName === 'users' && data.roleName && !data.role) {
                    try {
                        // Fetch the role using the roleName (which is actually the role ID)
                        const role = await Role.findById(data.roleName)
                        if (!role) {
                            return NextResponse.json({
                                status: 400,
                                message: "Invalid role specified"
                            }, { status: 400 })
                        }

                        // Set both role and roleName correctly
                        data.role = role._id
                        data.roleName = role.name // Set the actual role name
                    } catch (error) {
                        console.error('Error fetching role:', error)
                        return NextResponse.json({
                            status: 400,
                            message: "Invalid role specified"
                        }, { status: 400 })
                    }
                }

                // Helper function to check nested fields
                const checkNestedField = (obj: any, path: string): boolean => {
                    const keys = path.split('.')
                    let current = obj

                    for (const key of keys) {
                        if (!current || !current[key]) {
                            return false
                        }
                        current = current[key]
                    }
                    return true
                }

                // Validate required fields including nested fields and arrays
                const missingFields = importFields.filter(field => {
                    if (field.includes('.')) {
                        return !checkNestedField(data, field)
                    }
                    if (Array.isArray(data[field])) {
                        return data[field].length === 0
                    }
                    return !data[field]
                })
                if (missingFields.length > 0) {
                    return NextResponse.json({
                        status: 400,
                        message: `Missing required fields: ${missingFields.join(', ')}`
                    }, { status: 400 })
                }

                // Process array fields if needed
                const processedData = { ...data }
                Object.entries(data).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                        processedData[key] = value.map(item => {
                            return item
                        })
                    }
                })

                // Hash the password before saving  

                if (data.password) {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(data.password, salt);
                    processedData.password = hashedPassword
                }

                const item = new model({
                    ...processedData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                })

                try {
                    await item.save()
                } catch (error) {
                    if (error instanceof Error && error.name === 'ValidationError') {
                        return NextResponse.json({
                            status: 400,
                            message: "Validation failed",
                            errors: error.message
                        }, { status: 400 })
                    }
                    throw error
                }

                return NextResponse.json({
                    status: 200,
                    message: "Item created successfully",
                    data: item
                })
            } catch (error) {
                console.error('Create error:', error)
                return NextResponse.json({
                    status: 500,
                    message: error instanceof Error ? error.message : "Failed to create item"
                }, { status: 500 })
            }
        },

        // POST handler for updating items
        async update(request: Request) {
            if (!permissions.includes('update')) {
                return NextResponse.json({
                    status: 403,
                    message: "You are not authorized to access this resource"
                }, { status: 403 })
            }
            try {
                const data = await request.json()
                const { _id, ...updateData } = data

                // Get session and check permissions if this is a user operation
                if (model.modelName === 'users') {
                    const session = await getServerSession(authOptions);
                    if (!session?.user?._id) {
                        return NextResponse.json({
                            status: 401,
                            message: "Unauthorized"
                        }, { status: 401 });
                    }

                    try {
                        // Check for password update specifically
                        if (updateData.password) {
                            await checkUserPermissions(session.user._id, 'update_password');
                        } else {
                            await checkUserPermissions(session.user._id, 'update');
                        }
                    } catch (error) {
                        return NextResponse.json({
                            status: 403,
                            message: error instanceof Error ? error.message : "Unauthorized"
                        }, { status: 403 });
                    }
                }

                if (!_id) {
                    return NextResponse.json({
                        status: 400,
                        message: "ID is required for update"
                    }, { status: 400 })
                }
                // Hash the password before saving

                if (updateData.password) {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(updateData.password, salt);
                    updateData.password = hashedPassword
                }

                try {
                    const updatedItem = await model.findByIdAndUpdate(
                        _id,
                        {
                            ...updateData,
                            updatedAt: new Date()
                        },
                        { new: true, runValidators: true }
                    )

                    if (!updatedItem) {
                        return NextResponse.json({
                            status: 200,
                            message: "Item not found"
                        }, { status: 200 })
                    }

                    return NextResponse.json({
                        status: 200,
                        message: "Item updated successfully",
                        data: updatedItem
                    })
                } catch (error) {
                    if (error instanceof Error && error.name === 'ValidationError') {
                        return NextResponse.json({
                            status: 400,
                            message: "Validation failed",
                            errors: error.message
                        }, { status: 400 })
                    }
                    throw error
                }
            } catch (error) {
                console.error('Update error:', error)
                return NextResponse.json({
                    status: 500,
                    message: error instanceof Error ? error.message : "Failed to update item"
                }, { status: 500 })
            }
        },

        // POST handler for deleting items
        async delete(request: Request) {
            if (!permissions.includes('delete')) {
                return NextResponse.json({
                    status: 403,
                    message: "You are not authorized to access this resource"
                }, { status: 403 })
            }
            try {
                const { _id } = await request.json()

                // Get session and check permissions if this is a user operation
                if (model.modelName === 'users') {
                    const session = await getServerSession(authOptions);
                    if (!session?.user?._id) {
                        return NextResponse.json({
                            status: 401,
                            message: "Unauthorized"
                        }, { status: 401 });
                    }

                    try {
                        await checkUserPermissions(session.user._id, 'delete');
                    } catch (error) {
                        return NextResponse.json({
                            status: 403,
                            message: error instanceof Error ? error.message : "Unauthorized"
                        }, { status: 403 });
                    }
                }

                if (!_id) {
                    return NextResponse.json({
                        status: 400,
                        message: "ID is required for deletion"
                    }, { status: 400 })
                }

                try {
                    const deletedItem = await model.findByIdAndDelete(_id)

                    if (!deletedItem) {
                        return NextResponse.json({
                            status: 200,
                            message: "Item not found"
                        }, { status: 200 })
                    }

                    const client = new ftp.Client();
                    client.ftp.verbose = true; // Enable logs for debugging
                    // Connect to BunnyCDN FTP
                    await client.access({
                        host: "storage.bunnycdn.com",
                        user: "ibr-resumes",
                        password: "85f77125-3524-498e-9a9655a805b7-690d-4600",
                        port: 21,
                        secure: false,
                    });

                    // Upload file using stream
                    const uploadPath = `/resumes/${_id.toString()}`;
                    await client.remove(uploadPath);
                    return NextResponse.json({
                        status: 200,
                        message: "Item deleted successfully"
                    })
                } catch (error) {
                    if (error instanceof Error && error.name === 'CastError') {
                        return NextResponse.json({
                            status: 400,
                            message: "Invalid ID format"
                        }, { status: 400 })
                    }
                    throw error
                }
            } catch (error) {
                console.error('Delete error:', error)
                return NextResponse.json({
                    status: 500,
                    message: error instanceof Error ? error.message : "Failed to delete item"
                }, { status: 500 })
            }
        },

        // POST handler for importing data
        async import(request: Request) {
            if (!permissions.includes('bulk-operation')) {
                return NextResponse.json({
                    status: 403,
                    message: "You are not authorized to access this resource"
                }, { status: 403 })
            }
            try {
                const formData = await request.formData()
                const file = formData.get('file') as File

                if (!file) {
                    return NextResponse.json({
                        status: 400,
                        message: "No file provided"
                    }, { status: 400 })
                }

                if (!file.name.endsWith('.csv')) {
                    return NextResponse.json({
                        status: 400,
                        message: "Only CSV files are supported"
                    }, { status: 400 })
                }

                const text = await file.text()
                let records: any[]

                try {
                    records = await new Promise((resolve, reject) => {
                        parse(text, {
                            columns: true,
                            skip_empty_lines: true,
                            trim: true,
                            cast: true
                        }, (err, records) => {
                            if (err) reject(err)
                            else resolve(records)
                        })
                    })
                } catch (error) {
                    return NextResponse.json({
                        status: 400,
                        message: "Invalid CSV format"
                    }, { status: 400 })
                }

                // Transform the flat records into nested objects
                const transformedRecords = records.map(record => {
                    const transformedRecord: Record<string, any> = {}

                    Object.entries(record).forEach(([key, value]) => {
                        if (key.includes('.')) {
                            setNestedValue(transformedRecord, key, value)
                        } else {
                            transformedRecord[key] = value
                        }
                    })

                    return transformedRecord
                })

                // Validate required fields after transformation
                const missingFields = importFields.filter(field => {
                    const keys = field.split('.')
                    let current = transformedRecords[0]

                    for (const key of keys) {
                        if (!current || !Object.keys(current).includes(key)) {
                            return true
                        }
                        current = current[key]
                    }
                    return false
                })

                if (missingFields.length > 0) {
                    return NextResponse.json({
                        status: 400,
                        message: `Missing required fields: ${missingFields.join(', ')}`
                    }, { status: 400 })
                }

                // Hash the password before saving

                const items = transformedRecords.map(async (record) => {
                    if (record.password) {
                        const salt = await bcrypt.genSalt(10);
                        const hashedPassword = await bcrypt.hash(record.password, salt);
                        record.password = hashedPassword;
                    }
                    return {
                        ...record,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }
                })

                try {
                    await model.insertMany(items)
                } catch (error) {
                    return NextResponse.json({
                        status: 500,
                        message: "Failed to save imported data"
                    }, { status: 500 })
                }

                return NextResponse.json({
                    status: 200,
                    message: `Successfully imported ${items.length} records`,
                    data: {
                        items,
                        pagination: {
                            totalItems: items.length,
                            totalPages: 1,
                            currentPage: 1,
                            pageSize: items.length
                        }
                    }
                })
            } catch (error) {
                console.error('Import error:', error)
                return NextResponse.json({
                    status: 500,
                    message: error instanceof Error ? error.message : "Failed to import data"
                }, { status: 500 })
            }
        },

        // GET handler for exporting data
        async export(request: NextRequest) {
            if (!permissions.includes('bulk-operation')) {
                return NextResponse.json({
                    status: 403,
                    message: "You are not authorized to access this resource"
                }, { status: 403 })
            }
            try {
                const searchParams = request.nextUrl.searchParams
                const format = searchParams.get('format')

                if (!format) {
                    return NextResponse.json({
                        status: 400,
                        message: "Export format is required"
                    }, { status: 400 })
                }

                if (!['csv', 'excel', 'pdf'].includes(format)) {
                    return NextResponse.json({
                        status: 400,
                        message: "Unsupported export format"
                    }, { status: 400 })
                }


                const items = await model.find({})

                if (items.length === 0) {
                    return NextResponse.json({
                        status: 200,
                        message: "No data found to export"
                    }, { status: 200 })
                }

                // Format data for export
                const data = items.map(item => {
                    const exportData: Record<string, any> = {}
                    exportFields.forEach(field => {
                        exportData[field] = item[field]
                    })
                    return exportData
                })


                let response: Response

                switch (format) {
                    case 'csv':
                        try {
                            const parser = new Parser({ fields: exportFields })
                            const csv = parser.parse(data)
                            response = new Response(csv, {
                                headers: {
                                    'Content-Type': 'text/csv',
                                    'Content-Disposition': `attachment; filename=${model.modelName.toLowerCase()}.csv`
                                }
                            })
                        } catch (error) {
                            return NextResponse.json({
                                status: 500,
                                message: "Failed to generate CSV file"
                            }, { status: 500 })
                        }
                        break

                    case 'excel':
                        try {
                            const worksheet = XLSX.utils.json_to_sheet(data)
                            const workbook = XLSX.utils.book_new()
                            XLSX.utils.book_append_sheet(workbook, worksheet, model.modelName)
                            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
                            response = new Response(excelBuffer, {
                                headers: {
                                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                    'Content-Disposition': `attachment; filename=${model.modelName.toLowerCase()}.xlsx`
                                }
                            })
                        } catch (error) {
                            return NextResponse.json({
                                status: 500,
                                message: "Failed to generate Excel file"
                            }, { status: 500 })
                        }
                        break

                    case 'pdf':
                        try {
                            const doc = new jsPDF()

                            // Add title
                            doc.setFontSize(16)
                            doc.text(`${model.modelName} Report`, doc.internal.pageSize.width / 2, 20, { align: 'center' })

                            // Add timestamp
                            doc.setFontSize(10)
                            doc.text(`Generated on: ${new Date().toLocaleString()}`, doc.internal.pageSize.width - 15, 30, { align: 'right' })

                            // Prepare table data
                            const tableHeaders = exportFields.map(field => ({
                                header: field,
                                dataKey: field
                            }))

                            const tableRows = data.map(item => {
                                const row: Record<string, any> = {}
                                exportFields.forEach(field => {
                                    const value = item[field]
                                    if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
                                        row[field] = formatObjectForExport(value)
                                    } else if (value instanceof Date) {
                                        row[field] = value.toLocaleString()
                                    } else {
                                        row[field] = value || '-'
                                    }
                                })
                                return row
                            })

                            // Generate table
                            doc.autoTable({
                                startY: 40,
                                head: [exportFields],
                                body: tableRows.map(row => exportFields.map(field => row[field])),
                                headStyles: {
                                    fillColor: [51, 51, 51],
                                    textColor: 255,
                                    fontSize: 10,
                                    halign: 'center'
                                },
                                bodyStyles: {
                                    fontSize: 9,
                                    halign: 'left'
                                },
                                columnStyles: {
                                    // Add specific column styles if needed
                                },
                                margin: { top: 40 },
                                theme: 'grid'
                            })

                            // Convert PDF to buffer
                            const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

                            response = new Response(pdfBuffer, {
                                headers: {
                                    'Content-Type': 'application/pdf',
                                    'Content-Disposition': `attachment; filename=${model.modelName.toLowerCase()}.pdf`
                                }
                            })
                        } catch (error) {
                            console.error('PDF export error:', error)
                            return NextResponse.json({
                                status: 500,
                                message: "Failed to generate PDF file"
                            }, { status: 500 })
                        }
                        break

                    default:
                        return NextResponse.json({
                            status: 400,
                            message: "Unsupported format"
                        }, { status: 400 })
                }

                return response
            } catch (error) {
                console.error('Export error:', error)
                return NextResponse.json({
                    status: 500,
                    message: error instanceof Error ? error.message : "Failed to export data"
                }, { status: 500 })
            }
        },

        async bulkUpdate(request: Request) {
            try {
                const { ids, updates } = await request.json()

                // Get session and check permissions if this is a user operation
                if (model.modelName === 'users') {
                    const session = await getServerSession(authOptions);
                    if (!session?.user?._id) {
                        return NextResponse.json({
                            status: 401,
                            message: "Unauthorized"
                        }, { status: 401 });
                    }

                    try {
                        // Check for password update specifically
                        if (updates.password) {
                            await checkUserPermissions(session.user._id, 'update_password');
                        } else {
                            await checkUserPermissions(session.user._id, 'update');
                        }
                    } catch (error) {
                        return NextResponse.json({
                            status: 403,
                            message: error instanceof Error ? error.message : "Unauthorized"
                        }, { status: 403 });
                    }
                }

                if (updates.password) {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(updates.password, salt);
                    updates.password = hashedPassword;
                }

                await model.updateMany(
                    { _id: { $in: ids } },
                    { $set: updates }
                )

                return NextResponse.json({
                    status: 200,
                    message: "Items updated successfully"
                })
            } catch (error) {
                console.error('Bulk update error:', error)
                return NextResponse.json({
                    status: 500,
                    message: error instanceof Error ? error.message : "Failed to update items"
                }, { status: 500 })
            }
        },

        async bulkDelete(request: Request) {
            try {
                const { ids } = await request.json()

                // Get session and check permissions if this is a user operation
                if (model.modelName === 'users') {
                    const session = await getServerSession(authOptions);
                    if (!session?.user?._id) {
                        return NextResponse.json({
                            status: 401,
                            message: "Unauthorized"
                        }, { status: 401 });
                    }

                    try {
                        await checkUserPermissions(session.user._id, 'delete');
                    } catch (error) {
                        return NextResponse.json({
                            status: 403,
                            message: error instanceof Error ? error.message : "Unauthorized"
                        }, { status: 403 });
                    }
                }

                const client = new ftp.Client();
                client.ftp.verbose = true; // Enable logs for debugging
                // Connect to BunnyCDN FTP
                await client.access({
                    host: "storage.bunnycdn.com",
                    user: "ibr-resumes",
                    password: "85f77125-3524-498e-9a9655a805b7-690d-4600",
                    port: 21,
                    secure: false,
                });

                await Promise.all(ids.map(async (id: string) => {
                    // Upload file using stream
                    const uploadPath = `/resumes/${id}`;
                    await client.remove(uploadPath);
                }));

                const result = await model.deleteMany({ _id: { $in: ids } })

                return NextResponse.json({
                    status: 200,
                    message: `Successfully deleted ${result.deletedCount} items`
                })
            } catch (error) {
                console.error('Bulk delete error:', error)
                return NextResponse.json({
                    status: 500,
                    message: error instanceof Error ? error.message : "Failed to delete items"
                }, { status: 500 })
            }
        }
    }
}
