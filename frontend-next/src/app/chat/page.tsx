"use client";

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import components with no SSR
const ChatMainArea = dynamic(
    () => import('@/components/chat/ChatMainArea').then(mod => mod.ChatMainArea),
    {
        ssr: false,
        loading: () => <div className="flex items-center justify-center h-full text-slate-400">Loading Chat Interface...</div>
    }
);

const ChatRightSidebar = dynamic(
    () => import('@/components/chat/ChatRightSidebar').then(mod => mod.ChatRightSidebar),
    {
        ssr: false,
        loading: () => <div className="h-full w-[300px] border-l border-border bg-background" />
    }
);


export default function ChatPage() {
    return (
        <div className="flex flex-1 h-full bg-background">
            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background">
                <ChatMainArea />
            </main>

            {/* Right Sidebar */}
            <ChatRightSidebarWrapper />
        </div>
    );

}

// Import SIDEBAR_WIDTHS from context
import { SIDEBAR_WIDTHS } from '@/components/chat/ChatLayoutContext';

function ChatRightSidebarWrapper() {
    // Import the hook dynamically to avoid SSR issues
    const { useChatLayout } = require('@/components/chat/ChatLayoutContext');
    const { rightSidebar } = useChatLayout();

    return (
        <aside
            className="flex-shrink-0 h-full bg-background border-l border-border transition-all duration-500 ease-spring z-20"
            style={{ width: SIDEBAR_WIDTHS.right[rightSidebar] }}
        >
            <ChatRightSidebar />
        </aside>
    );
}
