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
            <div className="flex flex-1 h-full items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    // If guest is being redirected, show nothing (redirect is in progress)
    if (!user && conversationId) {
        return null;
    }

    return (
        <div className="flex flex-1 h-full">
            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white">
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
            className="flex-shrink-0 h-full bg-white border-l border-slate-100 transition-all duration-300 ease-out z-20 shadow-xl"
            style={{ width: SIDEBAR_WIDTHS.right[rightSidebar] }}
        >
            <ChatRightSidebar />
        </aside>
    );
}
