import React from 'react';
import { Conversation } from '@/types/aiTutorTypes';
import { MessageSquare, Plus, Search, Trash2, X } from 'lucide-react';

interface ChatSidebarProps {
    conversations: Conversation[];
    activeConvoId: string | null;
    setActiveConvoId: (id: string) => void;
    onNewChat: () => void;
    onDeleteChat: (e: React.MouseEvent, id: string) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    tagFilter: string;
    setTagFilter: (t: string) => void;

    // Mobile responsiveness
    isOpen: boolean;
    onClose: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    conversations,
    activeConvoId,
    setActiveConvoId,
    onNewChat,
    onDeleteChat,
    searchQuery,
    setSearchQuery,
    tagFilter,
    setTagFilter,
    isOpen,
    onClose
}) => {
    return (
        <div className="flex flex-col h-full bg-brand-cream dark:bg-gray-800 relative">

            {/* Header / New Chat */}
            <div className="p-4 border-b-2 border-brand-dark bg-white">
                <div className="flex justify-between items-center mb-3 text-brand-dark lg:hidden">
                    <h2 className="font-extrabold text-xl">HISTORY</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 bg-brand-peach hover:bg-brand-peach/80 text-brand-dark font-extrabold py-3 rounded-2xl border-2 border-brand-dark shadow-hard-sm hover:translate-y-[1px] hover:shadow-sm active:translate-y-[2px] active:shadow-none transition-all"
                >
                    <Plus size={22} strokeWidth={3} /> NEW CHAT
                </button>
            </div>

            {/* Search & Filter */}
            <div className="p-4 space-y-3 border-b-2 border-brand-dark bg-brand-cream/50">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-brand-dark/50" size={18} />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-700 rounded-xl border-2 border-brand-dark text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-blue/50 placeholder-brand-dark/30"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex bg-white rounded-xl border-2 border-brand-dark overflow-hidden p-1 gap-1">
                    {['', 'Grammar', 'Vocab'].map((tag, idx) => (
                        <button
                            key={idx}
                            onClick={() => setTagFilter(tag)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition-all ${tagFilter === tag
                                ? "bg-brand-blue text-brand-dark shadow-sm ring-1 ring-brand-dark/10"
                                : "text-brand-dark/60 hover:bg-brand-dark/5"
                                }`}
                        >
                            {tag || 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {conversations.length === 0 ? (
                    <div className="text-center py-10 opacity-40 font-bold text-brand-dark">No conversations found</div>
                ) : (
                    conversations.map(convo => (
                        <div
                            key={convo._id}
                            onClick={() => {
                                setActiveConvoId(convo._id);
                                if (window.innerWidth < 1024) onClose();
                            }}
                            className={`group flex items-center justify-between p-3 cursor-pointer rounded-2xl border-2 transition-all ${activeConvoId === convo._id
                                ? "bg-white border-brand-dark shadow-hard-sm"
                                : "bg-transparent border-transparent hover:bg-white/50 hover:border-brand-dark/20"}`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`p-2.5 rounded-xl border-2 border-brand-dark flex-shrink-0 ${activeConvoId === convo._id ? "bg-brand-blue text-brand-dark" : "bg-white text-brand-dark/70"}`}>
                                    <MessageSquare size={18} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-extrabold text-brand-dark dark:text-gray-200 truncate pr-2">{convo.title}</div>
                                    <div className="text-xs text-brand-dark/50 font-medium truncate">{new Date(convo.updated_at).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <button
                                onClick={(e) => onDeleteChat(e, convo._id)}
                                className={`p-1.5 rounded-lg text-brand-dark/40 hover:text-red-500 hover:bg-red-50 transition-all ${activeConvoId === convo._id ? "opacity-100" : "lg:opacity-0 lg:group-hover:opacity-100"}`}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
