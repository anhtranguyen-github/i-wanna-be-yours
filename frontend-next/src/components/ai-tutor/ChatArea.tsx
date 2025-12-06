import React, { useRef, useEffect } from 'react';
import { Conversation, Message, Resource } from '@/types/aiTutorTypes';
import { Brain, Menu, MessageSquare, Paperclip, Send, X, FileText, Link as LinkIcon, StickyNote } from 'lucide-react';
import { AIResponseDisplay } from "@/components/AIResponseDisplay";

interface ChatAreaProps {
    // State
    activeConvo: Conversation | undefined;
    messages: Message[];
    input: string;
    setInput: (s: string) => void;
    isThinking: boolean;
    setIsThinking: (b: boolean) => void;
    isStreaming: boolean;

    // Resources
    resources: Resource[];
    selectedResources: string[];
    setSelectedResources: (ids: string[]) => void;

    // Layout
    sidebarOpen: boolean;
    setSidebarOpen: (b: boolean) => void;
    resourcesOpen: boolean;
    setResourcesOpen: (b: boolean) => void;

    // Actions
    onSendMessage: (e: React.FormEvent) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
    activeConvo,
    messages,
    input,
    setInput,
    isThinking,
    setIsThinking,
    isStreaming,
    resources,
    selectedResources,
    setSelectedResources,
    sidebarOpen,
    setSidebarOpen,
    resourcesOpen,
    setResourcesOpen,
    onSendMessage
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const renderResourceIcon = (type: string) => {
        switch (type) {
            case 'note': return <StickyNote size={16} className="text-yellow-500" />;
            case 'link': return <LinkIcon size={16} className="text-blue-500" />;
            case 'document': return <FileText size={16} className="text-red-500" />;
            default: return <FileText size={16} />;
        }
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 relative bg-brand-cream/50">
            {/* Header */}
            <div className="h-16 border-b-2 border-brand-dark bg-brand-cream dark:bg-gray-800 flex items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className={`p-2 hover:bg-brand-dark/5 rounded-lg border-2 border-transparent hover:border-brand-dark transition-all lg:hidden ${sidebarOpen ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                        <Menu size={20} className="text-brand-dark dark:text-gray-300" />
                    </button>

                    <div className="flex items-center gap-2 min-w-0">
                        {/* Only show brain icon on larger screens to save space on mobile */}
                        <Brain className="text-brand-blue flex-shrink-0 hidden sm:block" size={24} />
                        <h1 className="font-extrabold text-lg md:text-xl text-brand-dark dark:text-white truncate">
                            {activeConvo?.title || "AI Tutor"}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    <label className="flex items-center gap-2 text-xs md:text-sm font-bold text-brand-dark cursor-pointer select-none bg-white px-2 md:px-3 py-1.5 rounded-lg border-2 border-brand-dark shadow-sm hover:translate-y-[1px] hover:shadow-none transition-all">
                        <input
                            type="checkbox"
                            checked={isThinking}
                            onChange={(e) => setIsThinking(e.target.checked)}
                            className="rounded text-brand-blue focus:ring-brand-blue border-brand-dark border-2 w-4 h-4"
                        />
                        <span className="hidden sm:inline">Thinking Mode</span>
                        <span className="sm:hidden">Think</span>
                    </label>

                    <button
                        onClick={() => setResourcesOpen(true)}
                        className={`p-2 bg-white hover:bg-brand-blue/20 rounded-lg border-2 border-brand-dark shadow-sm transition-all text-brand-dark lg:hidden ${resourcesOpen ? 'opacity-50' : ''}`}
                        disabled={resourcesOpen} // Disable if already open on desktop, but here we are mainly handling mobile toggles
                    >
                        <Paperclip size={20} />
                    </button>
                    {/* Desktop resource toggle if needed, or just let sidebar handle it */}
                    <button
                        onClick={() => setResourcesOpen(!resourcesOpen)}
                        className="hidden lg:block p-2 bg-white hover:bg-brand-blue/20 rounded-lg border-2 border-brand-dark shadow-sm transition-all text-brand-dark"
                    >
                        <Paperclip size={20} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-transparent">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-brand-dark/40 p-4 text-center">
                        <div className="p-6 bg-white rounded-full border-4 border-brand-dark/20 mb-4 animate-bounce-slow">
                            <MessageSquare size={48} className="opacity-50" />
                        </div>
                        <p className="font-bold text-lg">Start a conversation with your AI Tutor</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 md:p-5 relative ${msg.role === 'user'
                                ? 'bg-brand-blue text-brand-dark border-2 border-brand-dark shadow-hard-sm rounded-br-none'
                                : 'bg-white dark:bg-gray-800 text-brand-dark dark:text-gray-200 border-2 border-brand-dark shadow-hard-sm rounded-bl-none'
                                }`}>
                                <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed font-medium">
                                    {msg.role === 'ai' ? (
                                        <AIResponseDisplay text={msg.text} />
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 md:p-6 bg-brand-cream border-t-2 border-brand-dark">
                {selectedResources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {selectedResources.map(id => {
                            const r = resources.find(res => res._id === id);
                            if (!r) return null;
                            return (
                                <span key={id} className="flex items-center gap-1 text-xs font-bold bg-white border-2 border-brand-dark px-2 py-1 rounded-lg shadow-sm">
                                    {renderResourceIcon(r.type)}
                                    <span className="truncate max-w-[100px] md:max-w-[150px]">{r.title}</span>
                                    <button onClick={() => setSelectedResources(selectedResources.filter(x => x !== id))} className="hover:text-red-500 ml-1"><X size={14} /></button>
                                </span>
                            );
                        })}
                    </div>
                )}
                <form onSubmit={onSendMessage} className="flex gap-2 md:gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 border-2 border-brand-dark rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-blue/30 bg-white placeholder-brand-dark/30 font-medium text-brand-dark shadow-inner text-sm md:text-base"
                        disabled={isStreaming}
                    />
                    <button
                        type="submit"
                        disabled={(!input.trim() && selectedResources.length === 0) || isStreaming}
                        className="px-4 md:px-6 py-2 bg-brand-green text-brand-dark font-extrabold rounded-xl border-2 border-brand-dark shadow-hard-sm hover:translate-y-[1px] hover:shadow-sm active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center"
                    >
                        <Send size={22} strokeWidth={3} />
                    </button>
                </form>
            </div>
        </div>
    );
};
