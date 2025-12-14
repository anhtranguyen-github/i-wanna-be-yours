"use client";

import { useState } from "react";
import { Plus, Search, MessageCircle, FileText, ChevronDown, ChevronRight, Hash, ChevronLeft, Clock } from "lucide-react";
import { Conversation, Resource } from "@/types/chat";

interface ChatNavigationPanelProps {
    history: Conversation[];
    resources: Resource[];
    activeSessionId: string | null;
    onNewChat: () => void;
    onSelectConversation: (id: string) => void;
    onSelectResource: (resource: Resource) => void;
    isOpen: boolean;
    onClose: () => void;
}

export default function ChatNavigationPanel({
    history,
    resources,
    activeSessionId,
    onNewChat,
    onSelectConversation,
    onSelectResource,
    isOpen,
    onClose
}: ChatNavigationPanelProps) {
    const [historyOpen, setHistoryOpen] = useState(true);
    const [resourcesOpen, setResourcesOpen] = useState(true);
    const [historySearch, setHistorySearch] = useState("");
    const [resourceSearch, setResourceSearch] = useState("");

    const filteredHistory = history.filter(h => h.title.toLowerCase().includes(historySearch.toLowerCase()));

    return (
        <div className={`
            fixed left-28 top-4 bottom-4 bg-white/95 backdrop-blur-xl rounded-r-3xl rounded-l-none shadow-xl border border-white/50 z-40 flex flex-col overflow-hidden
            transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${isOpen ? 'w-72 translate-x-0 opacity-100' : 'w-0 -translate-x-10 opacity-0 pointer-events-none border-0'}
        `}>
            {/* Gradient Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-green via-brand-peach to-brand-softBlue" />

            {/* Header / New Chat */}
            <div className="mb-4 flex-shrink-0 p-4 pb-0 pt-5 flex gap-2">
                <button
                    onClick={onNewChat}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-brand-green to-emerald-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={20} />
                    <span>New Chat</span>
                </button>
                <button
                    onClick={onClose}
                    className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-brand-dark transition-all"
                    title="Collapse Sidebar"
                >
                    <ChevronLeft size={20} />
                </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 px-4 pb-4">

                {/* Chat History Section */}
                <div className="flex flex-col">
                    <button
                        className="flex items-center justify-between cursor-pointer mb-2 text-brand-dark p-2 hover:bg-slate-50 rounded-xl transition-colors sticky top-0 bg-white/90 backdrop-blur-sm z-10"
                        onClick={() => setHistoryOpen(!historyOpen)}
                    >
                        <span className="font-bold flex items-center gap-2">
                            <MessageCircle size={18} className="text-brand-green" />
                            Chat History
                        </span>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${historyOpen ? '' : '-rotate-90'}`} />
                    </button>

                    <div className={`flex flex-col gap-2 overflow-hidden transition-all duration-300 ${historyOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="relative mb-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search chats..."
                                value={historySearch}
                                onChange={(e) => setHistorySearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-sm border border-transparent focus:border-brand-green/30 focus:ring-2 focus:ring-brand-green/20 outline-none transition-all placeholder:text-gray-400 text-brand-dark"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5 pr-1">
                            {filteredHistory.length === 0 ? (
                                <div className="text-xs text-center text-gray-400 py-6">No history found</div>
                            ) : (
                                filteredHistory.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => onSelectConversation(conv.id)}
                                        className={`
                                            p-3 rounded-xl text-sm font-medium cursor-pointer transition-all text-left w-full group
                                            ${activeSessionId === conv.id
                                                ? 'bg-gradient-to-r from-brand-green/10 to-brand-softBlue/30 text-brand-dark border border-brand-green/20 shadow-sm'
                                                : 'text-gray-600 hover:bg-slate-50 hover:text-brand-dark border border-transparent'
                                            }
                                        `}
                                    >
                                        <div className="truncate font-semibold">{conv.title}</div>
                                        <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                                            <Clock size={10} />
                                            <span>2h ago</span>
                                            <span className="mx-1">·</span>
                                            <Hash size={10} />
                                            {conv.id.slice(0, 6)}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* Resources Section */}
                <div className="flex flex-col">
                    <button
                        className="flex items-center justify-between cursor-pointer mb-2 text-brand-dark p-2 hover:bg-slate-50 rounded-xl transition-colors sticky top-0 bg-white/90 backdrop-blur-sm z-10"
                        onClick={() => setResourcesOpen(!resourcesOpen)}
                    >
                        <span className="font-bold flex items-center gap-2">
                            <FileText size={18} className="text-brand-peach" />
                            Resources
                        </span>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${resourcesOpen ? '' : '-rotate-90'}`} />
                    </button>

                    <div className={`flex flex-col gap-2 overflow-hidden transition-all duration-300 ${resourcesOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="relative mb-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search resources..."
                                value={resourceSearch}
                                onChange={(e) => setResourceSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-sm border border-transparent focus:border-brand-peach/30 focus:ring-2 focus:ring-brand-peach/20 outline-none transition-all placeholder:text-gray-400 text-brand-dark"
                            />
                        </div>

                        {resources.length === 0 ? (
                            <div className="text-xs text-center text-gray-400 py-6">No resources added</div>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                {resources.map((resource) => (
                                    <button
                                        key={resource.id}
                                        onClick={() => onSelectResource(resource)}
                                        className="p-3 rounded-xl text-sm text-left hover:bg-slate-50 transition-all group"
                                    >
                                        <div className="truncate font-medium text-slate-600 group-hover:text-brand-dark">{resource.title}</div>
                                        <div className="text-[10px] text-slate-400 mt-1 uppercase">{resource.type}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
