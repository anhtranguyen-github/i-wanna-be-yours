"use client";

import React from 'react';
import { SidebarProvider, SIDEBAR_WIDTHS } from './SidebarContext';
import { UnifiedSidebar } from './UnifiedSidebar';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    return (
        <SidebarProvider>
            <div className="flex bg-slate-50 min-h-screen text-brand-dark">
                <UnifiedSidebar />
                <main
                    className="flex-1 flex flex-col min-h-screen transition-all duration-300"
                    style={{ marginLeft: SIDEBAR_WIDTHS.expanded }}
                >
                    <div className="flex-1 overflow-auto">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
