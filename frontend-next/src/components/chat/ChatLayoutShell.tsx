"use client";

import React from 'react';
import { useChatLayout, SIDEBAR_WIDTHS } from './ChatLayoutContext';

interface ChatLayoutShellProps {
    leftSidebar: React.ReactNode;
    mainContent: React.ReactNode;
    rightSidebar: React.ReactNode;
}

export function ChatLayoutShell({ leftSidebar, mainContent, rightSidebar }: ChatLayoutShellProps) {
    const {
        leftSidebar: leftState,
        rightSidebar: rightState,
        viewport,
        setLeftSidebar,
        setRightSidebar
    } = useChatLayout();

    // Calculate widths
    const leftWidth = SIDEBAR_WIDTHS.left[leftState];
    const rightWidth = SIDEBAR_WIDTHS.right[rightState];

    // Mobile overlay mode
    const isMobile = viewport === 'mobile';

    const handleBackdropClick = () => {
        if (leftState === 'expanded') {
            setLeftSidebar('collapsed');
        }
        if (rightState !== 'collapsed') {
            setRightSidebar('collapsed');
        }
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-50">
            {/* Left Sidebar */}
            <aside
                className={`
                    flex-shrink-0 h-full bg-white border-r border-slate-100
                    transition-all duration-300 ease-out
                    ${isMobile && leftState === 'expanded' ? 'fixed left-0 top-0 z-50' : ''}
                    ${isMobile && leftState === 'collapsed' ? 'hidden' : ''}
                `}
                style={{ width: isMobile && leftState === 'collapsed' ? 0 : leftWidth }}
            >
                {leftSidebar}
            </aside>

            {/* Main Chat Area - Always visible */}
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white">
                {mainContent}
            </main>

            {/* Right Sidebar */}
            <aside
                className={`
                    flex-shrink-0 h-full bg-white border-l border-slate-100
                    transition-all duration-300 ease-out
                    ${isMobile && rightState !== 'collapsed' ? 'fixed right-0 top-0 z-50' : ''}
                `}
                style={{ width: rightWidth }}
            >
                {rightSidebar}
            </aside>

            {/* Mobile overlay backdrop */}
            {isMobile && (leftState === 'expanded' || rightState !== 'collapsed') && (
                <div
                    className="fixed inset-0 bg-black/20 z-40"
                    onClick={handleBackdropClick}
                />
            )}
        </div>
    );
}
