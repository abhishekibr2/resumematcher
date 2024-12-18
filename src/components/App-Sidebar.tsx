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
import Link from "next/link"

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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    userRole?: any;
    companyName?: string;
}

export function AppSidebar({ userRole = null, companyName = "Default Company", ...props }: AppSidebarProps) {
    const { data: session } = useSession();
    const data = {
        user: {
            name: session?.user?.name || "User",
            email: session?.user?.email || "",
        },
        teams: [
            {
                name: companyName,
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
                title: "Posts",
                url: "/",
                icon: Languages,
                items: [
                    {
                        title: "Saved Posts",
                        url: "/all-posts",
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
        ],
    }
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={data.teams} companyName={companyName} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser userRole={userRole} user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
