"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { HanachanStatus } from './HanachanStatus';
import { InformativeLoginCard } from '@/components/shared/InformativeLoginCard';
import { useNotification } from '@/context/NotificationContext';
import {
    Layers,
    CheckSquare,
    GraduationCap,
    FileText,
    Sparkles,
    Brain
} from 'lucide-react';

// Internal ArtifactIcon component
function ArtifactIcon({ type }: { type: ArtifactType }) {
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
    const searchParams = useSearchParams();
    const isGuest = !user;
    const initialMessageProcessed = useRef(false);

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
        if (!conversationIdProp) {
            setMessages(prev => prev.length === 0 ? prev : []);
            setSessionId(null);
            setEffectiveConversationId(null);
            return;
        }

        if (historyMessages && historyMessages.length > 0) {
            setMessages(historyMessages.map(m => ({
                ...m,
                timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
            } as ChatMessage)));
            setEffectiveConversationId(conversationIdProp);
        }
    }, [conversationIdProp, historyMessages, setEffectiveConversationId, setSessionId]);

    const { streamState, sendMessage: streamMessage } = useChatStream({
        onConversationCreated: (id) => {
            setEffectiveConversationId(id);
            router.replace(`/chat/${id}`, { scroll: false });
        },
        onArtifactsReceived: (artifacts, convoId) => {
            mutateArtifacts(convoId);
        },
        onMessageComplete: (msg) => {
            setMessages(prev => [...prev, msg]);
        }
    });

    // Handle initial message from query param
    useEffect(() => {
        const initialMessage = searchParams.get('message');
        if (initialMessage && !initialMessageProcessed.current && !streamState.isStreaming && messages.length === 0 && !historyLoading) {
            initialMessageProcessed.current = true;
            setInputValue(initialMessage);

            if (user) {
                handleSend(initialMessage);
            }
        }
    }, [searchParams, user, messages.length, streamState.isStreaming, historyLoading]);

    const handleSend = async (overrideInput?: string) => {
        const text = overrideInput !== undefined ? overrideInput : inputValue;
        if (!text.trim() || streamState.isStreaming) return;

        // Optimistically add user message
        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);

        setInputValue('');
        setAttachedFiles([]);

        try {
            await streamMessage(
                text,
                effectiveConversationId,
                sessionId || 'default-session',
                attachedFiles.map(f => f.id)
            );
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const { addNotification } = useNotification();
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.png', '.jpg', '.jpeg', '.docx'];

    const handleFileUpload = (files: File[]) => {
        const validFiles: File[] = [];

        for (const file of files) {
            const extension = '.' + file.name.split('.').pop()?.toLowerCase();
            if (!ALLOWED_EXTENSIONS.includes(extension)) {
                addNotification({
                    message: `File type ${extension} not supported. Use ${ALLOWED_EXTENSIONS.join(', ')}`,
                    type: 'warning'
                });
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                addNotification({
                    message: `File ${file.name} exceeds 10MB limit.`,
                    type: 'warning'
                });
                continue;
            }
            validFiles.push(file);
        }

        const newFiles: AttachedFile[] = validFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            title: file.name,
            uploading: false
        }));
        setAttachedFiles(prev => [...prev, ...newFiles]);

        if (validFiles.length > 0) {
            addNotification({ message: `Attached ${validFiles.length} file(s).`, type: 'success' });
        }
    };

    const removeFile = (id: string) => {
        setAttachedFiles(prev => prev.filter(f => f.id !== id));
    };

    const chatStatus = useMemo(() => {
        if (streamState.isStreaming) return 'TYPING';
        if (historyLoading) return 'THINKING';
        return 'READY';
    }, [streamState.isStreaming, historyLoading]);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#fafafa] relative overflow-hidden group/chat">
            {/* Atmosphere Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[100px] -mr-[10vw] -mt-[10vw] opacity-40" />
                <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] bg-secondary/10 rounded-full blur-[80px] -ml-[5vw] -mb-[5vw] opacity-30" />
            </div>

            {/* Header / Sub-nav Area */}
            <div className="px-6 py-3 bg-white/40 backdrop-blur-xl border-b border-neutral-gray/10 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-ink font-display">
                        Neural Channel 1.0
                    </span>
                </div>

                <HanachanStatus status={chatStatus} />

                <div className="hidden md:flex items-center gap-4">
                    <div className="text-[9px] font-black uppercase tracking-widest text-neutral-ink">
                        Protocol: Sakura-V1
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden flex flex-col z-10">
                {messages.length === 0 && !historyLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">
                        <WelcomeCard
                            onSuggestionClick={(s) => handleSend(s)}
                            isGuest={isGuest}
                        />
                        {isGuest && (
                            <div className="mt-8 w-full max-w-lg">
                                <InformativeLoginCard
                                    title="Synchronize Your Journey"
                                    description="Log in to preserve your neural history and unlock advanced Hanachan analysis across all modules."
                                    icon={Brain}
                                    benefits={[
                                        "Unlimited Neural History",
                                        "Personalized Learning Metrics",
                                        "Artifact Cloud Synchronization",
                                        "Priority AI Processing"
                                    ]}
                                    flowType="CHAT"
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <VirtualizedMessageList
                        messages={messages}
                        isLoading={streamState.isStreaming}
                        onOpenArtifact={openArtifact}
                    />
                )}
            </div>

            {/* Footer / Input Area */}
            <div className="relative z-20">
                <ChatInput
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={() => handleSend()}
                    onFileSelect={handleFileUpload}
                    attachedFiles={attachedFiles}
                    onRemoveAttachment={removeFile}
                    isLoading={streamState.isStreaming}
                    placeholder={isGuest ? "Ask Hanachan anything..." : "Synchronize your thoughts..."}
                />
            </div>

            {/* Resource Modal */}
            {stagedResourceToProcess && (
                <ResourcePreviewModal
                    resource={stagedResourceToProcess as any}
                    isOpen={!!stagedResourceToProcess}
                    onClose={closeResourcePreview}
                    onAddToChat={() => {
                        const res = stagedResourceToProcess;
                        consumeStagedResource();
                        handleSend(`Please analyze this ${res.type}: ${res.title}`);
                    }}
                />
            )}
        </div>
    );
}
