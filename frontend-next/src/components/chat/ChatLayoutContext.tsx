"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// Types for sidebar states
export type LeftSidebarState = 'collapsed' | 'expanded';
export type RightSidebarState = 'collapsed' | 'minimized' | 'expanded';
export type Viewport = 'desktop' | 'tablet' | 'mobile';

// Width constants
export const SIDEBAR_WIDTHS = {
    left: {
        collapsed: 56,
        expanded: 280,
    },
    right: {
        collapsed: 40,
        minimized: 280,
        expanded: 440,
    }
} as const;

// State interface
interface ChatLayoutState {
    leftSidebar: LeftSidebarState;
    rightSidebar: RightSidebarState;
    viewport: Viewport;
}

// Context interface
interface ChatLayoutContextType extends ChatLayoutState {
    setLeftSidebar: (state: LeftSidebarState) => void;
    setRightSidebar: (state: RightSidebarState) => void;
    toggleLeftSidebar: () => void;
    toggleRightSidebar: () => void;
    expandRightSidebar: () => void;
}

const ChatLayoutContext = createContext<ChatLayoutContextType | null>(null);

export function useChatLayout() {
    const context = useContext(ChatLayoutContext);
    if (!context) {
        throw new Error('useChatLayout must be used within ChatLayoutProvider');
    }
    return context;
}

// Viewport detection
function getViewport(): Viewport {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width >= 1280) return 'desktop';
    if (width >= 768) return 'tablet';
    return 'mobile';
}

// Validate state based on viewport rules
function validateState(
    left: LeftSidebarState,
    right: RightSidebarState,
    viewport: Viewport
): { left: LeftSidebarState; right: RightSidebarState } {
    // Mobile: only one sidebar open
    if (viewport === 'mobile') {
        if (left === 'expanded' && right !== 'collapsed') {
            return { left: 'expanded', right: 'collapsed' };
        }
        if (right !== 'collapsed' && left === 'expanded') {
            return { left: 'collapsed', right };
        }
    }

    // Tablet: expanded + expanded not allowed
    if (viewport === 'tablet') {
        if (left === 'expanded' && right === 'expanded') {
            return { left: 'expanded', right: 'minimized' };
        }
    }

    // Desktop: all states allowed
    return { left, right };
}

interface ChatLayoutProviderProps {
    children: ReactNode;
}

export function ChatLayoutProvider({ children }: ChatLayoutProviderProps) {
    const [leftSidebar, setLeftSidebarState] = useState<LeftSidebarState>('expanded');
    const [rightSidebar, setRightSidebarState] = useState<RightSidebarState>('minimized');
    const [viewport, setViewport] = useState<Viewport>('desktop');

    // Initialize viewport on mount
    useEffect(() => {
        const updateViewport = () => {
            const newViewport = getViewport();
            setViewport(newViewport);

            // Validate and fix state on viewport change
            const validated = validateState(leftSidebar, rightSidebar, newViewport);
            if (validated.left !== leftSidebar) setLeftSidebarState(validated.left);
            if (validated.right !== rightSidebar) setRightSidebarState(validated.right);
        };

        updateViewport();
        window.addEventListener('resize', updateViewport);
        return () => window.removeEventListener('resize', updateViewport);
    }, [leftSidebar, rightSidebar]);

    const setLeftSidebar = useCallback((state: LeftSidebarState) => {
        const validated = validateState(state, rightSidebar, viewport);
        setLeftSidebarState(validated.left);
        if (validated.right !== rightSidebar) setRightSidebarState(validated.right);
    }, [rightSidebar, viewport]);

    const setRightSidebar = useCallback((state: RightSidebarState) => {
        const validated = validateState(leftSidebar, state, viewport);
        setRightSidebarState(validated.right);
        if (validated.left !== leftSidebar) setLeftSidebarState(validated.left);
    }, [leftSidebar, viewport]);

    const toggleLeftSidebar = useCallback(() => {
        setLeftSidebar(leftSidebar === 'expanded' ? 'collapsed' : 'expanded');
    }, [leftSidebar, setLeftSidebar]);

    const toggleRightSidebar = useCallback(() => {
        // Cycle: collapsed -> minimized -> expanded -> collapsed
        const next: Record<RightSidebarState, RightSidebarState> = {
            collapsed: 'minimized',
            minimized: 'expanded',
            expanded: 'collapsed',
        };
        setRightSidebar(next[rightSidebar]);
    }, [rightSidebar, setRightSidebar]);

    const expandRightSidebar = useCallback(() => {
        if (rightSidebar === 'collapsed') {
            setRightSidebar('minimized');
        } else if (rightSidebar === 'minimized') {
            setRightSidebar('expanded');
        }
    }, [rightSidebar, setRightSidebar]);

    return (
        <ChatLayoutContext.Provider
            value={{
                leftSidebar,
                rightSidebar,
                viewport,
                setLeftSidebar,
                setRightSidebar,
                toggleLeftSidebar,
                toggleRightSidebar,
                expandRightSidebar,
            }}
        >
            {children}
        </ChatLayoutContext.Provider>
    );
}
