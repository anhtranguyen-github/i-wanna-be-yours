"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { SidebarProvider, useSidebar, SIDEBAR_WIDTHS } from './SidebarContext';
import { CollapsibleSidebar } from './CollapsibleSidebar';

interface AppShellProps {
    children: React.ReactNode;
}


// Internal component to handle responsive layout consuming context
function MainLayout({ children }: { children: React.ReactNode }) {
    const { state } = useSidebar();
    const width = SIDEBAR_WIDTHS[state];

    return (
        <div className="flex bg-slate-50 min-h-screen text-brand-dark">
            <CollapsibleSidebar />
            <main
                className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-out"
                style={{ marginLeft: width }}
            >
                <div className="flex-1 overflow-visible">
                    {children}
                </div>
            </main>
        </div>
    );
}

export function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();

    const isLandingPage = pathname === '/landing' || pathname === '/';

    if (isLandingPage) {
        return <>{children}</>;
    }

    return (
        <SidebarProvider>
            <MainLayout>{children}</MainLayout>
        </SidebarProvider>
    );
}
