"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useSidebar } from './SidebarContext';
import { Plus, Search, MessageCircle, MoreHorizontal } from 'lucide-react';

interface ChatItem {
    id: string;
    title: string;
    preview: string;
    timestamp: string;
}

// Mock data - will be replaced with real data from context/API
const mockChats: ChatItem[] = [
    { id: '1', title: 'N5 Grammar Practice', preview: 'Please teach me about です and ます...', timestamp: '2 min ago' },
    { id: '2', title: 'Kanji Study Session', preview: 'Can you explain the radical for...', timestamp: '1 hour ago' },
    { id: '3', title: 'Vocabulary Review', preview: 'I need help with JLPT N4 words...', timestamp: 'Yesterday' },
    { id: '4', title: 'Reading Comprehension', preview: 'Let\'s analyze this passage...', timestamp: '2 days ago' },
];

export function SidebarChatPanel() {
    const { isExpanded, isOnChat } = useSidebar();
    const [searchQuery, setSearchQuery] = useState('');

    // Only show when on chat route
    if (!isOnChat) return null;

    const filteredChats = mockChats.filter(chat =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={`
            overflow-hidden transition-all duration-300 ease-out
            ${isOnChat ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0'}
        `}>
            {/* New Chat Button */}
            <div className="px-3 pt-3">
                {isExpanded ? (
                    <Link
                        href="/chat"
                        className="flex items-center gap-2 w-full px-3 py-2.5 bg-brand-green text-white rounded-xl font-semibold hover:bg-brand-green/90 transition-all duration-200 hover:scale-[1.02]"
                    >
                        <Plus size={18} />
                        <span>New Chat</span>
                    </Link>
                ) : (
                    <Link
                        href="/chat"
                        className="flex items-center justify-center w-full p-2.5 bg-brand-green text-white rounded-xl hover:bg-brand-green/90 transition-all duration-200"
                        title="New Chat"
                    >
                        <Plus size={20} />
                    </Link>
                )}
            </div>

            {/* Search - only when expanded */}
            {isExpanded && (
                <div className="px-3 pt-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                        />
                    </div>
                </div>
            )}

            {/* Chat List */}
            <div className="px-2 pt-3 pb-2 max-h-64 overflow-y-auto">
                {isExpanded ? (
                    <div className="space-y-1">
                        {filteredChats.map((chat, idx) => (
                            <Link
                                key={chat.id}
                                href={`/chat/${chat.id}`}
                                className="block p-2.5 rounded-xl hover:bg-slate-50 group transition-all duration-200"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="flex items-start gap-2">
                                    <MessageCircle size={16} className="mt-0.5 text-slate-400 group-hover:text-brand-green transition-colors flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-brand-dark truncate group-hover:text-brand-green transition-colors">
                                            {chat.title}
                                        </h4>
                                        <p className="text-xs text-slate-400 truncate mt-0.5">
                                            {chat.preview}
                                        </p>
                                        <span className="text-[10px] text-slate-300">{chat.timestamp}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-1.5">
                        {filteredChats.slice(0, 4).map(chat => (
                            <Link
                                key={chat.id}
                                href={`/chat/${chat.id}`}
                                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-green transition-colors"
                                title={chat.title}
                            >
                                <MessageCircle size={18} />
                            </Link>
                        ))}
                        {filteredChats.length > 4 && (
                            <button
                                className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
                                title="More chats"
                            >
                                <MoreHorizontal size={18} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="mx-3 border-t border-slate-100" />
        </div>
    );
}
