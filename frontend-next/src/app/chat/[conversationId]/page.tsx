"use client";

import React, { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useUser } from '@/context/UserContext';
import { useGlobalAuth } from '@/context/GlobalAuthContext';
import { Loader2 } from 'lucide-react';

// Dynamically import components with no SSR
const ChatMainArea = dynamic(
    () => import('@/components/chat/ChatMainArea').then(mod => mod.ChatMainArea),
    { ssr: false }
);

const ChatRightSidebar = dynamic(
    () => import('@/components/chat/ChatRightSidebar').then(mod => mod.ChatRightSidebar),
    { ssr: false }
);

export default function ChatConversationPage() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params?.conversationId as string;
    const { user, loading } = useUser();
    const { openAuth } = useGlobalAuth();
    const hasRedirected = useRef(false);

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
    }, [user, loading, conversationId]);

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="flex flex-1 h-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <div className="relative">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                        </div>
                    </div>
                    <p className="text-xs font-black font-display uppercase tracking-widest">Preparing your Dojo...</p>
                </div>
            </div>
        );
    }


    // If guest is being redirected, show nothing (redirect is in progress)
    if (!user && conversationId) {
        return null;
    }

    return (
        <div className="flex flex-1 h-full bg-background">
            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background">
                <ChatMainArea conversationId={conversationId} />
            </main>

            {/* Right Sidebar */}
            <ChatRightSidebarWrapper />
        </div>
    );

}

// Import SIDEBAR_WIDTHS from context
import { SIDEBAR_WIDTHS } from '@/components/chat/ChatLayoutContext';

function ChatRightSidebarWrapper() {
    const { useChatLayout } = require('@/components/chat/ChatLayoutContext');
    const { rightSidebar } = useChatLayout();

    return (
        <aside
            className="flex-shrink-0 h-full bg-background border-l border-border transition-all duration-500 ease-spring z-20 "
            style={{ width: SIDEBAR_WIDTHS.right[rightSidebar] }}
        >
            <ChatRightSidebar />
        </aside>
    );
}
