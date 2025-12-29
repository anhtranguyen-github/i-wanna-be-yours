"use client";

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { aiTutorService } from '@/services/aiTutorService';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar, SIDEBAR_WIDTHS } from './SidebarContext';
import { useUser } from '@/context/UserContext';
import { useGlobalAuth } from '@/context/GlobalAuthContext';
import { useRouter } from 'next/navigation';
import { resourceService } from '@/services/resourceService';
import { useChatConversation } from '@/components/chat/ChatConversationContext';
import { useChatLayout } from '@/components/chat/ChatLayoutContext';
import {
    ChevronsLeft,
    ChevronsRight,
    Plus,
    Search,
    MessageCircle,
    FolderOpen,
    FileText,
    LogOut,
    ChevronDown,
    ChevronRight,
    History,
    CalendarDays,
    Sparkles,
    Crown,
    PlusCircle,
    Eye,
    Loader2,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react';
import { NAV_CONFIG, UTILITY_CONFIG, resolveActiveSectionId } from '@/config/navigation';

interface CollapsibleSidebarProps {
    className?: string;
}

export function CollapsibleSidebar({ className = '' }: CollapsibleSidebarProps) {
    const { isExpanded, toggle, state } = useSidebar();
    const { user, logout } = useUser();
    const { openAuth } = useGlobalAuth();
    const { stageResource, openResourcePreview } = useChatLayout();
    const { refreshSession } = useChatConversation();
    const router = useRouter();
    const isGuest = !user;

    const [chatSearch, setChatSearch] = useState('');
    const [resourceSearch, setResourceSearch] = useState('');

    // Section collapse states for Chat Mode
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);
    const [isResourcesOpen, setIsResourcesOpen] = useState(true);

    const pathname = usePathname();
    const activeSectionId = resolveActiveSectionId(pathname);
    const width = SIDEBAR_WIDTHS[state];
    const isOnChat = activeSectionId === 'chat';

    // Fetch chat history using SWR with deduplication
    const { data: chats } = useSWR(
        isOnChat && user ? ['/h-api/conversations', user.id] : null,
        () => aiTutorService.getConversations(),
        {
            dedupingInterval: 10000, // Prevent re-fetches within 10 seconds
            revalidateOnFocus: false, // Don't refetch on window focus
            revalidateOnReconnect: false,
        }
    );

    // Deduplicate chats based on _id to prevent UI duplicates
    const uniqueChats = (chats && Array.isArray(chats))
        ? Array.from(new Map(chats.map((c: any) => [c._id, c])).values()) as any[]
        : [];

    // Filter chats based on search
    const filteredChats = isGuest
        ? []
        : uniqueChats.filter(chat => chat.title.toLowerCase().includes(chatSearch.toLowerCase()));

    // Fetch resources using SWR with polling if any are processing
    const { data: serverResponse, error, mutate: mutateResources } = useSWR(
        isOnChat && user ? ['/f-api/v1/resources', user.id] : null,
        () => resourceService.list({ userId: String(user?.id) }),
        {
            // Poll every 5 seconds if we have resources in a non-terminal state
            refreshInterval: (data) => {
                const hasProcessing = data?.resources?.some(r =>
                    r.ingestionStatus === 'processing' || r.ingestionStatus === 'pending'
                );
                return hasProcessing ? 5000 : 0;
            }
        }
    );

    const resources = serverResponse?.resources || [];

    // Filter resources based on search
    const filteredResources = resources.filter((resource: any) =>
        resource.title?.toLowerCase().includes(resourceSearch.toLowerCase())
    );

    // --- RENDER HELPERS ---

    const renderChatModeContent = () => (
        <div className="flex flex-col h-full overflow-hidden bg-transparent">
            {/* Top Section: New Chat Button Only */}
            <div className="flex-shrink-0 flex flex-col pt-4 px-4 pb-3 gap-3 bg-background z-10 relative">
                <Link
                    href="/chat"
                    onClick={() => refreshSession()}
                    className={`
                        flex items-center justify-center gap-2 w-full py-2 px-3 bg-primary-strong text-white font-black rounded-xl hover:opacity-90 transition-all duration-300 hover: active:scale-95 font-display uppercase tracking-widest text-[9px]
                        ${!isExpanded ? 'p-0 h-12 w-12 mx-auto' : ''}
                    `}
                    title={!isExpanded ? "New Chat" : undefined}
                >
                    <Plus size={!isExpanded ? 20 : 16} strokeWidth={3} />
                    {isExpanded && "New Chat"}
                </Link>
            </div>

            {/* Middle Section: Flexible layout for History & Resources */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden border-t border-border mt-2">

                {/* --- CHAT HISTORY SECTION --- */}
                <div className={`flex flex-col transition-all duration-500 min-h-0 ${isHistoryOpen ? 'flex-[3]' : 'flex-none'}`}>
                    {/* Header / Toggle */}
                    {isExpanded && (
                        <button
                            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                            className="flex items-center justify-between px-5 py-3 text-[9px] font-display font-black text-neutral-ink uppercase tracking-[0.2em] hover:bg-neutral-beige transition-colors w-full flex-shrink-0"
                        >
                            <span className="flex items-center gap-2">
                                <History size={14} />
                                History
                            </span>
                            {isHistoryOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    )}

                    {/* Search bar - fixed, not scrollable */}
                    {isExpanded && isHistoryOpen && (
                        <div className="px-4 pt-1 pb-2 flex-shrink-0">
                            <div className="relative group">
                                <Search size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-ink group-focus-within:text-primary-strong transition-colors" />
                                <input
                                    type="text"
                                    placeholder={isGuest ? "Search demo chats..." : "Search..."}
                                    value={chatSearch}
                                    onChange={(e) => setChatSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-[11px] bg-neutral-white border border-neutral-gray/30 rounded-lg focus:outline-none focus:border-primary-strong focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                                />
                            </div>
                        </div>
                    )}

                    {/* Scrollable list */}
                    <div className={`transition-all duration-500 overflow-hidden ${isHistoryOpen ? 'flex-1 min-h-0 overflow-y-auto custom-scrollbar' : 'h-0'}`}>
                        {isExpanded && (
                            <div className="px-3 pt-1 space-y-2 pb-6">
                                {filteredChats.length > 0 ? (
                                    filteredChats.map(chat => (
                                        <Link
                                            key={chat._id}
                                            href={`/chat/${chat._id}`}
                                            className={`
                                                group block p-3 rounded-xl border transition-all duration-300 relative overflow-hidden
                                                ${pathname === `/chat/${chat._id}`
                                                    ? 'bg-neutral-white border-primary-strong/30 text-primary-strong ring-1 ring-primary-strong/5'
                                                    : 'border-transparent hover:bg-neutral-white hover:border-neutral-gray/30 text-neutral-ink hover:text-neutral-ink'
                                                }
                                            `}
                                        >
                                            <div className="relative z-10">
                                                <p className={`text-[13px] font-black truncate font-display tracking-tight mb-1`}>
                                                    {chat.title}
                                                </p>
                                                <div className="flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                                                    <CalendarDays size={10} />
                                                    <p className="text-[10px] font-black uppercase tracking-widest font-display">
                                                        {new Date(chat.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            {pathname === `/chat/${chat._id}` && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                            )}
                                        </Link>
                                    ))
                                ) : (
                                    <div className="py-12 text-center space-y-3">
                                        <MessageCircle size={32} className="mx-auto text-neutral-ink" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-ink font-display">No conversations</p>
                                    </div>
                                )}


                            </div>
                        )}

                        {/* Collapsed view icons */}
                        {!isExpanded && (
                            <div className="flex flex-col items-center py-4 gap-4">
                                {filteredChats.slice(0, 5).map(chat => (
                                    <Link
                                        key={chat._id}
                                        href={`/chat/${chat._id}`}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${pathname === `/chat/${chat._id}` ? 'bg-primary text-neutral-ink ' : 'bg-neutral-beige text-neutral-ink hover:bg-neutral-beige/80'}`}
                                        title={chat.title}
                                    >
                                        <MessageCircle size={18} />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border flex-shrink-0" />

                {/* --- RESOURCES SECTION --- */}
                <div className={`flex flex-col transition-all duration-500 min-h-0 ${isResourcesOpen ? 'flex-[2]' : 'flex-none'}`}>
                    {/* Header / Toggle */}
                    {isExpanded && (
                        <button
                            onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                            className="flex items-center justify-between px-5 py-3 text-[9px] font-display font-black text-neutral-ink uppercase tracking-[0.2em] hover:bg-neutral-beige transition-colors w-full flex-shrink-0"
                        >
                            <span className="flex items-center gap-2">
                                <FolderOpen size={14} />
                                Resources
                            </span>
                            {isResourcesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    )}

                    {/* Search bar - fixed, not scrollable */}
                    {isExpanded && isResourcesOpen && (
                        <div className="px-4 pt-1 pb-2 flex-shrink-0">
                            <div className="relative group">
                                <Search size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-ink group-focus-within:text-primary-strong transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search resources..."
                                    value={resourceSearch}
                                    onChange={(e) => setResourceSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-[11px] bg-neutral-white border border-neutral-gray/30 rounded-lg focus:outline-none focus:border-primary-strong focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                                />
                            </div>
                        </div>
                    )}

                    {/* Scrollable list */}
                    <div className={`transition-all duration-500 overflow-hidden ${isResourcesOpen ? 'flex-1 min-h-0 overflow-y-auto custom-scrollbar' : 'h-0'}`}>
                        {isExpanded && (
                            <div className="px-3 pt-1 space-y-2 pb-6">
                                {filteredResources.length > 0 ? (
                                    filteredResources.map(resource => (
                                        <div
                                            key={resource.id}
                                            draggable="true"
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('resource', JSON.stringify({
                                                    id: resource.id,
                                                    title: resource.title,
                                                    type: resource.type
                                                }));
                                            }}
                                            className="group relative flex items-center gap-3 p-2.5 rounded-xl hover:bg-card border border-transparent hover:border-border/50 transition-all text-[13px] text-neutral-ink hover:text-neutral-ink cursor-grab active:cursor-grabbing font-bold shadow-none"
                                        >
                                            <div className="p-1.5 bg-muted/50 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                {resource.ingestionStatus === 'processing' ? (
                                                    <Loader2 size={14} className="animate-spin text-amber-500" />
                                                ) : resource.ingestionStatus === 'pending' ? (
                                                    <Clock size={14} className="text-neutral-ink opacity-50" />
                                                ) : resource.ingestionStatus === 'failed' ? (
                                                    <AlertCircle size={14} className="text-destructive" />
                                                ) : (
                                                    <FileText size={14} />
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="truncate font-jp text-xs">{resource.title}</span>
                                                {resource.ingestionStatus && resource.ingestionStatus !== 'completed' && (
                                                    <span className={`text-[9px] uppercase tracking-widest font-black leading-none mt-1 ${resource.ingestionStatus === 'processing' ? 'text-amber-500' :
                                                        resource.ingestionStatus === 'failed' ? 'text-destructive' : 'text-neutral-ink opacity-50'
                                                        }`}>
                                                        {resource.ingestionStatus}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        openResourcePreview(resource as any);
                                                    }}
                                                    className="p-2 hover:bg-primary/10 rounded-lg text-neutral-ink hover:text-primary transition-all active:scale-90"
                                                    title="View details"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        stageResource({
                                                            id: resource.id,
                                                            title: resource.title,
                                                            type: resource.type || 'document'
                                                        });
                                                    }}
                                                    className="p-2 hover:bg-primary/10 rounded-lg text-neutral-ink hover:text-primary transition-all active:scale-90"
                                                    title="Add to chat"
                                                >
                                                    <PlusCircle size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center space-y-3">
                                        <FolderOpen size={32} className="mx-auto text-neutral-ink" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-ink font-display">No resources found</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {!isExpanded && (
                            <div className="flex flex-col items-center py-4 gap-4">
                                {filteredResources.slice(0, 5).map(resource => (
                                    <div
                                        key={resource.id}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-neutral-beige text-neutral-ink hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
                                        title={resource.title}
                                        onClick={() => openResourcePreview(resource as any)}
                                    >
                                        {resource.ingestionStatus === 'processing' ? (
                                            <Loader2 size={18} className="animate-spin text-amber-500" />
                                        ) : resource.ingestionStatus === 'failed' ? (
                                            <AlertCircle size={18} className="text-destructive" />
                                        ) : (
                                            <FileText size={18} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- UTILITY & NAVIGATION FOOTER --- */}
            <div className="flex-shrink-0 border-t border-border bg-muted/5">
                {/* Navigation Icons (Quick Links) */}
                <div className={`p-3 ${isExpanded ? 'grid grid-cols-4 gap-2' : 'flex flex-col items-center gap-3'}`}>
                    {NAV_CONFIG.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`
                                flex items-center justify-center rounded-xl transition-all duration-300 group p-3 relative
                                ${activeSectionId === item.id
                                    ? 'bg-primary text-neutral-ink'
                                    : 'bg-card border border-neutral-gray/20 text-neutral-ink hover:bg-neutral-beige transition-all'
                                }
                            `}
                            title={item.label}
                        >
                            <item.icon size={18} className="group- transition-transform" />
                            {activeSectionId === item.id && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                            )}
                        </Link>
                    ))}
                </div>

                {/* Utility Icons (Bottom Row) */}
                <div className={`flex ${isExpanded ? 'flex-row justify-between px-5 pb-4 pt-2' : 'flex-col gap-3 pb-4 items-center'} items-center border-t border-border mt-1`}>
                    {UTILITY_CONFIG.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`p-2.5 rounded-xl transition-all active:scale-95 ${activeSectionId === item.id
                                ? 'bg-primary/20 text-neutral-ink'
                                : 'hover:bg-neutral-beige text-neutral-ink'
                                }`}
                            title={item.label}
                        >
                            <item.icon size={isExpanded ? 18 : 22} />
                        </Link>
                    ))}
                    {user ? (
                        <button
                            onClick={() => logout()}
                            className="p-2.5 rounded-xl hover:bg-destructive/10 hover:text-destructive text-neutral-ink transition-all active:scale-95"
                            title="Logout"
                        >
                            <LogOut size={isExpanded ? 18 : 22} />
                        </button>
                    ) : (
                        <button
                            onClick={() => openAuth('LOGIN')}
                            className="p-2.5 rounded-xl hover:bg-primary/10 hover:text-primary text-neutral-ink transition-all active:scale-95"
                            title="Login"
                        >
                            <LogOut size={isExpanded ? 18 : 22} className="rotate-180" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );


    const renderStandardModeContent = () => (
        <div className="flex flex-col h-full overflow-hidden bg-transparent">
            {/* Standard Vertical Navigation */}
            <div className="flex-1 overflow-y-auto min-h-0 px-3 py-4 space-y-2">
                {NAV_CONFIG.map((item) => {
                    const isActive = activeSectionId === item.id;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`
                                flex items-center gap-4 p-4 rounded-xl transition-all duration-300 group relative overflow-hidden
                                ${isActive
                                    ? 'bg-primary text-neutral-ink ring-1 ring-primary-strong/10'
                                    : 'bg-neutral-white border border-neutral-gray/20 text-neutral-ink hover:bg-neutral-beige transition-all'
                                }
                            `}
                            title={!isExpanded ? item.label : undefined}
                        >
                            <div className={`transition-transform flex-shrink-0 ${!isExpanded ? 'mx-auto' : ''}`}>
                                <item.icon size={22} className="group- transition-transform" />
                            </div>
                            {isExpanded && (
                                <span className="font-display font-black uppercase tracking-widest text-[10px] truncate animate-in slide-in-from-left-2 duration-300">
                                    {item.label}
                                </span>
                            )}
                            {isActive && isExpanded && (
                                <div className="absolute right-4 w-1.5 h-1.5 bg-white/50 rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Standard Footer */}
            <div className="flex-shrink-0 border-t border-border p-4 bg-muted/5">
                <div className={`flex ${isExpanded ? 'flex-row justify-between' : 'flex-col gap-3'} items-center`}>
                    {UTILITY_CONFIG.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`p-3 rounded-xl transition-all active:scale-95 ${activeSectionId === item.id
                                ? 'bg-primary/20 text-neutral-ink'
                                : 'hover:bg-neutral-beige text-neutral-ink transition-all'
                                }`}
                            title={item.label}
                        >
                            <item.icon size={22} />
                        </Link>
                    ))}
                    {user ? (
                        <button
                            onClick={() => logout()}
                            className="p-3 rounded-xl hover:bg-destructive/10 hover:text-destructive text-neutral-ink transition-all active:scale-95"
                            title="Logout"
                        >
                            <LogOut size={22} />
                        </button>
                    ) : (
                        <button
                            onClick={() => openAuth('LOGIN')}
                            className="p-3 rounded-xl hover:bg-primary/10 hover:text-primary text-neutral-ink transition-all active:scale-95"
                            title="Login"
                        >
                            <LogOut size={22} className="rotate-180" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <aside
            className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-secondary border-r border-neutral-gray transition-all duration-500 ease-spring  ${className}`}
            style={{ width }}
        >
            {/* Header */}
            <div className={`flex-shrink-0 flex items-center ${isExpanded ? 'justify-between px-6' : 'justify-center'} border-b border-neutral-gray ${isOnChat ? 'h-[64px]' : 'h-[80px]'} bg-transparent transition-all duration-300`}>
                {isExpanded ? (
                    <>
                        <Link href="/" className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl  border border-secondary/20">🌸</div>
                            <span className="font-display font-black text-2xl text-neutral-ink tracking-tight">hanachan</span>
                        </Link>
                        <button
                            onClick={toggle}
                            className="p-2.5 rounded-xl hover:bg-neutral-beige text-neutral-ink hover:text-primary transition-all active:scale-90"
                            aria-label="Collapse sidebar"
                        >
                            <ChevronsLeft size={20} />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={toggle}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-neutral-white text-neutral-ink hover:text-primary hover:bg-neutral-beige transition-all active:scale-90 border border-neutral-gray/20"
                        aria-label="Expand sidebar"
                    >
                        <ChevronsRight size={24} />
                    </button>
                )}
            </div>


            {/* Render Content Based on Route */}
            <div className="flex-1 overflow-hidden">
                {isOnChat ? renderChatModeContent() : renderStandardModeContent()}
            </div>

        </aside>
    );
}
