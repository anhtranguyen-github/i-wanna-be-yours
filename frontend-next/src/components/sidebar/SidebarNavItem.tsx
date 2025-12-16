"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';

interface SidebarNavItemProps {
    icon: React.ReactNode;
    label: string;
    href: string;
}

export function SidebarNavItem({ icon, label, href }: SidebarNavItemProps) {
    const { isExpanded } = useSidebar();
    const pathname = usePathname();

    // Check if this nav item is active
    const isActive = href === '/chat'
        ? pathname?.startsWith('/chat')
        : href === '/'
            ? pathname === '/'
            : pathname?.startsWith(href);

    return (
        <Link
            href={href}
            className={`
                relative flex items-center gap-3 rounded-xl transition-all duration-200
                ${isExpanded ? 'px-3 py-2.5' : 'justify-center p-3'}
                ${isActive
                    ? 'bg-brand-green/10 text-brand-green'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-brand-green'
                }
            `}
            title={!isExpanded ? label : undefined}
        >
            {/* Active indicator bar */}
            <div className={`
                absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-brand-green
                transition-all duration-200
                ${isActive ? 'h-6 opacity-100' : 'h-0 opacity-0'}
            `} />

            {/* Icon with animation */}
            <div className={`
                flex-shrink-0 transition-transform duration-200
                ${isActive ? 'scale-110' : 'scale-100'}
            `}>
                {icon}
            </div>

            {/* Label */}
            {isExpanded && (
                <span className={`
                    font-semibold text-sm transition-all duration-200
                    ${isActive ? 'translate-x-0.5' : ''}
                `}>
                    {label}
                </span>
            )}
        </Link>
    );
}
