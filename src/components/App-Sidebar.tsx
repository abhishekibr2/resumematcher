"use client"

import * as React from "react"
import {
    CircleCheckBig,
    CircleDollarSign,
    Dot,
    FileText,
    GalleryVerticalEnd,
    Languages,
    Settings,
} from "lucide-react"


import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"
import { TeamSwitcher } from "./team-switcher"
import { NavUser } from "./nav-user"
import { NavMain } from "./nav-main"

// This is sample data.

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

    const { data: session } = useSession();
    const data = {
        user: {
            name: session?.user?.name || "User",
            email: session?.user?.email || "",
            // avatar: session?.user?.image || "/avatars/shadcn.jpg",
        },
        teams: [
            {
                name: "ABC Company",
                logo: GalleryVerticalEnd,
                plan: "Enterprise",
            },
        ],
        navMain: [
            {
                title: "Resumes",
                url: "/",
                icon: FileText,
                isActive: true,
                items: [
                    {
                        title: "All Resumes",
                        url: "/all-resumes",
                    },
                    {
                        title: "Upload Resume",
                        url: "/upload-resume",
                    },
                ],
            },
            {
                title: "Prompts",
                url: "/",
                icon: Languages,
                items: [
                    {
                        title: "Saved Prompts",
                        url: "/all-prompts",
                    },
                ],
            },
            {
                title: "Status",
                url: "/",
                icon: CircleCheckBig,
                isActive: false,
                items: [
                    {
                        title: "All Status",
                        url: "/all-status",
                    },
                ],
            },
            ...((session?.user.role === "admin") ? [{
                title: "Admin",
                url: "/admin",
                icon: Settings,
                items: [
                    {
                        title: "Users",
                        url: "/users",
                    },
                ],
            }] : [])
        ],
    }
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={data.teams} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
