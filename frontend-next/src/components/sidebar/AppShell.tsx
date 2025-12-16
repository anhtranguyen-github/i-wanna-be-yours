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

// Session storage key for tracking modal shown status
const MODAL_SHOWN_KEY = 'hanabira_modal_shown';

export function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();
    const [showModal, setShowModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Check if modal was already shown in this session
        const alreadyShown = sessionStorage.getItem(MODAL_SHOWN_KEY);
        if (alreadyShown) {
            return; // Don't show modal if already shown this session
        }

        // Check if we should show modal (not on excluded routes)
        const shouldShow = !EXCLUDED_ROUTES.some(route =>
            pathname === route || pathname?.startsWith(route + '/')
        );

        // Show modal on first visit only
        if (shouldShow) {
            const timer = setTimeout(() => {
                setShowModal(true);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, []); // Only run once on mount, not on pathname change

    const handleCloseModal = () => {
        setShowModal(false);
        // Mark modal as shown for this session
        sessionStorage.setItem(MODAL_SHOWN_KEY, 'true');
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

            {/* Hybrid Landing Modal - shows once per session */}
            {mounted && (
                <HybridLandingModal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                />
            )}
        </SidebarProvider>
    );
}
