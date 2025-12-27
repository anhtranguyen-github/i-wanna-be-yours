import { Undo2, Shuffle, Play, Pause, XCircle, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";

// We'll reimplement specific small UI parts to avoid complex imports for now, 
// or simpler: just use standard HTML/Tailwind for the toggle if not passed as component.

interface StudyControlsProps {
    flipped: boolean;
    srsActive: boolean;
    setSrsActive: (active: boolean) => void;
    isAutoPlaying: boolean;
    setIsAutoPlaying: (playing: boolean) => void;
    onUndo: () => void;
    onShuffle: () => void;
    onEvaluate: (known: boolean) => void;
    onNext: () => void;
    onPrev: () => void;
}

import { useSidebar, SIDEBAR_WIDTHS } from "@/components/sidebar/SidebarContext";

export const StudyControls: React.FC<StudyControlsProps> = ({
    flipped,
    srsActive,
    setSrsActive,
    isAutoPlaying,
    setIsAutoPlaying,
    onUndo,
    onShuffle,
    onEvaluate,
    onNext,
    onPrev
}) => {
    const { state } = useSidebar();
    const sidebarWidth = SIDEBAR_WIDTHS[state];

    return (
        <footer
            className="fixed bottom-0 p-4 sm:p-8 md:p-12 pointer-events-none flex flex-col sm:flex-row items-center sm:items-end justify-between z-50 gap-4 sm:gap-6 transition-all duration-300"
            style={{
                left: `${sidebarWidth}px`,
                width: `calc(100% - ${sidebarWidth}px)`
            }}
        >
            {/* SRS Gate */}
            <div className="pointer-events-auto">
                <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] p-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] flex items-center gap-4 group hover:shadow-[0_20px_50px_-10px_rgba(255,107,157,0.2)] transition-all">
                    <button
                        onClick={() => setSrsActive(!srsActive)}
                        className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 ${srsActive ? 'bg-primary' : 'bg-neutral-gray/20 border border-neutral-gray/10'}`}
                    >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${srsActive ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <div className="pl-5 border-l border-neutral-beige/40 flex flex-col justify-center">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] block text-neutral-ink/40 group-hover:text-neutral-ink transition-colors leading-[1.2]">Track</span>
                        <span className="text-[11px] font-black uppercase tracking-[0.1em] block text-primary-strong leading-[1.2]">Intelligence</span>
                    </div>
                </div>
            </div>

            {/* Evaluation Cluster */}
            <div className={`pointer-events-auto transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${flipped ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-16 scale-90 pointer-events-none'}`}>
                <div className="flex items-center gap-4 p-3 sm:p-4 bg-neutral-ink border-2 border-white/10 rounded-[3rem] sm:rounded-[4rem] shadow-2xl relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-transparent to-emerald-500/20 rounded-[4rem] blur-xl opacity-50 -z-10" />

                    {srsActive ? (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); onEvaluate(false); }}
                                className="px-6 sm:px-10 py-5 sm:py-7 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center gap-3 sm:gap-4 transition-all hover:scale-[1.03] active:scale-95 group shadow-xl shadow-rose-500/30"
                            >
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl bg-white/20 flex items-center justify-center">
                                    <XCircle size={18} className="sm:w-5 sm:h-5" />
                                </div>
                                <div className="text-left hidden xs:block">
                                    <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Reset Signal</div>
                                    <div className="text-[11px] sm:text-[13px] font-black uppercase tracking-widest whitespace-nowrap">Still Learning</div>
                                </div>
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); onEvaluate(true); }}
                                className="px-6 sm:px-10 py-5 sm:py-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center gap-3 sm:gap-4 transition-all hover:scale-[1.03] active:scale-95 group shadow-xl shadow-emerald-500/30"
                            >
                                <div className="text-right hidden xs:block">
                                    <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Neural Match</div>
                                    <div className="text-[11px] sm:text-[13px] font-black uppercase tracking-widest whitespace-nowrap">Know perfectly</div>
                                </div>
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl bg-white/20 flex items-center justify-center">
                                    <CheckCircle2 size={18} className="sm:w-5 sm:h-5" />
                                </div>
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-4 px-4 py-2">
                            <button onClick={onPrev} className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-inner">
                                <ArrowLeft size={24} />
                            </button>
                            <button onClick={onNext} className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-inner">
                                <ArrowRight size={24} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Automation Cluster */}
            <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 bg-white/90 backdrop-blur-xl border border-white rounded-[2.5rem] p-2 sm:p-2.5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]">
                <button
                    onClick={onUndo}
                    className="w-10 h-10 sm:w-11 sm:h-11 bg-neutral-beige/10 border border-neutral-gray/10 rounded-xl flex items-center justify-center hover:bg-neutral-beige/20 transition-all text-neutral-ink/60 hover:text-neutral-ink shadow-sm"
                    title="Neural Undo"
                >
                    <Undo2 size={16} />
                </button>
                <button
                    onClick={onShuffle}
                    className="w-10 h-10 sm:w-11 sm:h-11 bg-neutral-beige/10 border border-neutral-gray/10 rounded-xl flex items-center justify-center hover:bg-neutral-beige/20 transition-all text-neutral-ink/60 hover:text-neutral-ink shadow-sm"
                    title="Registry Shuffle"
                >
                    <Shuffle size={16} />
                </button>
                <div className="w-px h-6 bg-neutral-gray/10 mx-1" />
                <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 ${isAutoPlaying ? 'bg-primary-strong text-white scale-110 shadow-primary/30' : 'bg-neutral-ink text-white hover:bg-neutral-ink/90'}`}
                >
                    {isAutoPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                </button>
            </div>
        </footer>
    );
};
