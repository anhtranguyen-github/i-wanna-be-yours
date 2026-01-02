"use client";

import React, { useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    useChatLayout,
    ChatInput,
    WelcomeCard,
    VirtualizedMessageList,
    ChatMessage
} from '@/components/chat';
import { useChatConversation } from '@/components/chat/ChatConversationContext';
import { useUser } from '@/context/UserContext';
import { useGlobalAuth } from '@/context/GlobalAuthContext';
import { Message } from '@/types/aiTutorTypes';
import {
    useChatStream,
    useConversation,
    useArtifactsMutate,
    useChatComposer,
    useIngestionStatus
} from '@/hooks';
import { ResourcePreviewModal } from '@/components/resources/ResourcePreviewModal';
import { HanachanStatus } from './HanachanStatus';
import { InformativeLoginCard } from '@/components/shared/InformativeLoginCard';
import { useNotification } from '@/context/NotificationContext';
import { Brain } from 'lucide-react';

interface ChatMainAreaProps {
    conversationId?: string;
}

export function ChatMainArea({ conversationId: conversationIdProp }: ChatMainAreaProps) {
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { addNotification } = useNotification();
    const isGuest = !user;
    const initialMessageProcessed = useRef(false);

    // 1. Context & Layout
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
        closeResourcePreview
    } = useChatLayout();

    const mutateArtifacts = useArtifactsMutate();

    // 2. Data Layer (SWR)
    const {
        messages: historyMessages,
        isLoading: historyLoading,
        mutateMessages
    } = useConversation(conversationIdProp);

    // 3. Streaming Logic
    const { streamState, sendMessage: streamMessage } = useChatStream({
        onConversationCreated: (id) => {
            setEffectiveConversationId(id);
            router.replace(`/chat/${id}`, { scroll: false });
        },
        onArtifactsReceived: (artifacts, convoId) => {
            mutateArtifacts(convoId);
        },
        onMessageComplete: async (finalMsg) => {
            // Commit final message to SWR cache
            try {
                const msgForCache: Message = {
                    ...finalMsg,
                    timestamp: finalMsg.timestamp.getTime()
                };

                await mutateMessages((current) => {
                    // Avoid duplicating if simpler sync happened
                    if (current.some(m => m.id === msgForCache.id)) return current;
                    return [...current, msgForCache];
                }, false);
            } catch (e) {
                console.error("Failed to commit stream message", e);
            }
        }
    });

    // 4. Composer Logic (Input & Files)
    const {
        inputValue,
        setInputValue,
        attachedFiles,
        handleFileUpload,
        removeFile,
        reset: resetComposer
    } = useChatComposer({
        conversationId: conversationIdProp || 'new',
        isGuest,
        onAuthRequired: () => openAuth('LOGIN', { flowType: 'CHAT', title: 'Upload File' })
    });

    // 5. File Ingestion Polling
    const activeFileIds = useMemo(() =>
        attachedFiles
            .filter(f => f.backendId && f.ingestionStatus !== 'completed' && f.ingestionStatus !== 'failed')
            .map(f => f.backendId!),
        [attachedFiles]);

    const { statuses } = useIngestionStatus(activeFileIds);

    // Merge polled statuses into display files
    const displayFiles = useMemo(() => {
        return attachedFiles.map(f => {
            if (f.backendId && statuses[f.backendId]) {
                return { ...f, ingestionStatus: statuses[f.backendId] };
            }
            return f;
        });
    }, [attachedFiles, statuses]);

    // 6. Sync Conversation ID (Legacy requirement)
    useEffect(() => {
        if (conversationIdProp) {
            setEffectiveConversationId(conversationIdProp);
        } else {
            setEffectiveConversationId(null);
            setSessionId(null);
        }
    }, [conversationIdProp, setEffectiveConversationId, setSessionId]);


    // 7. Message Sending Logic
    const handleSend = async (overrideInput?: string) => {
        const text = overrideInput !== undefined ? overrideInput : inputValue;

        if (isGuest) {
            openAuth('LOGIN', { flowType: 'CHAT', title: 'Neural Synchronization' });
            return;
        }

        // Wait for uploads?
        const pendingUploads = displayFiles.some(f => f.uploading || (f.backendId && f.ingestionStatus === 'processing'));
        if (pendingUploads && !overrideInput) {
            // Advanced: You could block or warn. 
            // For now, we allow sending but warn if strictly uploading.
            if (displayFiles.some(f => f.uploading)) {
                addNotification({ message: "Please wait for uploads to finish", type: "warning" });
                return;
            }
        }

        if ((!text.trim() && displayFiles.length === 0) || streamState.isStreaming) return;

        // Optimistic User Message
        const userMsgForCache: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: Date.now(),
            attachments: displayFiles.map(f => ({
                id: f.id,
                title: f.title,
                type: f.file?.type.startsWith('image/') ? 'image' : 'file',
                size: f.file?.size
            }))
        };

        // 1. Mutate SWR
        await mutateMessages((prev) => [...prev, userMsgForCache], false);

        // 2. Reset Input
        resetComposer();

        // 3. Trigger Stream
        const resourceIds = displayFiles
            .map(f => f.backendId)
            .filter((id): id is string => !!id);

        try {
            await streamMessage(
                text,
                effectiveConversationId,
                sessionId || `temp-${Date.now()}`,
                resourceIds
            );
        } catch (error) {
            console.error("Send failed", error);
            addNotification({ message: "Failed to send message", type: "error" });
            // Optionally rollback SWR mutation here
        }
    };

    // 8. Auto-send from URL
    useEffect(() => {
        const initialMessage = searchParams.get('message');
        if (initialMessage && !initialMessageProcessed.current && !streamState.isStreaming && !historyLoading) {
            initialMessageProcessed.current = true;
            if (user) {
                handleSend(initialMessage);
            } else {
                setInputValue(initialMessage);
            }
        }
    }, [searchParams, user, streamState.isStreaming, historyLoading]);


    // 9. Computed Display Messages
    const displayMessages = useMemo(() => {
        try {
            const base = historyMessages || [];

            // Filter legacy/broken messages if necessary (try/catch safety)
            const safeBase: ChatMessage[] = base
                .filter(m => m && m.content !== undefined)
                .map(m => ({
                    ...m,
                    timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
                    // Ensure compatibility
                } as ChatMessage));

            if (streamState.isStreaming && streamState.currentText) {
                const streamingMsg: ChatMessage = {
                    id: 'streaming-assistant',
                    role: 'assistant',
                    content: streamState.currentText,
                    timestamp: new Date(),
                    // Attach artifact markers if needed
                };
                return [...safeBase, streamingMsg];
            }

            return safeBase;
        } catch (e) {
            console.error("Error processing messages", e);
            return [];
        }
    }, [historyMessages, streamState]);

    const chatStatus = useMemo(() => {
        if (streamState.isStreaming) return 'TYPING';
        if (historyLoading) return 'THINKING';
        return 'READY';
    }, [streamState.isStreaming, historyLoading]);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#fafafa] relative overflow-hidden group/chat">
            {/* Atmosphere Background (Preserved Layout) */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[100px] -mr-[10vw] -mt-[10vw] opacity-40" />
                <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] bg-secondary/10 rounded-full blur-[80px] -ml-[5vw] -mb-[5vw] opacity-30" />
            </div>

            {/* Header */}
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

            {/* Messages Area */}
            <div className="flex-1 relative overflow-hidden flex flex-col z-10">
                {displayMessages.length === 0 && !historyLoading ? (
                    <div className="flex-1 w-full overflow-y-auto">
                        <div className="min-h-full flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">
                            <WelcomeCard onSuggestionClick={handleSend} isGuest={isGuest} />
                            {isGuest && (
                                <div className="mt-8 w-full max-w-lg">
                                    <InformativeLoginCard
                                        title="Synchronize Your Journey"
                                        description="Log in to preserve your neural history and unlock advanced Hanachan analysis."
                                        icon={Brain}
                                        benefits={["Unlimited Neural History", "Personalized Metrics", "Artifact Cloud Sync", "Priority Processing"]}
                                        flowType="CHAT"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <VirtualizedMessageList
                        messages={displayMessages}
                        isLoading={streamState.isStreaming && !streamState.currentText}
                        onOpenArtifact={openArtifact}
                    />
                )}
            </div>

            {/* Input Area */}
            <div className="relative z-20">
                <ChatInput
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={() => handleSend()}
                    onQuickAction={(type) => {
                        if (isGuest) {
                            openAuth('LOGIN', { flowType: 'CHAT', title: `Create ${type}` });
                            return;
                        }
                        handleSend(`Please generate a ${type} based on our conversation.`);
                    }}
                    onFileSelect={handleFileUpload}
                    attachedFiles={displayFiles}
                    onRemoveAttachment={removeFile}
                    isLoading={streamState.isStreaming}
                    isGuest={isGuest}
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
