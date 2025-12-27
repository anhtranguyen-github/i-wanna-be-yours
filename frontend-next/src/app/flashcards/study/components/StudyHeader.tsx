import React from "react";
import { ArrowLeft, Sparkles, Settings } from "lucide-react";
import Link from 'next/link';
import { motion } from "framer-motion";

interface StudyHeaderProps {
    title?: string;
    currentIndex: number;
    totalCards: number;
    knownCount: number;
    learningCount: number;
    onSettingsClick: () => void;
}

export const StudyHeader: React.FC<StudyHeaderProps> = ({
    title,
    currentIndex,
    totalCards,
    knownCount,
    learningCount,
    onSettingsClick
}) => {
    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-neutral-gray/10 px-4 sm:px-8 py-4 sticky top-0 z-[60] flex items-center justify-between gap-4 sm:gap-8">
            <div className="flex items-center gap-4">
                <Link href="/flashcards" className="w-10 h-10 bg-neutral-beige/10 border border-neutral-gray/20 rounded-xl flex items-center justify-center hover:bg-neutral-white transition-all shadow-sm group">
                    <ArrowLeft size={18} className="text-neutral-ink group-hover:-translate-x-0.5 transition-transform" />
                </Link>
                <div className="hidden sm:block">
                    <h1 className="text-lg font-black text-neutral-ink tracking-tight truncate max-w-[150px] md:max-w-xs lg:max-w-md">{title || 'Personal Registry'}</h1>
                    <p className="text-[9px] font-black text-neutral-ink/30 uppercase tracking-[0.2em]">Diagnostic Session</p>
                </div>
            </div>

            {/* Progress Cluster */}
            <div className="flex-1 flex flex-col items-center gap-1.5 max-w-xs sm:max-w-sm">
                <div className="flex items-center justify-between w-full px-1">
                    <span className="text-[9px] font-black text-neutral-ink uppercase tracking-widest">{currentIndex + 1} / {totalCards}</span>
                    <div className="flex gap-1.5">
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-100/50 rounded-lg text-rose-500 text-[8px] font-black uppercase tracking-widest">
                            {learningCount}
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-100/50 rounded-lg text-emerald-500 text-[8px] font-black uppercase tracking-widest">
                            {knownCount}
                        </div>
                    </div>
                </div>
                <div className="h-1.5 w-full bg-neutral-beige/30 rounded-full overflow-hidden border border-neutral-gray/5">
                    <motion.div
                        className="h-full bg-primary-strong shadow-[0_0_10px_rgba(255,107,157,0.3)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
                        transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button className="hidden md:flex h-10 px-5 bg-neutral-ink text-white rounded-xl items-center gap-2 font-black text-[9px] uppercase tracking-widest hover:bg-neutral-ink/90 transition-all shadow-lg shadow-neutral-ink/10">
                    <Sparkles size={14} className="text-primary" />
                    Synthesize Questions
                </button>
                <button
                    onClick={onSettingsClick}
                    className="w-10 h-10 bg-neutral-white border border-neutral-gray/20 rounded-xl flex items-center justify-center hover:border-primary/40 transition-all shadow-sm text-neutral-ink"
                >
                    <Settings size={18} />
                </button>
            </div>
        </header>
    );
};
