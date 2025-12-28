
"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Resource } from '@/services/resourceService';
import { Artifact } from '@/types/artifact';
import { usePathname, useParams } from 'next/navigation';
import { ChatConversationProvider } from './ChatConversationContext';

// Types for sidebar states
export type LeftSidebarState = 'collapsed' | 'expanded';
export type RightSidebarState = 'collapsed' | 'minimized' | 'expanded';
export type Viewport = 'desktop' | 'tablet' | 'mobile';

// Artifact type definition re-export for consumers if needed, usually just use Artifact
export type ActiveArtifact = Artifact;

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

    // Resource Preview
    previewResource: Resource | null;
    openResourcePreview: (resource: Resource) => void;
    closeResourcePreview: () => void;
    resetRightSidebar: () => void;
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
            return { left: 'collapsed', right: 'expanded' };
        }
    }

    return { left, right };
}

interface ChatLayoutProviderProps {
    children: ReactNode;
}

export function ChatLayoutProvider({ children }: ChatLayoutProviderProps) {
    const pathname = usePathname();
    const params = useParams();
    const conversationIdFromParams = params?.conversationId as string | undefined;

    const [leftSidebar, setLeftSidebarState] = useState<LeftSidebarState>('expanded');
    const [rightSidebar, setRightSidebarState] = useState<RightSidebarState>('collapsed');
    const [viewport, setViewport] = useState<Viewport>('desktop');
    const [activeArtifact, setActiveArtifactState] = useState<ActiveArtifact | null>(null);
    const [stagedResourceToProcess, setStagedResourceToProcess] = useState<ResourceToStage | null>(null);
    const [previewResource, setPreviewResource] = useState<Resource | null>(null);

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
    }, [leftSidebar, rightSidebar, viewport]);

    const resetRightSidebar = useCallback(() => {
        setActiveArtifactState(null);
        setRightSidebarState('collapsed');
        setStagedResourceToProcess(null);
        setPreviewResource(null);
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('hanachan:rightSidebar');
            sessionStorage.removeItem('hanachan:activeArtifact');
        }
    }, []);

    // EFFECT: Restore sidebar state from sessionStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const savedSidebar = sessionStorage.getItem('hanachan:rightSidebar');
        const savedArtifact = sessionStorage.getItem('hanachan:activeArtifact');

        if (savedSidebar) {
            setRightSidebarState(savedSidebar as RightSidebarState);
            sessionStorage.removeItem('hanachan:rightSidebar');
        }

        if (savedArtifact) {
            try {
                setActiveArtifactState(JSON.parse(savedArtifact));
            } catch (e) {
                console.error('Failed to parse saved artifact:', e);
            }
            sessionStorage.removeItem('hanachan:activeArtifact');
        }
    }, []);

    // EFFECT: Reset right sidebar when navigating to /chat (new chat)
    useEffect(() => {
        if (pathname === '/chat') {
            resetRightSidebar();
        }
    }, [pathname, resetRightSidebar]);

    const setLeftSidebar = useCallback((state: LeftSidebarState) => {
        const validated = validateState(state, rightSidebar, viewport);
        setLeftSidebarState(validated.left);
        if (validated.right !== rightSidebar) setRightSidebarState(validated.right);
    }, [rightSidebar, viewport]);

    const setRightSidebar = useCallback((state: RightSidebarState) => {
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
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('hanachan:rightSidebar', 'expanded');
            sessionStorage.setItem('hanachan:activeArtifact', JSON.stringify(artifact));
        }
    }, [setRightSidebar, setLeftSidebar]);

    const stageResource = useCallback((resource: ResourceToStage) => {
        setStagedResourceToProcess(resource);
    }, []);

    const consumeStagedResource = useCallback(() => {
        setStagedResourceToProcess(null);
    }, []);

    const openResourcePreview = useCallback((resource: Resource) => {
        setPreviewResource(resource);
    }, []);

    const closeResourcePreview = useCallback(() => {
        setPreviewResource(null);
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
                previewResource,
                openResourcePreview,
                closeResourcePreview,
                resetRightSidebar,
            }}
        >
            <ChatConversationProvider initialConversationId={conversationIdFromParams}>
                {children}
            </ChatConversationProvider>
        </ChatLayoutContext.Provider>
    );
}
