"use client";

import { TableComponent } from "@/components/ReusableComponents/Table/Table";
import { userTableConfig, UserData } from "@/config/Table/users";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { TableConfig } from "@/types/table.types";

interface Role {
    _id: string;
    name: string;
    description: string;
    permissions: any[];
    adminPermissions: any;
    userPermissions: any;
}

export default function Dashboard() {
    const [config, setConfig] = useState(userTableConfig);
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await fetch('/api/roles');
                const data = await response.json();

                if (response.ok && data.roles) {
                    // Update the roles options in the config
                    const updatedConfig: TableConfig<UserData> = {
                        ...userTableConfig,
                        columns: config.columns.map(column => {
                            if (column.id === 'roleName') {
                                return {
                                    ...column,
                                    options: data.roles.map((role: Role) => ({
                                        label: role.name,
                                        value: role._id
                                    }))
                                };
                            }
                            return column;
                        }),
                        bulkEdit: {
                            enabled: true,
                            allowDelete: true,
                            fields: config.bulkEdit?.fields?.map(field => {
                                if (field.name === 'roleName') {
                                    return {
                                        ...field,
                                        options: data.roles.map((role: Role) => ({
                                            label: role.name,
                                            value: role._id
                                        }))
                                    };
                                }
                                return field;
                            }) || []
                        }
                    };
                    setConfig(updatedConfig);
                } else {
                    throw new Error(data.message || 'Failed to fetch roles');
                }
            } catch (error) {
                toast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "Failed to fetch roles",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchRoles();
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading roles...</div>
        </div>;
    }

    return <div><TableComponent config={config} /></div>;
}