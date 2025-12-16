"use client";

import React from 'react';
import { useSidebar, SIDEBAR_WIDTHS } from './SidebarContext';
import { SidebarHeader } from './SidebarHeader';
import { SidebarChatPanel } from './SidebarChatPanel';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarUserSection } from './SidebarUserSection';
import {
    MessageCircle,
    Wrench,
    Gamepad2,
    Library,
    BookOpen,
    CalendarDays,
    GraduationCap
} from 'lucide-react';

// Navigation items configuration
const navItems = [
    { icon: <MessageCircle size={20} />, label: 'Chat', href: '/chat' },
    { icon: <Wrench size={20} />, label: 'Tools', href: '/tools' },
    { icon: <Gamepad2 size={20} />, label: 'Game', href: '/game' },
    { icon: <Library size={20} />, label: 'Library', href: '/library' },
    { icon: <BookOpen size={20} />, label: 'Knowledge', href: '/knowledge-base' },
    { icon: <CalendarDays size={20} />, label: 'Study Plan', href: '/study-plan' },
    { icon: <GraduationCap size={20} />, label: 'Practice', href: '/practice' },
];

export function UnifiedSidebar() {
    const { state, isExpanded } = useSidebar();
    const width = SIDEBAR_WIDTHS[state];

    return (
        <aside
            className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-white border-r border-slate-100 transition-all duration-300 ease-out"
            style={{ width }}
        >
            {/* Header with logo */}
            <SidebarHeader />

            {/* Chat Panel - appears only on chat routes */}
            <SidebarChatPanel />

            {/* Navigation Items */}
            <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
                {navItems.map(item => (
                    <SidebarNavItem
                        key={item.href}
                        icon={item.icon}
                        label={item.label}
                        href={item.href}
                    />
                ))}
            </nav>

            {/* User Section */}
            <SidebarUserSection />
        </aside>
    );
}
