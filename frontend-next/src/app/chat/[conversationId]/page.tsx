"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ChatLayoutProvider } from '@/components/chat/ChatLayoutContext';

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
    const conversationId = params?.conversationId as string;

    return (
        <ChatLayoutProvider>
            <div className="flex flex-1 h-full">
                {/* Main Chat Area */}
                <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white">
                    <ChatMainArea conversationId={conversationId} />
                </main>

                {/* Right Sidebar */}
                <ChatRightSidebarWrapper />
            </div>
        </ChatLayoutProvider>
    );
}

function ChatRightSidebarWrapper() {
    const { useChatLayout } = require('@/components/chat/ChatLayoutContext');
    const { rightSidebar } = useChatLayout();

    const SIDEBAR_WIDTHS = {
        collapsed: 40,
        minimized: 280,
        expanded: 440,
    };

    return (
        <aside
            className="flex-shrink-0 h-full bg-white border-l border-slate-100 transition-all duration-300 ease-out"
            style={{ width: SIDEBAR_WIDTHS[rightSidebar] }}
        >
            <ChatRightSidebar />
        </aside>
    );
}
