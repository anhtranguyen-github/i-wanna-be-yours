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
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 lg:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`
        fixed inset-y-0 left-0 z-30 flex flex-col
        transition-transform duration-300 ease-in-out
        w-[85vw] sm:w-80 lg:relative lg:translate-x-0 lg:w-72 lg:inset-auto
        bg-brand-cream dark:bg-gray-800 border-r-2 border-brand-dark
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
                <div className="p-4 border-b-2 border-brand-dark flex justify-between items-center bg-brand-yellow/10">
                    <h2 className="font-extrabold text-xl text-brand-dark dark:text-white truncate tracking-tight">HISTORY</h2>
                    <button onClick={onClose} className="lg:hidden p-1 hover:bg-brand-dark/10 rounded"><X size={24} className="text-brand-dark" /></button>
                </div>

                <div className="p-4">
                    <button
                        onClick={onNewChat}
                        className="w-full flex items-center justify-center gap-2 bg-brand-peach hover:bg-brand-peach/80 text-brand-dark font-bold py-3 rounded-xl border-2 border-brand-dark shadow-hard-sm transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    >
                        <Plus size={20} strokeWidth={3} /> NEW CHAT
                    </button>
                </div>

                <div className="px-4 pb-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-brand-dark/50" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-700 rounded-xl border-2 border-brand-dark text-sm font-bold text-brand-dark focus:outline-none focus:ring-0 placeholder-brand-dark/30"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {['', 'Grammar', 'Vocab', 'JLPT N3', 'Conversation'].map(tag => (
                            <button
                                key={tag || 'all'}
                                onClick={() => setTagFilter(tag)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border-2 ${tagFilter === tag
                                    ? "bg-brand-blue text-brand-dark border-brand-dark shadow-hard-sm"
                                    : "bg-white text-brand-dark/70 border-brand-dark hover:bg-brand-blue/20"
                                    }`}
                            >
                                {tag || 'All'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-2 py-2">
                    {conversations.map(convo => (
                        <div
                            key={convo._id}
                            onClick={() => {
                                setActiveConvoId(convo._id);
                                // On mobile, close sidebar when selecting a chat
                                if (window.innerWidth < 1024) onClose();
                            }}
                            className={`group flex items-center justify-between p-3 cursor-pointer rounded-xl border-2 transition-all ${activeConvoId === convo._id
                                ? "bg-brand-blue/20 border-brand-dark shadow-hard-sm"
                                : "bg-transparent border-transparent hover:bg-white hover:border-brand-dark/20"}`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`p-2 rounded-lg border-2 border-brand-dark ${activeConvoId === convo._id ? "bg-brand-blue" : "bg-white"}`}>
                                    <MessageSquare size={16} className="text-brand-dark" />
                                </div>
                                <div className="truncate">
                                    <div className="text-sm font-bold text-brand-dark dark:text-gray-200 truncate">{convo.title}</div>
                                    <div className="text-xs text-brand-dark/60 font-medium truncate">{new Date(convo.updated_at).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <button
                                onClick={(e) => onDeleteChat(e, convo._id)}
                                className="lg:opacity-0 lg:group-hover:opacity-100 text-brand-dark/40 hover:text-red-500 transition-opacity p-1"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
