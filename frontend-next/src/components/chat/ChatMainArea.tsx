"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useChatLayout } from './ChatLayoutContext';
import { useUser } from '@/context/UserContext';
import { useGlobalAuth } from '@/context/GlobalAuthContext';
import { useSWRConfig } from 'swr';
import {
    Send,
    Sparkles,
    Paperclip,
    Mic,
    MoreHorizontal,
    User,
    Bot,
    Copy,
    ThumbsUp,
    ThumbsDown,
    RefreshCw,
    FileText,
    CheckSquare,
    GraduationCap,
    Crown,
    Lock,
    X,
    Loader2
} from 'lucide-react';
import { ResourcePreviewModal } from '@/components/resources/ResourcePreviewModal';
import { aiTutorService } from '@/services/aiTutorService';
import { Artifact, ArtifactType } from '@/types/artifact';
import { Layers } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    artifacts?: Artifact[];
}

interface AttachedFile {
    id: string;
    file?: File;
    uploading: boolean;
    error?: boolean;
    backendId?: string;
    title: string;
}

// Welcome card for new chat
function WelcomeCard({ isGuest }: { isGuest: boolean }) {
    const suggestions = [
        "Teach me basic Japanese greetings",
        "Explain the difference between は and が",
        "Create flashcards for N5 vocabulary",
        "Help me practice verb conjugations",
    ];

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center max-w-md">
                {/* Logo */}
                <div className="w-16 h-16 bg-gradient-to-br from-brand-green to-brand-green/70 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                    🌸
                </div>

                <h1 className="text-2xl font-display font-bold text-brand-dark mb-2">
                    Welcome to Hanachan
                </h1>
                <p className="text-slate-500 mb-8">
                    Your AI-powered Japanese learning companion
                </p>

                {/* Suggestion Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suggestions.map((suggestion, idx) => (
                        <button
                            key={idx}
                            className="p-3 text-left text-sm bg-slate-50 hover:bg-brand-green/10 rounded-xl border border-slate-200 hover:border-brand-green/30 transition-colors group"
                        >
                            <Sparkles size={14} className="text-brand-green mb-1" />
                            <span className="text-slate-600 group-hover:text-brand-dark transition-colors">
                                {suggestion}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Message bubble component
function MessageBubble({ message, onOpenArtifact }: { message: Message; onOpenArtifact: (a: Artifact) => void }) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                ${isUser ? 'bg-brand-peach' : 'bg-brand-green'}
            `}>
                {isUser ? (
                    <User size={16} className="text-white" />
                ) : (
                    <span className="text-sm">🌸</span>
                )}
            </div>

            {/* Message Content */}
            <div className={`flex-1 max-w-[80%] ${isUser ? 'flex flex-col items-end' : ''}`}>
                <div className={`
                    px-4 py-3 rounded-2xl
                    ${isUser
                        ? 'bg-brand-green text-white rounded-tr-md'
                        : 'bg-slate-50 text-brand-dark rounded-tl-md'
                    }
                `}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Artifact Cards */}
                {message.artifacts && message.artifacts.length > 0 && (
                    <div className="mt-3 space-y-2 w-full max-w-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Generated Content</p>
                        {message.artifacts.map((artifact) => (
                            <button
                                key={artifact.id}
                                onClick={() => onOpenArtifact(artifact)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-brand-green/30 hover:shadow-md transition-all group text-left"
                            >
                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-brand-green/10 transition-colors">
                                    <ArtifactIconSmall type={artifact.type} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-brand-dark truncate">{artifact.title}</h4>
                                    <p className="text-xs text-slate-500 capitalize">{artifact.type.replace('_', ' ')}</p>
                                </div>
                                <div className="text-brand-green opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">
                                    OPEN
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Actions */}
                {!isUser && (
                    <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 rounded hover:bg-slate-100 text-slate-400" title="Copy">
                            <Copy size={14} />
                        </button>
                        <button className="p-1 rounded hover:bg-slate-100 text-slate-400" title="Good response">
                            <ThumbsUp size={14} />
                        </button>
                        <button className="p-1 rounded hover:bg-slate-100 text-slate-400" title="Bad response">
                            <ThumbsDown size={14} />
                        </button>
                        <button className="p-1 rounded hover:bg-slate-100 text-slate-400" title="Regenerate">
                            <RefreshCw size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function ArtifactIconSmall({ type }: { type: string }) {
    switch (type) {
        case 'flashcard': return <Layers size={18} className="text-brand-green" />;
        case 'flashcard_deck': return <Layers size={18} className="text-brand-green" />;
        case 'quiz': return <CheckSquare size={18} className="text-purple-500" />;
        case 'exam': return <GraduationCap size={18} className="text-red-500" />;
        case 'note': return <FileText size={18} className="text-blue-500" />;
        default: return <Sparkles size={18} className="text-slate-400" />;
    }
}

interface ChatMainAreaProps {
    conversationId?: string;
}

export function ChatMainArea({ conversationId }: ChatMainAreaProps) {
    const { user } = useUser();
    const isGuest = !user;
    const { openAuth } = useGlobalAuth();

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    // Local conversation ID for tracking after shallow URL update
    const [localConversationId, setLocalConversationId] = useState<string | null>(conversationId || null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Effective conversation ID: use local state (updated after first message) or prop
    const effectiveConversationId = localConversationId || conversationId;

    // Sync local conversation ID when prop changes (user navigated to different chat)
    useEffect(() => {
        if (conversationId) {
            setLocalConversationId(conversationId);
        } else {
            // User navigated to /chat (new chat)
            setLocalConversationId(null);
            setMessages([]);
            setCurrentSessionId(null);
        }
    }, [conversationId]);

    // Fetch history if conversationId is provided
    useEffect(() => {
        // Only fetch if we have a conversationId prop (not localConversationId from shallow update)
        if (conversationId && user) {
            // Normal fetch from backend
            const fetchHistory = async () => {
                setIsHistoryLoading(true);
                try {
                    const convo = await aiTutorService.getConversation(conversationId);
                    setCurrentSessionId(convo.sessionId || null);
                    const mappedMessages: Message[] = convo.messages.map(m => ({
                        id: m.id,
                        role: m.role === 'user' ? 'user' : 'assistant',
                        content: m.content,
                        timestamp: new Date(m.timestamp || Date.now()),
                        artifacts: m.artifacts
                    }));
                    setMessages(mappedMessages);
                } catch (err) {
                    console.error("Failed to fetch history:", err);
                } finally {
                    setIsHistoryLoading(false);
                }
            };
            fetchHistory();
        }
        // Note: We don't clear messages here when !conversationId - that's handled in the sync effect above
    }, [conversationId, user]);

    // Use layout context for interactions
    const {
        stagedResourceToProcess,
        consumeStagedResource,
        openArtifact,
        previewResource,
        closeResourcePreview,
        stageResource
    } = useChatLayout();

    useEffect(() => {
        console.log('[ChatMainArea] useEffect triggered, stagedResourceToProcess:', stagedResourceToProcess);
        if (stagedResourceToProcess) {
            const { id: backendId, title } = stagedResourceToProcess;
            console.log('[ChatMainArea] Processing staged resource:', backendId, title);

            // Use functional update to check current state and add if not duplicate
            setAttachedFiles(prev => {
                const isAlreadyAttached = prev.some(af => af.backendId === backendId);
                if (isAlreadyAttached) {
                    console.log('[ChatMainArea] Resource already attached, skipping');
                    return prev;
                }

                console.log('[ChatMainArea] Adding new attachment');
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

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px';
        }
    }, [inputValue]);

    const handleFiles = async (files: File[]) => {
        // Prevent duplicates by name and size
        const uniqueFiles = files.filter(file =>
            !attachedFiles.some(af => af.file.name === file.name && af.file.size === file.size)
        );

        if (uniqueFiles.length < files.length) {
            console.warn("Some duplicate files were ignored");
        }

        if (uniqueFiles.length === 0) return;

        const newAttachments = uniqueFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            title: file.name,
            uploading: true
        }));

        setAttachedFiles(prev => [...prev, ...newAttachments]);

        // Process uploads
        for (const attachment of newAttachments) {
            try {
                const response = await aiTutorService.uploadFile(attachment.file);
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

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        // Check for files
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFiles(files);
            return;
        }

        // Check for resource metadata (from sidebar)
        const resourceData = e.dataTransfer.getData('resource');
        if (resourceData) {
            try {
                const { id: backendId, title, type } = JSON.parse(resourceData);
                const isAlreadyAttached = attachedFiles.some(af => af.backendId === backendId);
                if (!isAlreadyAttached) {
                    const newAttachment: AttachedFile = {
                        id: Math.random().toString(36).substr(2, 9),
                        title: title,
                        uploading: false,
                        backendId: backendId
                    };
                    setAttachedFiles(prev => [...prev, newAttachment]);
                }
            } catch (err) {
                console.error("Failed to parse dropped resource", err);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            handleFiles(files);
            // Reset input so same file can be selected again if needed
            e.target.value = '';
        }
    };

    const removeAttachment = (id: string) => {
        setAttachedFiles(prev => prev.filter(f => f.id !== id));
    };

    const { mutate } = useSWRConfig();

    const handleSend = async () => {
        if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading) return;

        // Prevent sending if uploads are in progress
        if (attachedFiles.some(f => f.uploading)) return;

        // Gate for guests - they can stage but not commit
        if (isGuest) {
            openAuth('REGISTER', {
                title: "AI Conversation",
                description: "Sign up to chat with Hanachan and get instant feedback on your Japanese!"
            });
            return;
        }

        const validAttachments = attachedFiles.filter(f => !f.error && f.backendId);
        const resourceIds = validAttachments.map(f => f.backendId as string);

        let content = inputValue.trim();
        if (validAttachments.length > 0) {
            const fileNames = validAttachments.map(f => `[Attachment: ${f.title}]`).join('\n');
            content = content ? `${content}\n\n${fileNames}` : fileNames;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: content,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setAttachedFiles([]); // Optimistic clear
        setIsLoading(true);

        try {
            // Use existing session ID if available, else fallback
            const sessionId = currentSessionId || effectiveConversationId || `session-${Date.now()}`;

            // Use streamChat instead of simulated response
            const { reader, artifacts, conversationId: backendConvoId } = await aiTutorService.streamChat(
                inputValue.trim() || "Analyze the attached resources",
                false,
                effectiveConversationId || undefined,
                sessionId,
                resourceIds
            );

            let assistantText = "";
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "",
                timestamp: new Date(),
                artifacts: artifacts // Attach generated artifacts
            };

            setMessages(prev => [...prev, assistantMessage]);

            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                assistantText += chunk;

                setMessages(prev => prev.map(m =>
                    m.id === assistantMessage.id ? { ...m, content: assistantText } : m
                ));
            }

            // After response is complete, refresh resources sidebar
            if (user) {
                mutate(['/f-api/v1/resources', user.id]);
                // Also refresh chat history list
                mutate(['/h-api/conversations', user.id]);

                // NEW: Refresh artifacts list for the right sidebar
                const convoIdToMutate = backendConvoId || effectiveConversationId;
                if (convoIdToMutate) {
                    mutate(['artifacts', convoIdToMutate.toString()]);
                }
            }

            // If this was a new conversation, update URL without navigation
            if (backendConvoId && !conversationId) {
                // Shallow URL update - no page reload, components don't remount
                if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', `/chat/${backendConvoId}`);
                }

                // Update local conversation ID for subsequent messages
                setLocalConversationId(backendConvoId.toString());

                // Refresh left sidebar conversation history
                if (user) {
                    mutate(['/h-api/conversations', user.id]);
                }
            }

            // Note: Auto-open artifact behavior has been removed for better UX
            // Users can click on artifacts in the message bubble to view them

            // Also try refreshing the global resources if that's what sidebar uses
            mutate((key: any) => Array.isArray(key) && key[0] === '/f-api/v1/resources');

        } catch (error) {
            console.error("Chat error", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Error: Failed to connect to Hanachan AI. Please try again later.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleQuickAction = (type: ArtifactType) => {
        if (openArtifact) {
            // Mock creating a new artifact for now
            openArtifact({
                id: `new-${Date.now()}`,
                type: type,
                title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                data: {},
                metadata: {},
                createdAt: new Date().toISOString()
            });
        }
    };

    const showWelcome = messages.length === 0 && !conversationId && !isHistoryLoading;

    return (
        <div
            className="flex flex-col h-full bg-white relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={onDrop}
        >

            {/* Drag Overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 bg-brand-green/10 backdrop-blur-sm border-2 border-dashed border-brand-green flex items-center justify-center pointer-events-none">
                    <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
                        <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-green">
                            <Paperclip size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-dark">Drop files to attach</h3>
                        <p className="text-slate-500 text-sm mt-1">Upload files to chat context</p>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            {isHistoryLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <p className="text-sm font-medium">Loading conversation history...</p>
                </div>
            ) : showWelcome ? (
                <WelcomeCard isGuest={isGuest} />
            ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-4">
                    {messages.map(message => (
                        <div key={message.id} className="group">
                            <MessageBubble message={message} onOpenArtifact={openArtifact} />
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center">
                                <span className="text-sm">🌸</span>
                            </div>
                            <div className="bg-slate-50 px-4 py-3 rounded-2xl rounded-tl-md">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Input Area */}
            <div className="border-t border-slate-100 pt-4 px-4 pb-6 bg-white z-10 w-full max-w-3xl mx-auto">

                {/* Attachment Tray */}
                {attachedFiles.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto mb-3 pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {attachedFiles.map(file => (
                            <div key={file.id} className="relative flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shadow-sm min-w-[160px] max-w-[240px] group">
                                <div className="w-8 h-8 bg-white rounded-lg border border-slate-100 flex items-center justify-center flex-shrink-0">
                                    {file.file?.type.startsWith('image/') ? (
                                        <span className="text-xs">🖼️</span>
                                    ) : (
                                        <FileText size={16} className="text-slate-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-700 truncate">{file.title}</p>
                                    <p className="text-[10px] text-slate-500">
                                        {file.file ? `${(file.file.size / 1024).toFixed(1)} KB` : 'Resource'}
                                    </p>
                                </div>
                                {file.uploading ? (
                                    <div className="w-6 h-6 flex items-center justify-center">
                                        <Loader2 size={14} className="animate-spin text-brand-green" />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => removeAttachment(file.id)}
                                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="relative flex items-end gap-2 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-brand-green focus-within:ring-2 focus-within:ring-brand-green/20 transition-all">
                    {/* File Input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        multiple
                    />
                    {/* Attachment button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 text-slate-400 hover:text-brand-green transition-colors"
                        title="Attach file"
                    >
                        <Paperclip size={20} />
                    </button>

                    {/* Text input */}
                    <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Hanachan anything..."
                        rows={1}
                        className="flex-1 bg-transparent py-3 text-brand-dark placeholder:text-slate-400 resize-none focus:outline-none text-sm max-h-[200px]"
                    />

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 pr-2 pb-1.5">
                        <button
                            className="p-2 text-slate-400 hover:text-brand-green transition-colors"
                            title="Voice input"
                        >
                            <Mic size={20} />
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={(!inputValue.trim() && attachedFiles.length === 0) || isLoading || attachedFiles.some(f => f.uploading)}
                            className="p-2 bg-brand-green text-white rounded-xl hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Send message"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>

                {/* Quick Actions Toolbar (Under Chat Input Bubble) */}
                <div className="flex items-center justify-between mt-3 px-1">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleQuickAction('flashcard')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-brand-green hover:bg-brand-green/5 border border-transparent hover:border-brand-green/20 transition-all"
                        >
                            <FileText size={14} />
                            Flashcards
                        </button>
                        <button
                            onClick={() => handleQuickAction('quiz')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-purple-600 hover:bg-purple-50 border border-transparent hover:border-purple-200 transition-all"
                        >
                            <CheckSquare size={14} />
                            Quiz
                        </button>
                        <button
                            onClick={() => handleQuickAction('summary')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all"
                        >
                            <Sparkles size={14} />
                            Summary
                        </button>
                    </div>

                    <p className="text-xs text-slate-400">
                        Hanachan makes mistakes. Verify info.
                    </p>
                </div>
            </div>

            {/* Resource Preview Modal */}
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
