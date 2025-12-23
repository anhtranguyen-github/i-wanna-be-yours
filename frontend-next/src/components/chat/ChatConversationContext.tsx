/**
 * ChatConversationContext
 * 
 * Dedicated context for conversation-related state.
 * Split from ChatLayoutContext to reduce re-renders.
 */

"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ConversationContextType {
    /**
     * The effective conversation ID after URL updates
     */
    effectiveConversationId: string | null;
    /**
     * Update the effective conversation ID
     */
    setEffectiveConversationId: (id: string | null) => void;
    /**
     * Session ID for the current conversation
     */
    sessionId: string | null;
    /**
     * Update the session ID
     */
    setSessionId: (id: string | null) => void;
}

const ChatConversationContext = createContext<ConversationContextType | null>(null);

export function useChatConversation() {
    const context = useContext(ChatConversationContext);
    if (!context) {
        throw new Error('useChatConversation must be used within ChatConversationProvider');
    }
    return context;
}

interface ChatConversationProviderProps {
    children: ReactNode;
    initialConversationId?: string | null;
}

export function ChatConversationProvider({
    children,
    initialConversationId = null
}: ChatConversationProviderProps) {
    const [effectiveConversationId, setEffectiveConversationId] = useState<string | null>(
        initialConversationId
    );
    const [sessionId, setSessionId] = useState<string | null>(null);

    const updateConversationId = useCallback((id: string | null) => {
        setEffectiveConversationId(id);
    }, []);

    const updateSessionId = useCallback((id: string | null) => {
        setSessionId(id);
    }, []);

    return (
        <ChatConversationContext.Provider
            value={{
                effectiveConversationId,
                setEffectiveConversationId: updateConversationId,
                sessionId,
                setSessionId: updateSessionId,
            }}
        >
            {children}
        </ChatConversationContext.Provider>
    );
}
