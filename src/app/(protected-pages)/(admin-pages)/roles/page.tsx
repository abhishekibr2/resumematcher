"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, MoreHorizontal, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: ModulePermission[];
  adminPermissions: {
    can_access_admin_panel: boolean;
    can_change_gemini_api_key: boolean;
    can_change_gemini_prompts: boolean;
    can_change_company_settings: boolean;
    can_change_gemini_model: boolean;
    can_access_roles: boolean;
    can_edit_roles: boolean;
  };
  userPermissions: {
    can_delete_users: boolean;
    can_update_user_password: boolean;
    can_update_users: boolean;
    can_change_gemini_model: boolean;
  };
}

interface Module {
  _id: string;
  title: string;
  description: string;
}

interface ModulePermission {
  module_id: string;
  module_name: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export default function RolesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<Role>({
    id: '',
    name: "",
    description: "",
    permissions: [],
    adminPermissions: {
      can_access_admin_panel: false,
      can_change_gemini_api_key: false,
      can_change_gemini_prompts: false,
      can_change_company_settings: false,
      can_change_gemini_model: false,
      can_access_roles: false,
      can_edit_roles: false
    },
    userPermissions: {
      can_delete_users: false,
      can_update_user_password: false,
      can_update_users: false,
      can_change_gemini_model: false
    }
  });
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [canEditRoles, setCanEditRoles] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (!session?.user?.role) {
          router.push("/all-resumes");
          return;
        }

        const response = await fetch(`/api/check-admin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: session.user._id,
            role: session.user.role,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to check permissions');
        }

        const data = await response.json();

        if (!data.ok || !data.userRole?.adminPermissions?.can_access_roles) {
          toast({
            description: "You don't have permission to access this page",
            variant: "destructive",
          });
          router.push("/all-resumes");
          return;
        }

        setCanEditRoles(data.userRole?.adminPermissions?.can_edit_roles || false);
        setIsAuthorized(true);
      } catch (error) {
        console.error("Error checking permissions:", error);
        toast({
          description: "Failed to verify permissions",
          variant: "destructive",
        });
        router.push("/all-resumes");
      }
    };

    if (status === "authenticated") {
      checkPermission();
    } else if (status === "unauthenticated") {
      router.push("/log-in");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rolesResponse, modulesResponse] = await Promise.all([
          fetch('/api/roles'),
          fetch('/api/modules')
        ]);

        const rolesData = await rolesResponse.json();
        const modulesData = await modulesResponse.json();
        if (rolesResponse.ok) {
          const formattedRoles = rolesData.roles.map((role: any) => ({
            id: role._id,
            name: role.name,
            description: role.description,
            permissions: role.permissions,
            adminPermissions: role.adminPermissions,
            userPermissions: role.userPermissions
          }));
          setRoles(formattedRoles);
        }
        if (modulesResponse.ok) {
          setModules(modulesData.modules);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handlePermissionChange = (
    moduleId: string,
    moduleName: string,
    permission: keyof Omit<ModulePermission, 'module_id' | 'module_name'>,
    value: boolean,
    isNewRole: boolean = false
  ) => {
    const updatePermissions = (currentPermissions: ModulePermission[]) => {
      const existingPermissionIndex = currentPermissions.findIndex(
        p => p.module_id === moduleId
      );

      if (existingPermissionIndex > -1) {
        return currentPermissions.map((p, index) =>
          index === existingPermissionIndex
            ? { ...p, [permission]: value }
            : p
        );
      } else {
        return [
          ...currentPermissions,
          {
            module_id: moduleId,
            module_name: moduleName,
            create: permission === 'create' ? value : false,
            read: permission === 'read' ? value : false,
            update: permission === 'update' ? value : false,
            delete: permission === 'delete' ? value : false,
          },
        ];
      }
    };

    if (isNewRole) {
      setNewRole(prev => ({
        ...prev,
        permissions: updatePermissions(prev.permissions),
      }));
    } else {
      setEditingRole(prev =>
        prev ? {
          ...prev,
          permissions: updatePermissions(prev.permissions),
        } : null
      );
    }
  };

  const handleAddRole = async () => {
    if (!newRole.name || !newRole.description) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsAddingRole(true);
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRole),
      });

      const data = await response.json();

      if (response.ok) {
        const role: Role = {
          id: data.role._id,
          name: data.role.name,
          description: data.role.description,
          permissions: data.role.permissions,
          adminPermissions: data.role.adminPermissions,
          userPermissions: data.role.userPermissions
        };

        setRoles([...roles, role]);
        setNewRole({ id: '', name: "", description: "", permissions: [], adminPermissions: { can_access_admin_panel: false, can_change_gemini_api_key: false, can_change_gemini_prompts: false, can_change_company_settings: false, can_change_gemini_model: false, can_access_roles: false, can_edit_roles: false }, userPermissions: { can_delete_users: false, can_update_user_password: false, can_update_users: false, can_change_gemini_model: false } });
        setIsAddDialogOpen(false);
        toast({
          title: "Success",
          description: data.message,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create role",
        variant: "destructive",
      });
    } finally {
      setIsAddingRole(false);
    }
  };

  const handleEditClick = (role: Role) => {
    setEditingRole({
      ...role,
      adminPermissions: role.adminPermissions || {
        can_access_admin_panel: false,
        can_change_gemini_api_key: false,
        can_change_gemini_prompts: false,
        can_change_company_settings: false,
        can_change_gemini_model: false,
        can_access_roles: false,
        can_edit_roles: false
      },
      userPermissions: role.userPermissions || {
        can_delete_users: false,
        can_update_user_password: false,
        can_update_users: false,
        can_change_gemini_model: false
      }
    });
    setIsEditDialogOpen(true);
  };

  const handleEditRole = async () => {
    if (!editingRole) return;

    setIsUpdatingRole(true);
    try {
      const response = await fetch(`/api/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingRole.id,
          name: editingRole.name,
          description: editingRole.description,
          permissions: editingRole.permissions,
          adminPermissions: editingRole.adminPermissions || {
            can_access_admin_panel: false,
            can_change_gemini_api_key: false,
            can_change_gemini_prompts: false,
            can_change_company_settings: false,
            can_change_gemini_model: false,
            can_access_roles: false,
            can_edit_roles: false
          },
          userPermissions: editingRole.userPermissions || {
            can_delete_users: false,
            can_update_user_password: false,
            can_update_users: false,
            can_change_gemini_model: false
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRoles(roles.map(role =>
          role.id === editingRole.id
            ? {
              ...editingRole,
              adminPermissions: editingRole.adminPermissions || {
                can_access_admin_panel: false,
                can_change_gemini_api_key: false,
                can_change_gemini_prompts: false,
                can_change_company_settings: false,
                can_change_gemini_model: false,
                can_access_roles: false,
                can_edit_roles: false
              },
              userPermissions: editingRole.userPermissions || {
                can_delete_users: false,
                can_update_user_password: false,
                can_update_users: false,
                can_change_gemini_model: false
              }
            }
            : role
        ));
        setEditingRole(null);
        setIsEditDialogOpen(false);
        toast({
          title: "Success",
          description: data.message,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deletingRoleId) return;

    try {
      const response = await fetch('/api/roles', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: deletingRoleId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRoles(roles.filter((role) => role.id !== deletingRoleId));
        toast({
          title: "Success",
          description: data.message,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete role",
        variant: "destructive",
      });
    } finally {
      setDeletingRoleId(null);
      setIsDeleteDialogOpen(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles Management</h2>
          <p className="text-muted-foreground">
            Create and manage roles and their permissions
          </p>
        </div>
        {canEditRoles && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8">
                <Plus className="mr-2 h-4 w-4" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Role</DialogTitle>
                <DialogDescription>
                  Create a new role with specific permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" >* Role Name</Label>
                  <Input
                    id="name"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    placeholder="Enter role name"
                    className="h-8"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    placeholder="Enter role description"
                    className="h-8"
                  />
                </div>
                <div className="grid gap-4">
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Features</TableHead>
                          <TableHead>Capabilities</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Administrative Permissions</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="admin-panel"
                                  checked={newRole.adminPermissions.can_access_admin_panel}
                                  onCheckedChange={(checked) =>
                                    setNewRole({
                                      ...newRole,
                                      adminPermissions: {
                                        ...newRole.adminPermissions,
                                        can_access_admin_panel: checked as boolean
                                      }
                                    })
                                  }
                                />
                                <label
                                  htmlFor="admin-panel"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Can Access Admin Panel
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="settings"
                                  checked={newRole.adminPermissions.can_change_gemini_api_key}
                                  onCheckedChange={(checked) =>
                                    setNewRole({
                                      ...newRole,
                                      adminPermissions: {
                                        ...newRole.adminPermissions,
                                        can_change_gemini_api_key: checked as boolean
                                      }
                                    })
                                  }
                                />
                                <label
                                  htmlFor="settings"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Can change Gemini API Keys
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="model"
                                  checked={newRole.adminPermissions.can_change_gemini_model}
                                  onCheckedChange={(checked) =>
                                    setNewRole({
                                      ...newRole,
                                      adminPermissions: {
                                        ...newRole.adminPermissions,
                                        can_change_gemini_model: checked as boolean
                                      }
                                    })
                                  }
                                />
                                <label
                                  htmlFor="model"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Can Change Gemini Model
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="company"
                                  checked={newRole.adminPermissions.can_change_company_settings}
                                  onCheckedChange={(checked) =>
                                    setNewRole({
                                      ...newRole,
                                      adminPermissions: {
                                        ...newRole.adminPermissions,
                                        can_change_company_settings: checked as boolean
                                      }
                                    })
                                  }
                                />
                                <label
                                  htmlFor="company"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Can change Company Settings
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="roles-access"
                                  checked={newRole.adminPermissions.can_access_roles}
                                  onCheckedChange={(checked) =>
                                    setNewRole({
                                      ...newRole,
                                      adminPermissions: {
                                        ...newRole.adminPermissions,
                                        can_access_roles: checked as boolean
                                      }
                                    })
                                  }
                                />
                                <label
                                  htmlFor="roles-access"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Can Access Roles
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="roles-edit"
                                  checked={newRole.adminPermissions.can_edit_roles}
                                  onCheckedChange={(checked) =>
                                    setNewRole({
                                      ...newRole,
                                      adminPermissions: {
                                        ...newRole.adminPermissions,
                                        can_edit_roles: checked as boolean
                                      }
                                    })
                                  }
                                />
                                <label
                                  htmlFor="roles-edit"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Can Edit Roles
                                </label>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">User Management</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="delete-users"
                                  checked={newRole.userPermissions.can_delete_users}
                                  onCheckedChange={(checked) =>
                                    setNewRole({
                                      ...newRole,
                                      userPermissions: {
                                        ...newRole.userPermissions,
                                        can_delete_users: checked as boolean
                                      }
                                    })
                                  }
                                />
                                <label
                                  htmlFor="delete-users"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Can Delete Users
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="update-password"
                                  checked={newRole.userPermissions.can_update_user_password}
                                  onCheckedChange={(checked) =>
                                    setNewRole({
                                      ...newRole,
                                      userPermissions: {
                                        ...newRole.userPermissions,
                                        can_update_user_password: checked as boolean
                                      }
                                    })
                                  }
                                />
                                <label
                                  htmlFor="update-password"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Can Update User Passwords
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="update-users"
                                  checked={newRole.userPermissions.can_update_users}
                                  onCheckedChange={(checked) =>
                                    setNewRole({
                                      ...newRole,
                                      userPermissions: {
                                        ...newRole.userPermissions,
                                        can_update_users: checked as boolean
                                      }
                                    })
                                  }
                                />
                                <label
                                  htmlFor="update-users"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Can Update Users
                                </label>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                        {modules && modules.map((module) => {
                          const modulePermission = newRole.permissions.find(
                            p => p.module_id === module._id
                          ) || {
                            module_id: module._id,
                            module_name: module.title,
                            create: false,
                            read: false,
                            update: false,
                            delete: false,
                          };

                          return (
                            <TableRow key={module._id}>
                              <TableCell className="font-medium">
                                {module.title}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${module._id}-read-own`}
                                      checked={modulePermission.read}
                                      onCheckedChange={(checked) =>
                                        handlePermissionChange(
                                          module._id,
                                          module.title,
                                          'read',
                                          checked as boolean,
                                          true
                                        )
                                      }
                                    />
                                    <Label htmlFor={`${module._id}-read-own`}>
                                      View (Own)
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${module._id}-read-global`}
                                      checked={modulePermission.read}
                                      onCheckedChange={(checked) =>
                                        handlePermissionChange(
                                          module._id,
                                          module.title,
                                          'read',
                                          checked as boolean,
                                          true
                                        )
                                      }
                                    />
                                    <Label htmlFor={`${module._id}-read-global`}>
                                      View (Global)
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${module._id}-create`}
                                      checked={modulePermission.create}
                                      onCheckedChange={(checked) =>
                                        handlePermissionChange(
                                          module._id,
                                          module.title,
                                          'create',
                                          checked as boolean,
                                          true
                                        )
                                      }
                                    />
                                    <Label htmlFor={`${module._id}-create`}>
                                      Create
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${module._id}-update`}
                                      checked={modulePermission.update}
                                      onCheckedChange={(checked) =>
                                        handlePermissionChange(
                                          module._id,
                                          module.title,
                                          'update',
                                          checked as boolean,
                                          true
                                        )
                                      }
                                    />
                                    <Label htmlFor={`${module._id}-update`}>
                                      Edit
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${module._id}-delete`}
                                      checked={modulePermission.delete}
                                      onCheckedChange={(checked) =>
                                        handlePermissionChange(
                                          module._id,
                                          module.title,
                                          'delete',
                                          checked as boolean,
                                          true
                                        )
                                      }
                                    />
                                    <Label htmlFor={`${module._id}-delete`}>
                                      Delete
                                    </Label>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRole} disabled={isAddingRole}>
                  {isAddingRole ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Role'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Update the role details and permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Role Name</Label>
                <Input
                  id="edit-name"
                  value={editingRole?.name || ""}
                  onChange={(e) => setEditingRole(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Enter role name"
                  className="h-8"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editingRole?.description || ""}
                  onChange={(e) => setEditingRole(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Enter role description"
                  className="h-8"
                />
              </div>
              <div className="grid gap-4">
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Features</TableHead>
                        <TableHead>Capabilities</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Administrative Permissions</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="edit-admin-panel"
                                checked={editingRole?.adminPermissions.can_access_admin_panel || false}
                                onCheckedChange={(checked) =>
                                  setEditingRole(prev =>
                                    prev ? {
                                      ...prev,
                                      adminPermissions: {
                                        ...prev.adminPermissions,
                                        can_access_admin_panel: checked as boolean
                                      }
                                    } : null
                                  )
                                }
                              />
                              <label
                                htmlFor="edit-admin-panel"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Can Access Admin Panel
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="edit-settings"
                                checked={editingRole?.adminPermissions.can_change_gemini_api_key || false}
                                onCheckedChange={(checked) =>
                                  setEditingRole(prev =>
                                    prev ? {
                                      ...prev,
                                      adminPermissions: {
                                        ...prev.adminPermissions,
                                        can_change_gemini_api_key: checked as boolean
                                      }
                                    } : null
                                  )
                                }
                              />
                              <label
                                htmlFor="edit-settings"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Can change Gemini API Keys
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="edit-prompts"
                                checked={editingRole?.adminPermissions.can_change_gemini_prompts || false}
                                onCheckedChange={(checked) =>
                                  setEditingRole(prev =>
                                    prev ? {
                                      ...prev,
                                      adminPermissions: {
                                        ...prev.adminPermissions,
                                        can_change_gemini_prompts: checked as boolean
                                      }
                                    } : null
                                  )
                                }
                              />
                              <label
                                htmlFor="edit-prompts"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Can Change Gemini Prompts
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="edit-company"
                                checked={editingRole?.adminPermissions.can_change_company_settings || false}
                                onCheckedChange={(checked) =>
                                  setEditingRole(prev =>
                                    prev ? {
                                      ...prev,
                                      adminPermissions: {
                                        ...prev.adminPermissions,
                                        can_change_company_settings: checked as boolean
                                      }
                                    } : null
                                  )
                                }
                              />
                              <label
                                htmlFor="edit-company"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Can change Company Settings
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="edit-model"
                                checked={editingRole?.adminPermissions.can_change_gemini_model || false}
                                onCheckedChange={(checked) =>
                                  setEditingRole(prev =>
                                    prev ? {
                                      ...prev,
                                      adminPermissions: {
                                        ...prev.adminPermissions,
                                        can_change_gemini_model: checked as boolean
                                      }
                                    } : null
                                  )
                                }
                              />
                              <label
                                htmlFor="edit-model"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Can Change Gemini Model
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="edit-roles-access"
                                checked={editingRole?.adminPermissions.can_access_roles || false}
                                onCheckedChange={(checked) =>
                                  setEditingRole(prev =>
                                    prev ? {
                                      ...prev,
                                      adminPermissions: {
                                        ...prev.adminPermissions,
                                        can_access_roles: checked as boolean
                                      }
                                    } : null
                                  )
                                }
                              />
                              <label
                                htmlFor="edit-roles-access"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Can Access Roles
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="edit-roles-edit"
                                checked={editingRole?.adminPermissions.can_edit_roles || false}
                                onCheckedChange={(checked) =>
                                  setEditingRole(prev =>
                                    prev ? {
                                      ...prev,
                                      adminPermissions: {
                                        ...prev.adminPermissions,
                                        can_edit_roles: checked as boolean
                                      }
                                    } : null
                                  )
                                }
                              />
                              <label
                                htmlFor="edit-roles-edit"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Can Edit Roles
                              </label>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">User Management</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="edit-delete-users"
                                checked={editingRole?.userPermissions.can_delete_users || false}
                                onCheckedChange={(checked) =>
                                  setEditingRole(prev =>
                                    prev ? {
                                      ...prev,
                                      userPermissions: {
                                        ...prev.userPermissions,
                                        can_delete_users: checked as boolean
                                      }
                                    } : null
                                  )
                                }
                              />
                              <label
                                htmlFor="edit-delete-users"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Can Delete Users
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="edit-update-password"
                                checked={editingRole?.userPermissions.can_update_user_password || false}
                                onCheckedChange={(checked) =>
                                  setEditingRole(prev =>
                                    prev ? {
                                      ...prev,
                                      userPermissions: {
                                        ...prev.userPermissions,
                                        can_update_user_password: checked as boolean
                                      }
                                    } : null
                                  )
                                }
                              />
                              <label
                                htmlFor="edit-update-password"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Can Update User Passwords
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="edit-update-users"
                                checked={editingRole?.userPermissions.can_update_users || false}
                                onCheckedChange={(checked) =>
                                  setEditingRole(prev =>
                                    prev ? {
                                      ...prev,
                                      userPermissions: {
                                        ...prev.userPermissions,
                                        can_update_users: checked as boolean
                                      }
                                    } : null
                                  )
                                }
                              />
                              <label
                                htmlFor="edit-update-users"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Can Update Users
                              </label>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                      {modules.map((module) => {
                        const modulePermission = editingRole?.permissions.find(
                          p => p.module_id === module._id
                        ) || {
                          module_id: module._id,
                          module_name: module.title,
                          create: false,
                          read: false,
                          update: false,
                          delete: false,
                        };

                        return (
                          <TableRow key={module._id}>
                            <TableCell className="font-medium">
                              {module.title}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`edit-${module._id}-read-own`}
                                    checked={modulePermission.read}
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(
                                        module._id,
                                        module.title,
                                        'read',
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <Label htmlFor={`edit-${module._id}-read-own`}>
                                    View (Own)
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`edit-${module._id}-read-global`}
                                    checked={modulePermission.read}
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(
                                        module._id,
                                        module.title,
                                        'read',
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <Label htmlFor={`edit-${module._id}-read-global`}>
                                    View (Global)
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`edit-${module._id}-create`}
                                    checked={modulePermission.create}
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(
                                        module._id,
                                        module.title,
                                        'create',
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <Label htmlFor={`edit-${module._id}-create`}>
                                    Create
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`edit-${module._id}-update`}
                                    checked={modulePermission.update}
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(
                                        module._id,
                                        module.title,
                                        'update',
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <Label htmlFor={`edit-${module._id}-update`}>
                                    Edit
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`edit-${module._id}-delete`}
                                    checked={modulePermission.delete}
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(
                                        module._id,
                                        module.title,
                                        'delete',
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <Label htmlFor={`edit-${module._id}-delete`}>
                                    Delete
                                  </Label>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditRole} disabled={isUpdatingRole}>
                {isUpdatingRole ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Role'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the role
                and remove it from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingRoleId(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
                <CardFooter>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : roles.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No roles found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first role.
              </p>
              {canEditRoles && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Role
                </Button>
              )}
            </div>
          ) : (
            roles.map((role) => (
              <Card key={role.id} className="shadow-sm transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{role.name}</span>
                    {canEditRoles && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleEditClick(role)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setDeletingRoleId(role.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                  <ScrollArea className="h-[150px] w-full rounded-md border mt-4 p-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex flex-col gap-2">
                          {role.adminPermissions.can_access_admin_panel && (
                            <Badge variant="secondary">Access Admin Panel</Badge>
                          )}
                          {role.adminPermissions.can_change_gemini_api_key && (
                            <Badge variant="secondary">Change Gemini API Keys</Badge>
                          )}
                          {role.adminPermissions.can_change_gemini_prompts && (
                            <Badge variant="secondary">Change Gemini Prompts</Badge>
                          )}
                          {role.adminPermissions.can_change_company_settings && (
                            <Badge variant="secondary">Change Company Settings</Badge>
                          )}
                          {role.adminPermissions.can_change_gemini_model && (
                            <Badge variant="secondary">Change Gemini Model</Badge>
                          )}
                          {role.adminPermissions.can_access_roles && (
                            <Badge variant="secondary">Access Roles</Badge>
                          )}
                          {role.adminPermissions.can_edit_roles && (
                            <Badge variant="secondary">Edit Roles</Badge>
                          )}
                        </div>
                        {role.userPermissions.can_delete_users && (
                          <Badge variant="secondary">Delete Users</Badge>
                        )}
                        {role.userPermissions.can_update_user_password && (
                          <Badge variant="secondary">Update User Passwords</Badge>
                        )}
                        {role.userPermissions.can_update_users && (
                          <Badge variant="secondary">Update Users</Badge>
                        )}
                        {role.permissions.map((permission, index) => (
                          <div key={index} className="flex flex-col gap-1">
                            <h4 className="font-medium">{permission.module_name}</h4>
                            <div className="flex flex-wrap gap-2">
                              {(['read', 'create', 'update', 'delete'] as const).map((perm) => (
                                permission[perm] && (
                                  <Badge
                                    key={perm}
                                    variant="secondary"
                                    className="rounded-full"
                                  >
                                    {perm.charAt(0).toUpperCase() + perm.slice(1)}
                                  </Badge>
                                )
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}