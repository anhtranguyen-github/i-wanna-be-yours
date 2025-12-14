"use client";

import { useState } from "react";
import { Library, Maximize2, RotateCcw } from "lucide-react";
import Image from "next/image";

export const FlashcardArtifact = ({ content }: { content: any }) => {
    const [flipped, setFlipped] = useState(false);

    return (
        <div className="flex flex-col items-center w-full h-full justify-center p-4">
            {/* Card Container */}
            <div
                className="relative w-full max-w-md aspect-[3/2] group perspective-1000 cursor-pointer"
                onClick={() => setFlipped(!flipped)}
            >
                <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>

                    {/* --- FRONT SIDE --- */}
                    <div className="absolute w-full h-full backface-hidden">
                        <div className="relative w-full h-full bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl shadow-xl border border-white/60 flex flex-col items-center justify-center p-8 overflow-hidden group-hover:-translate-y-2 transition-transform duration-300">

                            {/* Decorative Asset Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
                                <Image
                                    src="/img/grammer.png"
                                    alt="Decoration"
                                    width={128}
                                    height={128}
                                    className="object-contain"
                                />
                            </div>

                            <div className="relative z-10 flex flex-col items-center gap-6">
                                <div className="text-center font-bold text-3xl text-brand-dark tracking-tight leading-snug">
                                    {content.front}
                                </div>
                                <div className="w-12 h-1 bg-brand-green/20 rounded-full" />
                            </div>

                            <div className="absolute bottom-6 text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.2em]">
                                Question
                            </div>

                            {/* Hover Hint */}
                            <div className="absolute top-4 right-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                <RotateCcw size={20} />
                            </div>
                        </div>
                    </div>

                    {/* --- BACK SIDE --- */}
                    <div className="absolute w-full h-full backface-hidden rotate-y-180">
                        <div className="relative w-full h-full bg-gradient-to-br from-brand-peach to-pink-400 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 overflow-hidden text-white border border-white/20">

                            {/* Glass Reflection Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

                            <div className="relative z-10 text-center font-bold text-3xl drop-shadow-sm">
                                {content.back}
                            </div>

                            <div className="absolute bottom-6 text-[10px] text-white/80 font-extrabold uppercase tracking-[0.2em]">
                                Answer
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Action Bar */}
            <div className="mt-10 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <button
                    onClick={(e) => { e.stopPropagation(); alert('Saved!'); }}
                    className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-brand-green hover:text-white text-slate-500 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 border border-slate-100 group"
                >
                    <Library size={18} className="group-hover:animate-pulse" />
                    <span>Save to Library</span>
                </button>
            </div>
        </div>
    );
};
