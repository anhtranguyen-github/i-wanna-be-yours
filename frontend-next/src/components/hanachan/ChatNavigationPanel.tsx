"use client";

import { useState } from "react";
import { Plus, Search, MessageCircle, FileText, ChevronDown, ChevronRight, Hash, ChevronLeft } from "lucide-react";
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
            fixed left-28 top-4 bottom-4 bg-white rounded-r-3xl rounded-l-none shadow-clay border-2 border-l-0 border-white z-40 flex flex-col overflow-hidden
            transition-all duration-300 ease-in-out
            ${isOpen ? 'w-72 translate-x-0 opacity-100' : 'w-0 -translate-x-10 opacity-0 pointer-events-none border-0'}
        `}>
            {/* Header / New Chat */}
            <div className="mb-6 flex-shrink-0 p-4 pb-0 flex gap-2">
                <button
                    onClick={onNewChat}
                    className="flex-1 py-3 px-4 bg-brand-salmon text-white font-bold rounded-xl shadow-clay-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={20} />
                    <span>New Chat</span>
                </button>
                <button
                    onClick={onClose}
                    className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-brand-dark transition-colors"
                    title="Collapse Sidebar"
                >
                    <ChevronLeft size={20} />
                </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 px-4 pb-4">

                {/* Chat History Section */}
                <div className="flex flex-col">
                    <div
                        className="flex items-center justify-between cursor-pointer mb-2 text-brand-dark p-2 hover:bg-slate-50 rounded-lg transition-colors sticky top-0 bg-white z-10"
                        onClick={() => setHistoryOpen(!historyOpen)}
                    >
                        <span className="font-bold flex items-center gap-2">
                            <MessageCircle size={18} className="text-brand-salmon" />
                            Chat History
                        </span>
                        {historyOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>

                    {historyOpen && (
                        <div className="flex flex-col gap-2">
                            <div className="relative mb-2">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-brand-salmon/50 outline-none transition-all placeholder:text-gray-400 text-brand-dark"
                                />
                            </div>

                            <div className="flex flex-col gap-1 pr-1">
                                {filteredHistory.length === 0 ? (
                                    <div className="text-xs text-center text-gray-400 py-4">No history found</div>
                                ) : (
                                    filteredHistory.map((conv) => (
                                        <div
                                            key={conv.id}
                                            onClick={() => onSelectConversation(conv.id)}
                                            className={`
                                                p-3 rounded-xl text-sm font-medium cursor-pointer transition-all border border-transparent
                                                ${activeSessionId === conv.id
                                                    ? 'bg-brand-surface text-brand-dark border-brand-green/20 shadow-sm'
                                                    : 'text-gray-600 hover:bg-slate-50 hover:text-brand-dark'
                                                }
                                            `}
                                        >
                                            <div className="truncate">{conv.title}</div>
                                            <div className="text-[10px] opacity-60 mt-1 flex items-center gap-1">
                                                <Hash size={10} />
                                                {conv.id.slice(0, 8)}...
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Resources Section */}
                <div className="flex flex-col border-t border-slate-100 pt-4">
                    <div
                        className="flex items-center justify-between cursor-pointer mb-2 text-brand-dark p-2 hover:bg-slate-50 rounded-lg transition-colors sticky top-0 bg-white z-10"
                        onClick={() => setResourcesOpen(!resourcesOpen)}
                    >
                        <span className="font-bold flex items-center gap-2">
                            <FileText size={18} className="text-brand-sky" />
                            Resources
                        </span>
                        {resourcesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>

                    {resourcesOpen && (
                        <div className="flex flex-col gap-2">
                            <div className="relative mb-2">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={resourceSearch}
                                    onChange={(e) => setResourceSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-brand-sky/50 outline-none transition-all placeholder:text-gray-400 text-brand-dark"
                                />
                            </div>
                            <div className="text-xs text-center text-gray-400 py-4">No resources found</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
