"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

// Sidebar state types
export type SidebarState = 'collapsed' | 'expanded';

// Width constants
export const SIDEBAR_WIDTHS = {
    collapsed: 72,
    expanded: 280,
} as const;

// Context interface
interface SidebarContextType {
    state: SidebarState;
    isExpanded: boolean;
    isCollapsed: boolean;
    isOnChat: boolean;
    currentPath: string | null;
    toggle: () => void;
    expand: () => void;
    collapse: () => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within SidebarProvider');
    }
    return context;
}

interface SidebarProviderProps {
    children: ReactNode;
    defaultState?: SidebarState;
}

export function SidebarProvider({ children, defaultState = 'expanded' }: SidebarProviderProps) {
    const [state, setState] = useState<SidebarState>(defaultState);
    const pathname = usePathname();

    const isOnChat = pathname?.startsWith('/chat') ?? false;

    const toggle = useCallback(() => {
        setState(prev => prev === 'expanded' ? 'collapsed' : 'expanded');
    }, []);

    const expand = useCallback(() => setState('expanded'), []);
    const collapse = useCallback(() => setState('collapsed'), []);

    return (
        <SidebarContext.Provider
            value={{
                state,
                isExpanded: state === 'expanded',
                isCollapsed: state === 'collapsed',
                isOnChat,
                currentPath: pathname,
                toggle,
                expand,
                collapse,
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
}
