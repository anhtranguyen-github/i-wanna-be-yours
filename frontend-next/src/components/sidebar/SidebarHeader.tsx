"use client";

import React from 'react';
import Link from 'next/link';
import { useSidebar } from './SidebarContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function SidebarHeader() {
    const { isExpanded, toggle } = useSidebar();

    return (
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
            {isExpanded ? (
                <>
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center text-white text-xl transition-transform group-hover:scale-105">
                            🌸
                        </div>
                        <span className="font-display font-bold text-brand-dark text-lg">
                            Hanachan
                        </span>
                    </Link>
                    <button
                        onClick={toggle}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                        title="Collapse sidebar"
                    >
                        <ChevronLeft size={18} />
                    </button>
                </>
            ) : (
                <div className="flex flex-col items-center w-full gap-2">
                    <Link href="/" className="group">
                        <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center text-white text-xl transition-transform group-hover:scale-105">
                            🌸
                        </div>
                    </Link>
                    <button
                        onClick={toggle}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                        title="Expand sidebar"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}
