"use client"

import * as React from "react"
import {
    FileText,
    GalleryVerticalEnd,
    Languages,
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
