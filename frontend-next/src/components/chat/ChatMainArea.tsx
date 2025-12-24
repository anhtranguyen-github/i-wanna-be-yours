"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import {
    useChatLayout,
    MessageBubble,
    ChatInput,
    WelcomeCard,
    VirtualizedMessageList,
    AttachedFile,
    ChatMessage
} from '@/components/chat';
import { useChatConversation } from '@/components/chat/ChatConversationContext';
import { useUser } from '@/context/UserContext';
import { useGlobalAuth } from '@/context/GlobalAuthContext';
import { useChatStream, useConversation, useArtifactsMutate } from '@/hooks';
import { ResourcePreviewModal } from '@/components/resources/ResourcePreviewModal';
import { aiTutorService } from '@/services/aiTutorService';
import { Artifact, ArtifactType } from '@/types/artifact';

// Internal ArtifactIcon component
function ArtifactIcon({ type }: { type: ArtifactType }) {
    const {
        Layers,
        CheckSquare,
        GraduationCap,
        FileText,
        Sparkles
    } = require('lucide-react');

    switch (type) {
        case 'flashcard':
        case 'flashcard_deck':
            return <Layers size={20} />;
        case 'quiz':
            return <CheckSquare size={20} />;
        case 'exam':
            return <GraduationCap size={20} />;
        case 'note':
            return <FileText size={20} />;
        default:
            return <Sparkles size={20} />;
    }
}

interface ChatMainAreaProps {
    conversationId?: string;
}

export function ChatMainArea({ conversationId: conversationIdProp }: ChatMainAreaProps) {
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();
    const router = useRouter();
    const isGuest = !user;

    // Use split contexts
    const {
        effectiveConversationId,
        setEffectiveConversationId,
        sessionId,
        setSessionId
    } = useChatConversation();

    const {
        stagedResourceToProcess,
        consumeStagedResource,
        openArtifact,
        previewResource,
        closeResourcePreview,
        stageResource
    } = useChatLayout();

    // Local states
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    // Hooks
    const mutateArtifacts = useArtifactsMutate();

    // Fetch individual conversation if ID exists
    const {
        conversation,
        messages: historyMessages,
        isLoading: historyLoading
    } = useConversation(conversationIdProp);

    // Sync history and conversation state to local state
    useEffect(() => {
        // Handle new chat scenario
        if (!conversationIdProp) {
            setMessages(prev => prev.length === 0 ? prev : []);
            setSessionId(null);
            setEffectiveConversationId(null);
            return;
        }

        // Sync context to prop
        setEffectiveConversationId(conversationIdProp);

        // Sync history messages
        if (historyMessages) {
            const mappedMessages: ChatMessage[] = historyMessages.map(m => ({
                ...m,
                timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
            } as ChatMessage));

            setMessages(prev => {
                // Heuristic to avoid redundant updates: same length and same last message ID
                if (prev.length === mappedMessages.length &&
                    (prev.length === 0 || prev[prev.length - 1].id === mappedMessages[mappedMessages.length - 1].id)) {
                    return prev;
                }
                return mappedMessages;
            });

            if (conversation?.sessionId) {
                setSessionId(conversation.sessionId);
            }
        }
    }, [conversationIdProp, historyMessages, conversation, setSessionId, setEffectiveConversationId]);

    // Stream handler
    const { streamState, sendMessage: streamMessage, cancelStream } = useChatStream({
        onConversationCreated: (id) => {
            setEffectiveConversationId(id);
            // Shallow update URL
            router.replace(`/chat/${id}`, { scroll: false });
        },
        onArtifactsReceived: (artifacts, convoId) => {
            // Artifacts are now handled via SWR in the sidebar
            // Mutate with the ID provided by the stream (handles new chat case)
            mutateArtifacts(convoId);
        },
        onMessageComplete: (msg) => {
            setMessages(prev => [...prev, msg]);
        }
    });

    // File handling logic
    useEffect(() => {
        if (stagedResourceToProcess) {
            const { id: backendId, title } = stagedResourceToProcess;
            setAttachedFiles(prev => {
                if (prev.some(af => af.backendId === backendId)) return prev;
                return [...prev, {
                    id: Math.random().toString(36).substr(2, 9),
                    title: title,
                    uploading: false,
                    backendId: backendId
                }];
            });
            consumeStagedResource();
        }
    }, [stagedResourceToProcess, consumeStagedResource]);

    const handleFileSelect = async (files: File[]) => {
        const uniqueFiles = files.filter(file =>
            !attachedFiles.some(af => af.file?.name === file.name && af.file?.size === file.size)
        );
        if (uniqueFiles.length === 0) return;

        const newAttachments = uniqueFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            title: file.name,
            uploading: true
        }));

        setAttachedFiles(prev => [...prev, ...newAttachments]);

        for (const attachment of newAttachments) {
            try {
                const response = await aiTutorService.uploadFile(attachment.file!);
                setAttachedFiles(prev => prev.map(f =>
                    f.id === attachment.id ? { ...f, uploading: false, backendId: response.id } : f
                ));
            } catch (error) {
                console.error("Upload failed", error);
                setAttachedFiles(prev => prev.map(f =>
                    f.id === attachment.id ? { ...f, uploading: false, error: true } : f
                ));
            }
        }
    };

    const handleSend = async () => {
        if ((!inputValue.trim() && attachedFiles.length === 0) || streamState.isStreaming) return;

        // Gate for guests starting NEW conversations
        if (isGuest && !effectiveConversationId) {
            openAuth('REGISTER', {
                flowType: 'CHAT',
                title: "Start Learning with Hanachan",
                description: "Create a free account to chat with Hanachan and save your progress."
            });
            return;
        }

        const validAttachments = attachedFiles.filter(f => !f.error && f.backendId);
        const resourceIds = validAttachments.map(f => f.backendId as string);

        const currentInput = inputValue;

        // Optimistic update
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: currentInput,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setAttachedFiles([]);

        await streamMessage(
            currentInput,
            effectiveConversationId,
            sessionId || `session-${Date.now()}`,
            resourceIds
        );
    };

    const handleQuickAction = async (type: ArtifactType) => {
        const prompts: Record<string, string> = {
            flashcard: "Create flashcards for the current topic.",
            quiz: "Generate a quiz based on our discussion.",
            summary: "Summarize our conversation so far."
        };

        setInputValue(prompts[type] || "");
    };

    // Combine history and current stream
    const allMessages = [...messages];
    if (streamState.isStreaming && streamState.currentText) {
        allMessages.push({
            id: 'streaming',
            role: 'assistant',
            content: streamState.currentText,
            timestamp: new Date()
        });
    }

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="flex-1 overflow-hidden flex flex-col pt-4">
                {allMessages.length === 0 && !historyLoading ? (
                    <WelcomeCard onSuggestionClick={(text) => {
                        setInputValue(text);
                    }} />
                ) : (
                    <VirtualizedMessageList
                        messages={allMessages}
                        isLoading={streamState.isStreaming}
                        onOpenArtifact={openArtifact}
                    />
                )}
            </div>

            <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSend}
                onFileSelect={handleFileSelect}
                attachedFiles={attachedFiles}
                onRemoveAttachment={(id) => setAttachedFiles(prev => prev.filter(f => f.id !== id))}
                onQuickAction={handleQuickAction}
                isLoading={streamState.isStreaming}
                disabled={historyLoading}
            />

            <ResourcePreviewModal
                resource={previewResource}
                isOpen={!!previewResource}
                onClose={closeResourcePreview}
                onAddToChat={() => {
                    if (previewResource) {
                        stageResource({
                            id: previewResource.id,
                            title: previewResource.title,
                            type: previewResource.type
                        });
                    }
                }}
            />
        </div>
    );
}
