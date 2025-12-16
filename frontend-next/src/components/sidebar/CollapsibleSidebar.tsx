"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar, SIDEBAR_WIDTHS } from './SidebarContext';
import {
    ChevronsLeft,
    ChevronsRight,
    Plus,
    Search,
    MessageCircle,
    FolderOpen,
    Wrench,
    Gamepad2,
    Library,
    BookOpen,
    CalendarDays,
    GraduationCap,
    FileText,
    Settings,
    User,
    LogOut,
    ChevronDown,
    ChevronRight,
    History,
    CheckSquare,
    Sparkles
} from 'lucide-react';

// Mock chat history data
const mockChats = [
    { id: '1', title: 'JLPT N3 Grammar Help', date: 'Today' },
    { id: '2', title: '漢字 Practice Session', date: 'Today' },
    { id: '3', title: 'Verb Conjugation Q&A', date: 'Yesterday' },
    { id: '4', title: 'Reading Comprehension', date: 'Yesterday' },
    { id: '5', title: 'Listening Practice', date: 'Last Week' },
    { id: '6', title: 'Culture Discussion', date: 'Last Week' },
];

// Mock resources data
const mockResources = [
    { id: 'r1', title: 'N3 Vocabulary List', type: 'flashcard' },
    { id: 'r2', title: 'Grammar Notes', type: 'document' },
    { id: 'r3', title: 'Kanji Study Set', type: 'flashcard' },
    { id: 'r4', title: 'Particle Cheat Sheet', type: 'document' },
];

// Main Navigation Icons
const navIcons = [
    { icon: MessageCircle, label: 'Chat', href: '/chat' },
    { icon: Wrench, label: 'Tools', href: '/tools' },
    { icon: Gamepad2, label: 'Game', href: '/game' },
    { icon: Library, label: 'Library', href: '/library' },
    { icon: CalendarDays, label: 'Study Plan', href: '/study-plan' },
    { icon: GraduationCap, label: 'Practice', href: '/practice' },
];

// Artifact Creation Actions (Moved from Right Sidebar)
const artifactActions = [
    { icon: FileText, label: 'Flashcard', action: 'create-flashcard' },
    { icon: CheckSquare, label: 'Quiz', action: 'create-quiz' },
    { icon: Sparkles, label: 'Summary', action: 'create-summary' },
];

interface CollapsibleSidebarProps {
    className?: string;
}

export function CollapsibleSidebar({ className = '' }: CollapsibleSidebarProps) {
    const { isExpanded, toggle, state } = useSidebar();
    const [chatSearch, setChatSearch] = useState('');
    const [resourceSearch, setResourceSearch] = useState('');
    
    // Section collapse states for Chat Mode
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);
    const [isResourcesOpen, setIsResourcesOpen] = useState(true);

    const pathname = usePathname();
    const width = SIDEBAR_WIDTHS[state];
    const isOnChat = pathname?.startsWith('/chat');

    // Filter chats based on search
    const filteredChats = mockChats.filter(chat =>
        chat.title.toLowerCase().includes(chatSearch.toLowerCase())
    );

    // Filter resources based on search
    const filteredResources = mockResources.filter(resource =>
        resource.title.toLowerCase().includes(resourceSearch.toLowerCase())
    );

    const handleArtifactAction = (action: string) => {
        // TODO: Wire up to ChatLayoutContext to open Right Sidebar
        console.log('Artifact Action triggered:', action);
    };

    // --- RENDER HELPERS ---

    const renderChatModeContent = () => (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Top Section: New Chat + Quick Actions */}
            <div className="flex-shrink-0 flex flex-col pt-3 px-3 pb-2 gap-3 bg-white z-10 shadow-sm relative">
                {/* New Chat Button */}
                {isExpanded ? (
                    <Link
                        href="/chat"
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green/90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Plus size={20} />
                        New Chat
                    </Link>
                ) : (
                    <Link
                        href="/chat"
                        className="flex items-center justify-center w-full py-3 bg-brand-green text-white rounded-xl hover:bg-brand-green/90 transition-all duration-200"
                        title="New Chat"
                    >
                        <Plus size={20} />
                    </Link>
                )}

                {/* Quick Actions Area */}
                <div className={`flex ${isExpanded ? 'flex-wrap gap-2' : 'flex-col items-center gap-2'} animate-fadeIn`}>
                    
                    {/* 1. Artifact Creation Actions (New) */}
                    {artifactActions.map((item, idx) => (
                        <button
                            key={`artifact-${idx}`}
                            onClick={() => handleArtifactAction(item.action)}
                            className={`flex items-center justify-center rounded-xl transition-all duration-200 shadow-sm border group ${
                                isExpanded 
                                ? 'p-3 bg-white border-brand-green/20 text-brand-green hover:bg-brand-green/5' 
                                : 'p-3 bg-white border-transparent text-slate-400 hover:text-brand-green'
                            }`}
                            title={item.label}
                            style={isExpanded ? { flex: '1 0 auto', minWidth: '3rem' } : {}}
                        >
                            <item.icon size={22} className="transition-transform group-hover:scale-110" />
                        </button>
                    ))}

                    {/* Divider if needed, or just flow */}
                    
                    {/* 2. Navigation Icons */}
                    {navIcons.map((item, idx) => (
                        <Link
                            key={`nav-${idx}`}
                            href={item.href}
                            className={`flex items-center justify-center rounded-xl transition-all duration-200 shadow-sm border border-transparent group ${
                                isExpanded 
                                ? 'p-3 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-brand-dark' 
                                : 'p-3 hover:bg-slate-100 text-slate-500 hover:text-brand-dark'
                            } ${pathname?.startsWith(item.href) ? '!bg-brand-green !text-white !shadow-md' : ''}`}
                            title={item.label}
                            style={isExpanded ? { flex: '1 0 auto', minWidth: '3.5rem' } : {}}
                        >
                            <item.icon size={isExpanded ? 24 : 22} className="transition-transform group-hover:scale-110" />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Middle Section: Flexible layout for History & Resources */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto border-t border-slate-100">
                
                {/* --- CHAT HISTORY SECTION --- */}
                <div className={`flex flex-col transition-all duration-300 ${isHistoryOpen ? 'flex-[3]' : 'flex-none'}`}>
                    {/* Header / Toggle */}
                    {isExpanded && (
                        <button 
                            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                            className="flex items-center justify-between px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50 transition-colors w-full sticky top-0 bg-white z-10"
                        >
                            <span className="flex items-center gap-2">
                                <History size={14} />
                                History
                            </span>
                            {isHistoryOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    )}

                    {/* Content */}
                    <div className={`transition-all duration-300 overflow-hidden ${isHistoryOpen ? 'flex-1 min-h-0' : 'h-0'}`}>
                        {isExpanded && (
                            <div className="px-3 pb-2 sticky top-8 bg-white z-10">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={chatSearch}
                                        onChange={(e) => setChatSearch(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div className={`overflow-y-auto h-full ${isExpanded ? 'px-2' : 'px-1'}`}>
                             {isExpanded ? (
                                <div className="space-y-1 pb-2">
                                    {filteredChats.map(chat => (
                                        <Link
                                            key={chat.id}
                                            href={`/chat/${chat.id}`}
                                            className={`block p-2.5 rounded-lg hover:bg-slate-50 transition-colors group ${
                                                pathname === `/chat/${chat.id}` ? 'bg-brand-green/10 border-l-2 border-brand-green' : ''
                                            }`}
                                        >
                                            <p className="text-sm font-medium text-slate-700 truncate group-hover:text-brand-dark">
                                                {chat.title}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">{chat.date}</p>
                                        </Link>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 flex-shrink-0" />

                {/* --- RESOURCES SECTION --- */}
                <div className={`flex flex-col transition-all duration-300 ${isResourcesOpen ? 'flex-[2]' : 'flex-none'}`}>
                   {/* Header / Toggle */}
                   {isExpanded && (
                        <button 
                            onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                            className="flex items-center justify-between px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50 transition-colors w-full sticky top-0 bg-white z-10"
                        >
                            <span className="flex items-center gap-2">
                                <FolderOpen size={14} />
                                Resources
                            </span>
                            {isResourcesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    )}

                    {/* Content */}
                    <div className={`transition-all duration-300 overflow-hidden ${isResourcesOpen ? 'flex-1 min-h-0' : 'h-0'}`}>
                        {isExpanded && (
                            <div className="px-3 pb-2 sticky top-8 bg-white z-10">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={resourceSearch}
                                        onChange={(e) => setResourceSearch(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div className={`overflow-y-auto h-full ${isExpanded ? 'px-2' : 'px-1'}`}>
                            {isExpanded ? (
                                <div className="space-y-1 pb-2">
                                    {filteredResources.map(resource => (
                                        <Link
                                            key={resource.id}
                                            href={`/library/${resource.id}`}
                                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-600 hover:text-brand-dark"
                                        >
                                            <FileText size={16} className="flex-shrink-0 text-slate-400" />
                                            <span className="truncate">{resource.title}</span>
                                        </Link>
                                    ))}
                                </div>
                            ) : null}
                         </div>
                    </div>
                </div>
            </div>

            {/* --- UTILITY FOOTER --- */}
            <div className="flex-shrink-0 border-t border-slate-100 p-3 bg-slate-50">
                <div className={`flex ${isExpanded ? 'flex-row justify-between' : 'flex-col gap-3'} items-center`}>
                     <button
                        className="p-2.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-700 transition-all"
                        title="Settings"
                    >
                        <Settings size={20} className="mx-auto" />
                    </button>
                    <Link
                        href="/user-dashboard"
                        className="p-2.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-700 transition-all"
                        title="Profile"
                    >
                        <User size={20} className="mx-auto" />
                    </Link>
                    <button
                        className="p-2.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 transition-all"
                        title="Logout"
                    >
                        <LogOut size={20} className="mx-auto" />
                    </button>
                </div>
            </div>
        </div>
    );

    const renderStandardModeContent = () => (
        <>
            {/* Standard Vertical Navigation */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
                {navIcons.map((item, idx) => (
                    <Link
                        key={idx}
                        href={item.href}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                            pathname?.startsWith(item.href)
                            ? 'bg-brand-green text-white shadow-sm font-medium'
                            : 'hover:bg-slate-100 text-slate-600 hover:text-brand-dark'
                        }`}
                        title={!isExpanded ? item.label : undefined}
                    >
                        <div className={`transition-transform flex-shrink-0 ${!isExpanded ? 'mx-auto' : ''}`}>
                            <item.icon size={24} className="group-hover:scale-110 transition-transform" />
                        </div>
                        {isExpanded && (
                            <span className="truncate animate-slideRight">
                                {item.label}
                            </span>
                        )}
                    </Link>
                ))}
            </div>

            {/* Standard Footer */}
            <div className="flex-shrink-0 border-t border-slate-100 p-3 bg-slate-50">
                <div className={`flex ${isExpanded ? 'flex-row justify-between' : 'flex-col gap-3'} items-center`}>
                     <button
                        className="p-2.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-700 transition-all"
                        title="Settings"
                    >
                        <Settings size={20} className="mx-auto" />
                    </button>
                    <Link
                        href="/user-dashboard"
                        className="p-2.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-700 transition-all"
                        title="Profile"
                    >
                        <User size={20} className="mx-auto" />
                    </Link>
                    <button
                        className="p-2.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 transition-all"
                        title="Logout"
                    >
                        <LogOut size={20} className="mx-auto" />
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <aside
            className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-out shadow-lg ${className}`}
            style={{ width }}
        >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-100 h-[72px]">
                {isExpanded ? (
                    <>
                        <div className="flex items-center gap-2 animate-fadeIn">
                            <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-xl">🌸</div>
                            <span className="font-display font-bold text-xl text-brand-dark tracking-tight">Hanabira</span>
                        </div>
                        <button
                            onClick={toggle}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-dark transition-colors"
                            aria-label="Collapse sidebar"
                        >
                            <ChevronsLeft size={20} />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={toggle}
                        className="w-full h-full flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 hover:text-brand-dark transition-colors"
                        aria-label="Expand sidebar"
                    >
                        <ChevronsRight size={24} />
                    </button>
                )}
            </div>

            {/* Render Content Based on Route */}
            {isOnChat ? renderChatModeContent() : renderStandardModeContent()}

        </aside>
    );
}
