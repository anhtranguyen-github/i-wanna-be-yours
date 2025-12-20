"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarProvider, useSidebar, SIDEBAR_WIDTHS } from './SidebarContext';
import { CollapsibleSidebar } from './CollapsibleSidebar';
import { HybridLandingModal } from '../modal/HybridLandingModal';

interface AppShellProps {
    children: React.ReactNode;
}

// Routes where modal should NOT appear
const EXCLUDED_ROUTES = ['/landing', '/login', '/signup', '/pricing', '/checkout'];

// Session storage key for tracking modal shown status
const MODAL_SHOWN_KEY = 'hanachan_modal_shown';

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
    const [showModal, setShowModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        const alreadyShown = sessionStorage.getItem(MODAL_SHOWN_KEY);
        if (alreadyShown) return;

        const shouldShow = !EXCLUDED_ROUTES.some(route =>
            pathname === route || pathname?.startsWith(route + '/')
        );

        if (shouldShow) {
            const timer = setTimeout(() => {
                setShowModal(true);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleCloseModal = () => {
        setShowModal(false);
        sessionStorage.setItem(MODAL_SHOWN_KEY, 'true');
    };

    const isLandingPage = pathname === '/landing';

    if (isLandingPage) {
        return <>{children}</>;
    }

    return (
        <SidebarProvider>
            <MainLayout>{children}</MainLayout>

            {mounted && (
                <HybridLandingModal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                />
            )}
        </SidebarProvider>
    );
}
