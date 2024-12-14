"use client"

import { AppSidebar } from "@/components/App-Sidebar";
import Navbar from "@/components/NavBar";
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
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") {
            setIsLoading(true);
        } else if (status !== "authenticated") {
            toast({
                description: "You are not logged in",
                variant: "default",
            });
            router.push("/log-in");
        } else {
            setIsLoading(false);
        }
    }, [status, session, router]);

    return (
        <>
            {!isLoading ? (
                <SidebarProvider>
                    <AppSidebar />
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
