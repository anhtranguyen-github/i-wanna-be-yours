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
    LogOut,
    FileText
} from 'lucide-react';

// Width constants
const SIDEBAR_WIDTHS = {
    collapsed: 70,
    expanded: 300,
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

// Utility icons configuration
const utilityIcons = [
    { icon: Settings, label: 'Settings', href: '/settings', action: 'link' },
    { icon: HelpCircle, label: 'Help', href: '/help', action: 'link' },
    { icon: Moon, label: 'Dark Mode', href: '#', action: 'toggle' },
    { icon: User, label: 'Profile', href: '/user-dashboard', action: 'link' },
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
            {/* ===== HEADER / TOGGLE ===== */}
            <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-slate-100">
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
            <div className="flex-shrink-0 p-3">
                {isExpanded ? (
                    <Link
                        href="/chat"
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-brand-green text-white font-semibold rounded-xl hover:bg-brand-green/90 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <Plus size={18} />
                        New Chat
                    </Link>
                ) : (
                    <Link
                        href="/chat"
                        className="flex items-center justify-center w-full py-2.5 bg-brand-green text-white rounded-xl hover:bg-brand-green/90 transition-all duration-200"
                        title="New Chat"
                    >
                        <Plus size={18} />
                    </Link>
                )}
            </div>

            {/* ===== CHAT SEARCH (Expanded Only) ===== */}
            {isExpanded && (
                <div className="flex-shrink-0 px-3 pb-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={chatSearch}
                            onChange={(e) => setChatSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                        />
                    </div>
                </div>
            )}

            {/* ===== CHAT HISTORY LIST ===== */}
            <div className={`flex-1 overflow-y-auto min-h-0 ${isExpanded ? 'px-2' : 'px-1'}`}>
                {isExpanded ? (
                    <div className="space-y-1">
                        {filteredChats.map(chat => (
                            <Link
                                key={chat.id}
                                href={`/chat/${chat.id}`}
                                className={`block p-2.5 rounded-lg hover:bg-slate-50 transition-colors group ${pathname === `/chat/${chat.id}` ? 'bg-brand-green/10 border-l-2 border-brand-green' : ''
                                    }`}
                            >
                                <p className="text-sm font-medium text-slate-700 truncate group-hover:text-brand-dark">
                                    {chat.title}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">{chat.date}</p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-2 space-y-2">
                        <Link
                            href="/chat"
                            className={`p-2.5 rounded-lg hover:bg-slate-100 transition-colors ${pathname?.startsWith('/chat') ? 'bg-brand-green/10 text-brand-green' : 'text-slate-500 hover:text-brand-green'
                                }`}
                            title="Chats"
                        >
                            <MessageCircle size={20} />
                        </Link>
                    </div>
                )}
            </div>

            {/* ===== RESOURCES SECTION ===== */}
            <div className="flex-shrink-0 border-t border-slate-100">
                {isExpanded ? (
                    <div className="p-3">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <FolderOpen size={12} />
                            Resources
                        </h3>
                        {/* Resources Search */}
                        <div className="relative mb-2">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search resources..."
                                value={resourceSearch}
                                onChange={(e) => setResourceSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                            />
                        </div>
                        {/* Resources List */}
                        <div className="space-y-1 max-h-28 overflow-y-auto">
                            {filteredResources.map(resource => (
                                <Link
                                    key={resource.id}
                                    href={`/library/${resource.id}`}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-600 hover:text-brand-dark"
                                >
                                    <FileText size={14} className="flex-shrink-0 text-slate-400" />
                                    <span className="truncate">{resource.title}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-3">
                        <Link
                            href="/library"
                            className={`p-2.5 rounded-lg hover:bg-slate-100 transition-colors ${pathname?.startsWith('/library') ? 'bg-brand-green/10 text-brand-green' : 'text-slate-500 hover:text-brand-green'
                                }`}
                            title="Resources"
                        >
                            <FolderOpen size={20} />
                        </Link>
                    </div>
                )}
            </div>

            {/* ===== FOOTER / UTILITY ICONS ===== */}
            {/* IMPORTANT: Layout shifts from HORIZONTAL (expanded) to VERTICAL (collapsed) */}
            <div className="flex-shrink-0 border-t border-slate-100 p-2 bg-slate-50/50">
                {isExpanded ? (
                    /* ===== EXPANDED: Horizontal Row (flex-row, justify-between) ===== */
                    <div className="flex items-center justify-between gap-1 animate-fadeIn">
                        {utilityIcons.map((item, idx) => (
                            <Link
                                key={idx}
                                href={item.href}
                                className="flex-1 flex items-center justify-center p-2.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all duration-200 group"
                                title={item.label}
                            >
                                <item.icon size={18} className="group-hover:scale-110 transition-transform" />
                            </Link>
                        ))}
                        {/* Logout - separate styling */}
                        <button
                            className="flex-1 flex items-center justify-center p-2.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition-all duration-200 group"
                            title="Logout"
                        >
                            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                ) : (
                    /* ===== COLLAPSED: Vertical Stack (flex-col, items-center) ===== */
                    <div className="flex flex-col items-center gap-1 animate-fadeIn">
                        {utilityIcons.map((item, idx) => (
                            <Link
                                key={idx}
                                href={item.href}
                                className="p-2.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all duration-200 group"
                                title={item.label}
                            >
                                <item.icon size={18} className="group-hover:scale-110 transition-transform" />
                            </Link>
                        ))}
                        {/* Logout */}
                        <button
                            className="p-2.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition-all duration-200 group"
                            title="Logout"
                        >
                            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
