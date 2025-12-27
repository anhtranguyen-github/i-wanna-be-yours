"use client";

import React from 'react';

interface NeuralLabLayoutProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
    sidebar?: React.ReactNode;
}

export const NeuralLabLayout: React.FC<NeuralLabLayoutProps> = ({
    title,
    subtitle,
    children,
    sidebar
}) => {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-neutral-100 font-sans selection:bg-cyan-500/30">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[40vw] h-[40vw] bg-cyan-900/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50" />
            </div>

            <div className="relative z-10 container mx-auto px-6 py-12">
                {/* Header Section */}
                <header className="mb-12 border-l-2 border-cyan-500 pl-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400/70">
                            Linguistic Intelligence Hub
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2 font-display">
                        {title}
                    </h1>
                    <p className="text-neutral-400 max-w-2xl font-light tracking-wide italic">
                        {subtitle}
                    </p>
                </header>

                {/* Main Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <main className="lg:col-span-8">
                        {children}
                    </main>

                    {sidebar && (
                        <aside className="lg:col-span-4 space-y-6">
                            {sidebar}
                        </aside>
                    )}
                </div>
            </div>

            {/* Footer Branding */}
            <footer className="relative z-10 border-t border-neutral-800/50 py-8 px-6 mt-12">
                <div className="container mx-auto flex justify-between items-center text-[9px] uppercase tracking-[0.3em] text-neutral-600">
                    <span>Neural mapping protocol: Hanachan-V1</span>
                    <span>© 2025 Hanabira.org . Neural Lab</span>
                </div>
            </footer>
        </div>
    );
};
