"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { TableConfig } from "@/types/table.types"
import { useSession } from "next-auth/react"

interface TableAddProps {
    config: TableConfig
    onSuccess?: (statusData: any) => void
}

export function TableAddStatusData({ config, onSuccess }: TableAddProps) {
    const [isOpen, setIsOpen] = useState(false)
    const { data: session } = useSession()
    const [statusName, setStatusName] = useState("")
    const [color, setColor] = useState("#000000")
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch(`/api/${config.endpoints.create}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: statusName,
                    color: color,
                    createdBy: session?.user?.name || ""
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to add status")
            }

            const data = await response.json()

            const statusResponse = await fetch('/api/status')
            const statusData = await statusResponse.json()

            setIsOpen(false)
            setStatusName("")
            setColor("#000000")
            toast({
                title: "Success",
                description: "Status has been added successfully.",
                variant: "default",
            })

            if (onSuccess) {
                onSuccess(statusData)
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add status",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Status
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Add New Status</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status Name</Label>
                            <Input
                                id="status"
                                value={statusName}
                                onChange={(e) => setStatusName(e.target.value)}
                                placeholder="Enter status name"
                                required
                            />
                        </div>
                        <div className="space-y-2 w-full flex items-center justify-center gap-4">
                            <Label htmlFor="color">Status Color</Label>
                            <div className="flex gap-4 items-center">
                                <Input
                                    id="color"
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-[80px] h-[40px] cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent mr-2" />
                                    Adding...
                                </>
                            ) : (
                                "Add Status"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
