'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // To highlight the active link
import { Button } from './ui/button';
import { signOut } from 'next-auth/react';

const Navbar = () => {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { name: 'All Resumes', href: '/all-resumes' },
        { name: 'Upload Resume', href: '/upload-resume' },
    ];

    return (
        <nav className="p-4 shadow-md">
            <div className="flex justify-between w-full px-10">
                <div className="text-lg font-semibold">
                    <Link href="/">ABC Company</Link>
                </div>
                <div className="space-x-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'px-4 py-2 rounded-md transition-colors duration-200',
                                'hover:bg-gray-100'
                            )}
                        >
                            {item.name}
                        </Link>
                    ))}
                    <Button variant="outline" onClick={() => { signOut(); router.push('/log-in') }}>Log Out</Button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;