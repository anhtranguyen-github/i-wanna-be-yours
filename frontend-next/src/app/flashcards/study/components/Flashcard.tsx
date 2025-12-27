import React from "react";
import { Keyboard, Volume2, Star } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface FlashcardData {
    front?: string;
    back?: string | string[];
    kanji?: string;
    meaning?: string | string[];
    reading?: string;
    mnemonic?: string;
    example?: string;
    k_audio?: string;
    audio?: string;
}

interface FlashcardProps {
    card: FlashcardData;
    flipped: boolean;
    setFlipped: (flipped: boolean) => void;
    showBothSides: boolean;
    frontSideSetting: 'JAPANESE' | 'DEFINITION';
}

export const Flashcard: React.FC<FlashcardProps> = ({
    card,
    flipped,
    setFlipped,
    showBothSides,
    frontSideSetting
}) => {
    // Determine content based on settings
    const sideA = frontSideSetting === 'JAPANESE' ? (card.front || card.kanji) : (card.back || card.meaning);
    const sideB = frontSideSetting === 'JAPANESE' ? (card.back || card.meaning) : (card.front || card.kanji);
    const displayB = Array.isArray(sideB) ? sideB.join(", ") : sideB;

    const playAudio = (e: React.MouseEvent) => {
        e.stopPropagation();
        const audioUrl = card.k_audio || card.audio;
        if (audioUrl) {
            new Audio(audioUrl).play().catch(console.error);
        }
    };

    return (
        <div className="w-full max-w-2xl relative z-10 px-4">
            <div
                onClick={() => setFlipped(!flipped)}
                className="relative w-full aspect-[4/5] xs:aspect-[4/3] sm:aspect-[1.4] perspective-2000 cursor-pointer group"
            >
                <div
                    className="relative w-full h-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] preserve-3d"
                    style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >

                    {/* Front Face: Primary Lexicon */}
                    <div className="absolute w-full h-full backface-hidden bg-white border-2 border-neutral-gray/10 rounded-[2.5rem] sm:rounded-[3rem] flex flex-col items-center justify-center p-8 sm:p-16 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] group-hover:border-primary/20 transition-all z-20">
                        <div className="absolute top-6 left-8 sm:top-10 sm:left-10">
                            <div className="text-[9px] sm:text-[10px] font-bold text-neutral-ink/20 uppercase tracking-[0.4em]">Primary Lexicon</div>
                        </div>

                        <div className="text-center space-y-6 sm:space-y-10 w-full px-4 overflow-hidden">
                            <h2 className="text-5xl xs:text-6xl sm:text-8xl font-black text-neutral-ink font-jp tracking-tighter leading-tight break-words">
                                {sideA}
                            </h2>

                            {showBothSides && (
                                <div className="pt-8 sm:pt-10 border-t-2 border-neutral-beige/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <p className="text-xl sm:text-4xl font-bold text-neutral-ink/30 italic tracking-tight">{displayB}</p>
                                </div>
                            )}
                        </div>

                        <div className="absolute bottom-8 sm:bottom-10 left-0 right-0 flex justify-center">
                            <div className="flex items-center gap-3 bg-neutral-beige/10 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-ink/30 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-all duration-500">
                                <Keyboard size={12} className="text-primary-strong" />
                                <span className="hidden sm:inline">Strike <kbd className="font-sans px-1.5 py-0.5 bg-white border border-neutral-gray/20 rounded-md text-neutral-ink font-bold shadow-sm">SPACE</kbd> to reveal</span>
                                <span className="sm:hidden">Tap to flip</span>
                            </div>
                        </div>
                    </div>

                    {/* Back Face: Synaptic Resolution */}
                    <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-neutral-ink border-2 border-neutral-ink/5 rounded-[2.5rem] sm:rounded-[3rem] flex flex-col items-center justify-center p-8 sm:p-16 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] relative overflow-hidden group/back z-20">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />

                        <div className="absolute top-6 left-8 sm:top-10 sm:left-10 z-10">
                            <div className="text-[9px] sm:text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">Synaptic Resolution</div>
                        </div>

                        <div className="text-center space-y-6 sm:space-y-10 relative z-10 w-full overflow-hidden">
                            <h2 className="text-3xl xs:text-4xl sm:text-6xl font-black text-white leading-[1.15] tracking-tight drop-shadow-xl break-words px-2">
                                {displayB}
                            </h2>

                            {card.reading && (
                                <div className="inline-block px-6 py-3 sm:px-8 sm:py-4 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 shadow-inner">
                                    <span className="text-primary font-jp text-2xl sm:text-5xl font-black">{card.reading}</span>
                                </div>
                            )}

                            {(card.mnemonic || card.example) && (
                                <div className="max-w-md mx-auto p-4 sm:p-6 bg-white/5 border border-white/5 rounded-3xl text-[10px] sm:text-[11px] font-semibold text-white/40 leading-relaxed italic animate-in fade-in zoom-in-95 duration-700 hidden xs:block">
                                    "{card.mnemonic || card.example}"
                                </div>
                            )}
                        </div>

                        <div className="absolute top-6 right-8 sm:top-10 sm:right-10 z-10 flex flex-col gap-2">
                            {(card.k_audio || card.audio) && (
                                <button
                                    onClick={playAudio}
                                    className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white/20 hover:text-white transition-all hover:scale-105 active:scale-95"
                                >
                                    <Volume2 size={18} />
                                </button>
                            )}
                            <button className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white/20 hover:text-white transition-all hover:scale-105 active:scale-95">
                                <Star size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .perspective-2000 { perspective: 2000px; }
            `}</style>
        </div>
    );
};
