"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useChatLayout } from './ChatLayoutContext';
import {
    MessageCircle,
    Plus,
    Search,
    FolderOpen,
    ChevronLeft,
    ChevronRight,
    Wrench,
    Gamepad2,
    Library,
    BookOpen,
    CalendarDays,
    GraduationCap,
    MoreHorizontal
} from 'lucide-react';

interface ChatItem {
    id: string;
    title: string;
    preview: string;
    timestamp: string;
}

// Mock data for conversations
const mockChats: ChatItem[] = [
    { id: '1', title: 'N5 Grammar Practice', preview: 'Please teach me about です and ます...', timestamp: '2 min ago' },
    { id: '2', title: 'Kanji Study Session', preview: 'Can you explain the radical for...', timestamp: '1 hour ago' },
    { id: '3', title: 'Vocabulary Review', preview: 'I need help with JLPT N4 words...', timestamp: 'Yesterday' },
    { id: '4', title: 'Reading Comprehension', preview: 'Let\'s analyze this passage...', timestamp: '2 days ago' },
];

export function ChatLeftSidebar() {
    const { leftSidebar, toggleLeftSidebar } = useChatLayout();
    const [searchQuery, setSearchQuery] = useState('');

    const isExpanded = leftSidebar === 'expanded';

    const filteredChats = mockChats.filter(chat =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
                {isExpanded ? (
                    <>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center text-white text-lg">
                                🌸
                            </div>
                            <span className="font-display font-bold text-brand-dark">Hanachan</span>
                        </div>
                        <button
                            onClick={toggleLeftSidebar}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                            title="Collapse sidebar"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={toggleLeftSidebar}
                        className="w-full flex justify-center p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                        title="Expand sidebar"
                    >
                        <ChevronRight size={18} />
                    </button>
                )}
            </div>

            {/* New Chat Button */}
            <div className="p-3">
                {isExpanded ? (
                    <Link
                        href="/chat"
                        className="flex items-center gap-2 w-full px-3 py-2.5 bg-brand-green text-white rounded-xl font-semibold hover:bg-brand-green/90 transition-colors"
                    >
                        <Plus size={18} />
                        <span>New Chat</span>
                    </Link>
                ) : (
                    <Link
                        href="/chat"
                        className="flex items-center justify-center w-10 h-10 mx-auto bg-brand-green text-white rounded-xl hover:bg-brand-green/90 transition-colors"
                        title="New Chat"
                    >
                        <Plus size={20} />
                    </Link>
                )}
            </div>

            {/* Search */}
            {isExpanded && (
                <div className="px-3 pb-3">
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
            <div className="flex-1 overflow-y-auto px-2">
                {isExpanded ? (
                    <div className="space-y-1">
                        {filteredChats.map(chat => (
                            <Link
                                key={chat.id}
                                href={`/chat/${chat.id}`}
                                className="block p-2.5 rounded-xl hover:bg-slate-50 group transition-colors"
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
                    <div className="flex flex-col items-center gap-2 pt-2">
                        {filteredChats.slice(0, 5).map(chat => (
                            <Link
                                key={chat.id}
                                href={`/chat/${chat.id}`}
                                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-green transition-colors"
                                title={chat.title}
                            >
                                <MessageCircle size={18} />
                            </Link>
                        ))}
                        <button
                            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
                            title="More chats"
                        >
                            <MoreHorizontal size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <div className="border-t border-slate-100 p-2">
                {isExpanded ? (
                    <div className="grid grid-cols-3 gap-1">
                        <NavButton icon={<Wrench size={18} />} label="Tools" href="/tools" />
                        <NavButton icon={<Gamepad2 size={18} />} label="Games" href="/game" />
                        <NavButton icon={<Library size={18} />} label="Library" href="/library" />
                        <NavButton icon={<BookOpen size={18} />} label="Knowledge" href="/knowledge-base" />
                        <NavButton icon={<CalendarDays size={18} />} label="Plan" href="/study-plan" />
                        <NavButton icon={<GraduationCap size={18} />} label="Practice" href="/practice" />
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-1">
                        <NavButton icon={<Wrench size={18} />} href="/tools" collapsed />
                        <NavButton icon={<Gamepad2 size={18} />} href="/game" collapsed />
                        <NavButton icon={<Library size={18} />} href="/library" collapsed />
                        <NavButton icon={<BookOpen size={18} />} href="/knowledge-base" collapsed />
                        <NavButton icon={<CalendarDays size={18} />} href="/study-plan" collapsed />
                        <NavButton icon={<GraduationCap size={18} />} href="/practice" collapsed />
                    </div>
                )}
            </div>
        </div>
    );
}

interface NavButtonProps {
    icon: React.ReactNode;
    label?: string;
    href: string;
    collapsed?: boolean;
}

function NavButton({ icon, label, href, collapsed }: NavButtonProps) {
    return (
        <Link
            href={href}
            className={`
                flex items-center justify-center gap-1 rounded-lg text-slate-400 
                hover:bg-slate-100 hover:text-brand-green transition-colors
                ${collapsed ? 'w-10 h-10' : 'flex-col py-2'}
            `}
            title={label}
        >
            {icon}
            {!collapsed && label && (
                <span className="text-[10px] font-medium">{label}</span>
            )}
        </Link>
    );
}
