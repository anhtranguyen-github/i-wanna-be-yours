"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarProvider, SIDEBAR_WIDTHS } from './SidebarContext';
import { UnifiedSidebar } from './UnifiedSidebar';
import { HybridLandingModal } from '../modal/HybridLandingModal';

interface AppShellProps {
    children: React.ReactNode;
}

// Routes where modal should NOT appear
const EXCLUDED_ROUTES = ['/landing', '/login', '/signup', '/pricing', '/checkout'];

export function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();
    const [showModal, setShowModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Check if we should show modal (not on excluded routes)
        const shouldShow = !EXCLUDED_ROUTES.some(route =>
            pathname === route || pathname?.startsWith(route + '/')
        );

        // Small delay for better UX
        if (shouldShow) {
            const timer = setTimeout(() => {
                setShowModal(true);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [pathname]);

    const handleCloseModal = () => {
        setShowModal(false);
    };

    // Check if current route is dedicated landing page (no sidebar)
    const isLandingPage = pathname === '/landing';

    if (isLandingPage) {
        // Landing page gets no sidebar, no modal
        return <>{children}</>;
    }

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

            {/* Hybrid Landing Modal - shows on first visit */}
            {mounted && (
                <HybridLandingModal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                />
            )}
        </SidebarProvider>
    );
}
