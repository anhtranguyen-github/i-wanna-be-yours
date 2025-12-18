"use client";

import React from 'react';
import Link from 'next/link';
import { useSidebar } from './SidebarContext';
import { useUser } from '@/context/UserContext';
import { useGlobalAuth } from '@/context/GlobalAuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

export function SidebarUserSection() {
    const { isExpanded } = useSidebar();
    const { user, logout } = useUser();
    const { openAuth } = useGlobalAuth();

    if (!user) {
        return (
            <div className="p-3 border-t border-slate-100">
                {isExpanded ? (
                    <button
                        onClick={() => openAuth('LOGIN')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-brand-green transition-colors text-left"
                    >
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                            <UserIcon size={18} />
                        </div>
                        <span className="font-semibold text-sm">Login</span>
                    </button>
                ) : (
                    <button
                        onClick={() => openAuth('LOGIN')}
                        className="flex justify-center p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-brand-green transition-colors w-full"
                        title="Login"
                    >
                        <UserIcon size={20} />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="p-3 border-t border-slate-100">
            {isExpanded ? (
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-9 h-9 rounded-full bg-brand-peach flex items-center justify-center text-white font-bold text-sm">
                        {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-dark truncate">
                            {user.email?.split('@')[0]}
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-brand-peach flex items-center justify-center text-white font-bold text-sm">
                        {user.email?.[0].toUpperCase()}
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Logout"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
