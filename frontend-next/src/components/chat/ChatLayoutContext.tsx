"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// Types for sidebar states
export type LeftSidebarState = 'collapsed' | 'expanded';
export type RightSidebarState = 'collapsed' | 'minimized' | 'expanded';
export type Viewport = 'desktop' | 'tablet' | 'mobile';

// Artifact type definition
export interface ActiveArtifact {
    id: string;
    type: 'flashcard' | 'quiz' | 'vocabulary' | 'mindmap' | 'document' | string;
    title: string;
}

export interface ResourceToStage {
    id: string; // backend id
    title: string;
    type: string;
}

// Width constants
export const SIDEBAR_WIDTHS = {
    left: {
        collapsed: 56,
        expanded: 280,
    },
    right: {
        collapsed: 48,
        minimized: 300,
        expanded: 800, // Maximized for artifact editing
    }
} as const;

// State interface
interface ChatLayoutState {
    leftSidebar: LeftSidebarState;
    rightSidebar: RightSidebarState;
    viewport: Viewport;
    activeArtifact: ActiveArtifact | null;
}

// Context interface
interface ChatLayoutContextType extends ChatLayoutState {
    setLeftSidebar: (state: LeftSidebarState) => void;
    setRightSidebar: (state: RightSidebarState) => void;
    toggleLeftSidebar: () => void;
    toggleRightSidebar: () => void;
    expandRightSidebar: () => void;
    setActiveArtifact: (artifact: ActiveArtifact | null) => void;
    openArtifact: (artifact: ActiveArtifact) => void;
    stageResource: (resource: ResourceToStage) => void;
    stagedResourceToProcess: ResourceToStage | null;
    consumeStagedResource: () => void;
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

    // Tablet: expanded + expanded not allowed? Allow for now but logic might need tweak
    if (viewport === 'tablet') {
        if (left === 'expanded' && right === 'expanded') {
            // Priority to right expand if active
            return { left: 'collapsed', right: 'expanded' };
        }
    }

    // Desktop: If right is expanded (max), force left collapsed?
    // Maybe allow both if screen is huge ( > 1600)
    // For now, let's keep logic simple
    return { left, right };
}

interface ChatLayoutProviderProps {
    children: ReactNode;
}

export function ChatLayoutProvider({ children }: ChatLayoutProviderProps) {
    const [leftSidebar, setLeftSidebarState] = useState<LeftSidebarState>('expanded');
    const [rightSidebar, setRightSidebarState] = useState<RightSidebarState>('minimized');
    const [viewport, setViewport] = useState<Viewport>('desktop');
    const [activeArtifact, setActiveArtifactState] = useState<ActiveArtifact | null>(null);
    const [stagedResourceToProcess, setStagedResourceToProcess] = useState<ResourceToStage | null>(null);

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
        // If expanding right sidebar to max, maybe auto-collapse left sidebar on smaller desktop?
        let nextLeft = leftSidebar;
        if (state === 'expanded' && viewport !== 'desktop') {
            nextLeft = 'collapsed';
        }

        const validated = validateState(nextLeft, state, viewport);
        setRightSidebarState(validated.right);
        if (validated.left !== leftSidebar) setLeftSidebarState(validated.left);
    }, [leftSidebar, viewport]);

    const toggleLeftSidebar = useCallback(() => {
        setLeftSidebar(leftSidebar === 'expanded' ? 'collapsed' : 'expanded');
    }, [leftSidebar, setLeftSidebar]);

    const toggleRightSidebar = useCallback(() => {
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
    const openArtifact = useCallback((artifact: ActiveArtifact) => {
        setActiveArtifactState(artifact);
        setRightSidebar('expanded');
        if (window.innerWidth < 1600) {
            setLeftSidebar('collapsed');
        }
    }, [setRightSidebar, setLeftSidebar]);

    const stageResource = useCallback((resource: ResourceToStage) => {
        setStagedResourceToProcess(resource);
    }, []);

    const consumeStagedResource = useCallback(() => {
        setStagedResourceToProcess(null);
    }, []);

    return (
        <ChatLayoutContext.Provider
            value={{
                leftSidebar,
                rightSidebar,
                viewport,
                activeArtifact,
                setLeftSidebar,
                setRightSidebar,
                toggleLeftSidebar,
                toggleRightSidebar,
                expandRightSidebar,
                setActiveArtifact: setActiveArtifactState,
                openArtifact,
                stageResource,
                stagedResourceToProcess,
                consumeStagedResource,
            }}
        >
            {children}
        </ChatLayoutContext.Provider>
    );
}
