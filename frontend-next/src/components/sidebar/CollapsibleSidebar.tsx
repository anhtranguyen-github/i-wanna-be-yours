"use client";

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    ChevronsLeft,
    ChevronsRight,
    Plus,
    Search,
    MessageCircle,
    FolderOpen,
    Settings,
    User,
    HelpCircle,
    Moon,
    LogOut
} from 'lucide-react';

// Width constants
const SIDEBAR_WIDTHS = {
    collapsed: 64,
    expanded: 280,
} as const;

// Mock chat history data
const mockChats = [
    { id: '1', title: 'JLPT N3 Grammar Help', date: 'Today' },
    { id: '2', title: '漢字 Practice Session', date: 'Today' },
    { id: '3', title: 'Verb Conjugation Q&A', date: 'Yesterday' },
    { id: '4', title: 'Reading Comprehension', date: 'Yesterday' },
];

// Mock resources data
const mockResources = [
    { id: 'r1', title: 'N3 Vocabulary List', type: 'flashcard' },
    { id: 'r2', title: 'Grammar Notes', type: 'document' },
    { id: 'r3', title: 'Kanji Study Set', type: 'flashcard' },
];

interface CollapsibleSidebarProps {
    className?: string;
}

export function CollapsibleSidebar({ className = '' }: CollapsibleSidebarProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [chatSearch, setChatSearch] = useState('');
    const [resourceSearch, setResourceSearch] = useState('');
    const pathname = usePathname();

    const toggle = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    const width = isExpanded ? SIDEBAR_WIDTHS.expanded : SIDEBAR_WIDTHS.collapsed;

    // Filter chats based on search
    const filteredChats = mockChats.filter(chat =>
        chat.title.toLowerCase().includes(chatSearch.toLowerCase())
    );

    // Filter resources based on search
    const filteredResources = mockResources.filter(resource =>
        resource.title.toLowerCase().includes(resourceSearch.toLowerCase())
    );

    return (
        <aside
            className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-out ${className}`}
            style={{ width }}
        >
            {/* ===== HEADER SECTION ===== */}
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
                {isExpanded ? (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🌸</span>
                            <span className="font-display font-bold text-brand-dark">Hanabira</span>
                        </div>
                        <button
                            onClick={toggle}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                            aria-label="Collapse sidebar"
                        >
                            <ChevronsLeft size={18} />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={toggle}
                        className="w-full p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors flex justify-center"
                        aria-label="Expand sidebar"
                    >
                        <ChevronsRight size={18} />
                    </button>
                )}
            </div>

            {/* ===== NEW CHAT BUTTON ===== */}
            <div className="p-3">
                {isExpanded ? (
                    <Link
                        href="/chat"
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-brand-green text-white font-semibold rounded-xl hover:bg-brand-green/90 transition-colors"
                    >
                        <Plus size={18} />
                        New Chat
                    </Link>
                ) : (
                    <Link
                        href="/chat"
                        className="flex items-center justify-center w-full py-2.5 bg-brand-green text-white rounded-xl hover:bg-brand-green/90 transition-colors"
                        title="New Chat"
                    >
                        <Plus size={18} />
                    </Link>
                )}
            </div>

            {/* ===== CHAT SEARCH & LIST ===== */}
            {isExpanded && (
                <div className="px-3 pb-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={chatSearch}
                            onChange={(e) => setChatSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
                        />
                    </div>
                </div>
            )}

            {/* Chat List */}
            <div className={`flex-1 overflow-y-auto ${isExpanded ? 'px-2' : 'px-1'}`}>
                {isExpanded ? (
                    <div className="space-y-1">
                        {filteredChats.map(chat => (
                            <Link
                                key={chat.id}
                                href={`/chat/${chat.id}`}
                                className="block p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                            >
                                <p className="text-sm font-medium text-slate-700 truncate group-hover:text-brand-dark">
                                    {chat.title}
                                </p>
                                <p className="text-xs text-slate-400">{chat.date}</p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-2 space-y-2">
                        <Link
                            href="/chat"
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-brand-green transition-colors"
                            title="Chats"
                        >
                            <MessageCircle size={20} />
                        </Link>
                    </div>
                )}
            </div>

            {/* ===== RESOURCES SECTION ===== */}
            <div className="border-t border-slate-100">
                {isExpanded ? (
                    <div className="p-3">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Resources
                        </h3>
                        <div className="relative mb-2">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search resources..."
                                value={resourceSearch}
                                onChange={(e) => setResourceSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
                            />
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {filteredResources.map(resource => (
                                <Link
                                    key={resource.id}
                                    href={`/library/${resource.id}`}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-600 hover:text-brand-dark"
                                >
                                    <FolderOpen size={14} />
                                    <span className="truncate">{resource.title}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-3">
                        <Link
                            href="/library"
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-brand-green transition-colors"
                            title="Resources"
                        >
                            <FolderOpen size={20} />
                        </Link>
                    </div>
                )}
            </div>

            {/* ===== FOOTER / UTILITY ICONS ===== */}
            <div className="border-t border-slate-100 p-2">
                {isExpanded ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <button
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                                title="Settings"
                            >
                                <Settings size={18} />
                            </button>
                            <button
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                                title="Help"
                            >
                                <HelpCircle size={18} />
                            </button>
                            <button
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                                title="Toggle Dark Mode"
                            >
                                <Moon size={18} />
                            </button>
                        </div>
                        <div className="flex items-center gap-1">
                            <Link
                                href="/user-dashboard"
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                                title="Profile"
                            >
                                <User size={18} />
                            </Link>
                            <button
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-500 transition-colors"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-1">
                        <button
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                            title="Settings"
                        >
                            <Settings size={18} />
                        </button>
                        <Link
                            href="/user-dashboard"
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                            title="Profile"
                        >
                            <User size={18} />
                        </Link>
                    </div>
                )}
            </div>
        </aside>
    );
}
