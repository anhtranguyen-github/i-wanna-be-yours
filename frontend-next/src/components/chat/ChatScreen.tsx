"use client";

import React from 'react';
import { ChatLayoutProvider } from './ChatLayoutContext';
import { ChatLayoutShell } from './ChatLayoutShell';
import { ChatLeftSidebar } from './ChatLeftSidebar';
import { ChatRightSidebar } from './ChatRightSidebar';
import { ChatMainArea } from './ChatMainArea';

interface ChatScreenProps {
    conversationId?: string;
}

export function ChatScreen({ conversationId }: ChatScreenProps) {
    return (
        <ChatLayoutProvider>
            <ChatLayoutShell
                leftSidebar={<ChatLeftSidebar />}
                mainContent={<ChatMainArea conversationId={conversationId} />}
                rightSidebar={<ChatRightSidebar />}
            />
        </ChatLayoutProvider>
    );
}
