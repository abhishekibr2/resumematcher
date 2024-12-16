import Image from "next/image";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
            <div className="text-lg">The page you are looking for does not exist.</div>
        </div>
    );
}