"use client"

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
    const [userRole, setUserRole] = useState<any>(null);

    const checkAdmin = async () => {
        try {
            if (!session?.user?.role) {
                setUserRole(null);
                setIsLoading(false);
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
            setIsLoading(false);
        } catch (error) {
            console.error("Error checking admin status:", error);
            setUserRole(null);
            setIsLoading(false);
            toast({
                description: "Failed to verify admin permissions",
                variant: "destructive",
            });
            router.push("/");
        }
    }

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
            checkAdmin();
        }
    }, [status, session]);

    useEffect(() => {
        if (!isLoading && status === "authenticated" && !userRole?.adminPermissions?.can_access_admin_panel) {
            toast({
                description: "You are not authorized to access this page",
                variant: "destructive",
            });
            router.push("/");
        }
    }, [userRole, isLoading, status, router]);

    return (
        <>
            {!isLoading ? (
                <>
                    {userRole?.adminPermissions?.can_access_admin_panel ? children : null}
                </>
            ) : (
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
        </>
    );
}
