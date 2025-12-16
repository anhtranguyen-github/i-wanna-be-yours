import React, { useRef, useEffect } from 'react';
import { Conversation, Message, Resource, Artifact } from '@/types/aiTutorTypes';
import { Brain, Menu, MessageSquare, Paperclip, Send, X, FileText, Link as LinkIcon, StickyNote } from 'lucide-react';
import { AIResponseDisplay } from "@/components/AIResponseDisplay";
import { ArtifactRenderer } from "@/components/ai-tutor/ArtifactRenderer";

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

    // Auto-scroll logic (keeping simple ref scroll for now on new messages if needed, but user asked to remove "jump" so purely relying on CSS overflow handling for now is safer, or manual scroll).
    // The previous request removed the auto-scroll on change. I will keep it removed.

    const renderResourceIcon = (type: string) => {
        switch (type) {
            case 'note': return <StickyNote size={14} className="text-brand-dark" />;
            case 'link': return <LinkIcon size={14} className="text-brand-dark" />;
            case 'document': return <FileText size={14} className="text-brand-dark" />;
            default: return <FileText size={14} />;
        }
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 relative bg-brand-cream/30">
            {/* Header */}
            <div className="h-16 px-6 border-b-2 border-brand-dark bg-white flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className={`p-2 hover:bg-brand-dark/5 rounded-xl lg:hidden ${sidebarOpen ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                        <Menu size={20} className="text-brand-dark" />
                    </button>

                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center border border-brand-dark">
                            <Brain className="text-brand-dark" size={16} />
                        </div>
                        <div>
                            <h1 className="font-extrabold text-lg text-brand-dark dark:text-white truncate leading-tight">
                                {activeConvo?.title || "New Chat"}
                            </h1>
                            {isStreaming && <span className="text-xs font-bold text-brand-blue animate-pulse">Typing...</span>}
                        </div>

                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <label className="flex items-center gap-2 cursor-pointer select-none bg-brand-cream px-3 py-1.5 rounded-xl border-2 border-brand-dark/20 hover:border-brand-dark transition-all">
                        <input
                            type="checkbox"
                            checked={isThinking}
                            onChange={(e) => setIsThinking(e.target.checked)}
                            className="rounded text-brand-blue focus:ring-0 border-brand-dark border-2 w-4 h-4"
                        />
                        <span className="text-xs font-bold text-brand-dark">Thinking Mode</span>
                    </label>

                    <button
                        onClick={() => setResourcesOpen(!resourcesOpen)}
                        className={`p-2 hover:bg-brand-blue/10 rounded-xl border-2 transition-all text-brand-dark ${resourcesOpen ? 'bg-brand-blue/20 border-brand-dark' : 'border-transparent'}`}
                    >
                        <Paperclip size={20} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-brand-dark/40 p-4 text-center">
                        <div className="p-8 bg-white rounded-full border-2 border-brand-dark/10 mb-4 shadow-sm">
                            <MessageSquare size={48} className="opacity-30" />
                        </div>
                        <p className="font-bold text-lg">Start a new conversation</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-5 relative shadow-sm border-2 ${msg.role === 'user'
                                ? 'bg-white border-brand-dark text-brand-dark rounded-br-none'
                                : 'bg-brand-cream border-brand-dark/20 text-brand-dark dark:bg-gray-800 dark:text-gray-200 rounded-bl-none'
                                }`}>
                                <div className="text-base leading-relaxed font-medium">
                                    {msg.role === 'ai' ? (
                                        <AIResponseDisplay text={msg.text} />
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            </div>

                            {/* Render Artifacts for AI Messages */}
                            {msg.role === 'ai' && msg.artifacts && msg.artifacts.length > 0 && (
                                <div className="mt-3 space-y-3 max-w-[85%] w-full">
                                    {msg.artifacts.map((artifact, artIdx) => (
                                        <ArtifactRenderer
                                            key={artIdx}
                                            artifact={artifact}
                                            onSave={(a) => console.log('Save artifact:', a)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-white border-t-2 border-brand-dark/20">
                <div className="max-w-4xl mx-auto">
                    {selectedResources.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {selectedResources.map(id => {
                                const r = resources.find(res => res._id === id);
                                if (!r) return null;
                                return (
                                    <span key={id} className="flex items-center gap-1.5 text-xs font-bold bg-brand-cream border border-brand-dark/30 px-3 py-1.5 rounded-lg">
                                        {renderResourceIcon(r.type)}
                                        <span className="truncate max-w-[150px]">{r.title}</span>
                                        <button onClick={() => setSelectedResources(selectedResources.filter(x => x !== id))} className="hover:text-red-500 ml-1"><X size={14} /></button>
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    <form onSubmit={onSendMessage} className="relative flex items-end gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                className="w-full pl-5 pr-12 py-4 border-2 border-brand-dark/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-dark bg-brand-cream/20 placeholder-brand-dark/30 font-medium text-brand-dark transition-all text-base shadow-inner"
                                disabled={isStreaming}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={(!input.trim() && selectedResources.length === 0) || isStreaming}
                            className="p-4 bg-brand-green text-brand-dark rounded-2xl border-2 border-brand-dark shadow-hard-sm hover:translate-y-[1px] hover:shadow-sm active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex-shrink-0"
                        >
                            <Send size={20} strokeWidth={3} />
                        </button>
                    </form>
                    <div className="text-center mt-2">
                        <p className="text-[10px] font-bold text-brand-dark/30 uppercase tracking-widest">AI Tutor</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
