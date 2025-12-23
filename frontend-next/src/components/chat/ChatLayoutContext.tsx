
"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Resource } from '@/services/resourceService';
import { Artifact } from '@/types/artifact';

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
    effectiveConversationId: string | null;
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
    setEffectiveConversationId: (id: string | null) => void;

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

import { usePathname, useParams } from 'next/navigation';

interface ChatLayoutProviderProps {
    children: ReactNode;
}

export function ChatLayoutProvider({ children }: ChatLayoutProviderProps) {
    const pathname = usePathname();
    const params = useParams();
    const conversationIdFromParams = params?.conversationId as string | undefined;
    const [leftSidebar, setLeftSidebarState] = useState<LeftSidebarState>('expanded');
    const [rightSidebar, setRightSidebarState] = useState<RightSidebarState>('minimized');
    const [viewport, setViewport] = useState<Viewport>('desktop');
    const [activeArtifact, setActiveArtifactState] = useState<ActiveArtifact | null>(null);
    const [stagedResourceToProcess, setStagedResourceToProcess] = useState<ResourceToStage | null>(null);
    const [previewResource, setPreviewResource] = useState<Resource | null>(null);
    // Effective conversation ID - can be updated after shallow URL update
    const [effectiveConversationId, setEffectiveConversationId] = useState<string | null>(conversationIdFromParams || null);

    // Sync effectiveConversationId when params change (user navigated via Next.js router)
    useEffect(() => {
        if (conversationIdFromParams) {
            setEffectiveConversationId(conversationIdFromParams);
        } else if (pathname === '/chat') {
            // User navigated to new chat
            setEffectiveConversationId(null);
        }
    }, [conversationIdFromParams, pathname]);

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
        setRightSidebarState('minimized');
        // Clear sessionStorage when explicitly resetting
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('hanachan:rightSidebar');
            sessionStorage.removeItem('hanachan:activeArtifact');
        }
    }, []);

    // EFFECT: Restore sidebar state from sessionStorage on mount (for navigation bridge)
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
    }, []); // Only on mount

    // EFFECT: Reset right sidebar ONLY when navigating to /chat (new chat) or switching between different chats
    useEffect(() => {
        // Only reset when pathname is exactly /chat (user clicked New Chat)
        if (pathname === '/chat') {
            resetRightSidebar();
        }
        // Note: We no longer reset when conversationId changes, as this breaks the navigation bridge
    }, [pathname, resetRightSidebar]);

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
        // Persist to sessionStorage for navigation bridge
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
                effectiveConversationId,
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
                setEffectiveConversationId,
                previewResource,
                openResourcePreview,
                closeResourcePreview,
                resetRightSidebar,
            }}
        >
            {children}
        </ChatLayoutContext.Provider>
    );
}
