"use client";

import React, { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useUser } from '@/context/UserContext';
import { useGlobalAuth } from '@/context/GlobalAuthContext';
import { Loader2 } from 'lucide-react';
import { SIDEBAR_WIDTHS } from '@/components/chat/ChatLayoutContext';
import ThoughtHUD from '@/components/chat/ThoughtHUD';

// Dynamically import components with no SSR
const ChatMainArea = dynamic(
    () => import('@/components/chat/ChatMainArea').then(mod => mod.ChatMainArea),
    {
        ssr: false,
        loading: () => <div className="flex-1 flex items-center justify-center h-full text-neutral-ink">Loading Chat Area...</div>
    }
);

const ChatRightSidebar = dynamic(
    () => import('@/components/chat/ChatRightSidebar').then(mod => mod.ChatRightSidebar),
    {
        ssr: false,
        loading: () => <div className="h-full w-[300px] border-l border-border bg-background" />
    }
);

export default function UnifiedChatPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading } = useUser();
    const { openAuth } = useGlobalAuth();
    const hasRedirected = useRef(false);

    // Get conversationId from optional catch-all params
    // params.conversationId will be an array: [] for /chat or ["id"] for /chat/id
    const conversationIdArr = params?.conversationId;
    const conversationId = Array.isArray(conversationIdArr) ? conversationIdArr[0] : undefined;

    // Redirect guests trying to access specific conversations
    useEffect(() => {
        if (!loading && !user && conversationId && !hasRedirected.current) {
            hasRedirected.current = true;
            router.replace('/chat');
            // Delay opening auth modal slightly to avoid race condition
            setTimeout(() => {
                openAuth('LOGIN', {
                    title: 'View Conversation',
                    description: 'Sign in to access your chat history and saved artifacts'
                });
            }, 100);
        }
    }, [user, loading, conversationId, router, openAuth]);

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="flex flex-1 h-full items-center justify-center bg-secondary">
                <div className="flex flex-col items-center gap-4 text-neutral-ink">
                    <div className="relative">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                        </div>
                    </div>
                    <p className="text-xs font-black font-display uppercase tracking-widest text-center">Preparing Hanachan...</p>
                </div>
            </div>
        );
    }

    // If guest is being redirected, show empty state or main area
    // Actually, letting ChatMainArea handle the 'no ID' case is fine.

    // Check if DEV_MODE is enabled for ThoughtHUD
    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

    return (
        <div className="flex flex-1 h-full bg-secondary overflow-hidden">
            {/* Thought HUD (Developer Mode) */}
            {isDevMode && (
                <ThoughtHUD userId={String(user?.id || 'guest')} isEnabled={isDevMode} />
            )}

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-neutral-white  z-10 relative">
                <ChatMainArea conversationId={conversationId} />
            </main>

            {/* Right Sidebar */}
            <ChatRightSidebarWrapper />
        </div>
    );
}

function ChatRightSidebarWrapper() {
    // Import the hook dynamically to avoid SSR issues
    const { useChatLayout } = require('@/components/chat/ChatLayoutContext');
    const { rightSidebar } = useChatLayout();

    return (
        <aside
            className="flex-shrink-0 h-full bg-neutral-beige border-l border-neutral-gray transition-all duration-500 ease-spring z-20"
            style={{ width: SIDEBAR_WIDTHS.right[rightSidebar] }}
        >
            <ChatRightSidebar />
        </aside>
    );
}
