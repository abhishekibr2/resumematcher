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

    useEffect(() => {
        if (status === "loading") {
            setIsLoading(true);
        } else if (status !== "authenticated") {
            toast({
                description: "You are not logged in",
                variant: "default",
            });
            router.push("/log-in");
        } else if (session.user.role != "admin") {
            toast({
                description: "You are not authorized to access this page",
                variant: "destructive",
            });
            router.push("/");
        } else {
            setIsLoading(false);
        }
    }, [status, session, router]);

    return (
        <>
            {!isLoading ? (
                <>
                    {children}
                </>
            ) : (
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
        </>
    );
}
