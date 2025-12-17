"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useChatLayout } from './ChatLayoutContext';
import { useUser } from '@/context/UserContext';
import { useAuthPrompt } from '@/components/auth/AuthPromptModal';
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
    Lock
} from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
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
function MessageBubble({ message }: { message: Message }) {
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

interface ChatMainAreaProps {
    conversationId?: string;
}

export function ChatMainArea({ conversationId }: ChatMainAreaProps) {
    const { user } = useUser();
    const isGuest = !user;
    const { showAuthPrompt, AuthPrompt } = useAuthPrompt();

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Use layout context for opening artifacts
    let openArtifact: any;
    try {
        const context = useChatLayout();
        openArtifact = context.openArtifact;
    } catch (e) {
        // Fallback if not in provider
        openArtifact = () => console.log('Open Artifact');
    }

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

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        // Gate for guests
        if (isGuest) {
            showAuthPrompt(
                "AI Conversation",
                "Sign up to chat with Hanachan and get instant feedback on your Japanese!"
            );
            return;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        // Simulate response (replace with actual API call)
        setTimeout(() => {
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `I'd be happy to help you with that! Here's what I can tell you about "${userMessage.content}"...\n\nThis is a demo response. In the real implementation, this would come from the Hanachan AI backend.`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
        }, 1000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleQuickAction = (type: string) => {
        if (openArtifact) {
            // Mock creating a new artifact for now
            openArtifact({
                id: `new-${Date.now()}`,
                type: type,
                title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`
            });
        }
    };

    const showWelcome = messages.length === 0 && !conversationId;

    return (
        <div className="flex flex-col h-full bg-white relative">
            <AuthPrompt />

            {/* Messages Area */}
            {showWelcome ? (
                <WelcomeCard isGuest={isGuest} />
            ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-4">
                    {messages.map(message => (
                        <div key={message.id} className="group">
                            <MessageBubble message={message} />
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
                <div className="relative flex items-end gap-2 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-brand-green focus-within:ring-2 focus-within:ring-brand-green/20 transition-all">
                    {/* Attachment button */}
                    <button
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
                            disabled={!inputValue.trim() || isLoading}
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
        </div>
    );
}
