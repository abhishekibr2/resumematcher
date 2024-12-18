"use client"

import { AppSidebar } from "@/components/App-Sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { data: session, status } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [companyName, setCompanyName] = useState("");
    const [redirectToResume, setRedirectToResume] = useState(false);
    const router = useRouter();

    const checkAdmin = async () => {
        try {
            if (!session?.user?.role) {
                setUserRole(null);
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
                throw new Error('Failed to check admin status');
            }

            const data = await response.json();

            if (!data.ok) {
                throw new Error(data.message || 'Failed to verify admin status');
            }

            setUserRole(data.userRole);
        } catch (error) {
            console.error("Error checking admin status:", error);
            setUserRole(null);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            if (data.success) {
                setCompanyName(data.settings.companyName);
                setRedirectToResume(data.settings.redirectToResume);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            setCompanyName("Default Company");
            setRedirectToResume(false);
        }
    };

    useEffect(() => {
        if (redirectToResume) {
            router.push("/all-resumes");
        }
    }, [redirectToResume]);

    useEffect(() => {
        if (status === "loading") {
            setIsLoading(true);
        } else if (status !== "authenticated") {
            setIsLoading(false);
            toast({
                description: "You are not logged in",
                variant: "default",
            });
            router.push("/log-in");
        } else {
            Promise.all([checkAdmin(), fetchSettings()]).finally(() => {
                setIsLoading(false);
            });
        }
    }, [status, session]);

    return (
        <>
            {!isLoading ? (
                <SidebarProvider>
                    <AppSidebar userRole={userRole} companyName={companyName} />
                    <main className="w-full px-4">
                        <SidebarTrigger />
                        {children}
                    </main>
                </SidebarProvider>
            ) : (
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
        </>
    );
}
