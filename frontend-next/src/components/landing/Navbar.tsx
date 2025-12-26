import Link from 'next/link';
import React from 'react';
import { Sparkles } from 'lucide-react';

export const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 h-20 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                {/* Logo Area */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                        <Sparkles size={20} className="fill-primary" />
                    </div>
                    <span className="text-2xl font-black font-display text-neutral-ink tracking-tight uppercase tracking-widest text-lg">Hanachan</span>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-10">
                    <NavLink href="/study-plan">Strategy</NavLink>
                    <NavLink href="/tools">Laboratory</NavLink>
                    <NavLink href="/library">Library</NavLink>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/chat"
                        className="hidden sm:flex text-neutral-ink font-black uppercase tracking-widest text-[10px] hover:text-neutral-ink transition-colors"
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/chat"
                        className="bg-slate-900 hover:bg-black text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover: hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Command Center
                    </Link>
                </div>
            </div>
        </nav>
    );
};

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
        href={href}
        className="text-[10px] uppercase font-black tracking-[0.2em] text-neutral-ink hover:text-primary transition-colors"
    >
        {children}
    </Link>
);
