"use client";

import { useState } from "react";
import { Library } from "lucide-react";

export const FlashcardArtifact = ({ content }: { content: any }) => {
    const [flipped, setFlipped] = useState(false);
    return (
        <div className="flex flex-col items-center w-full h-full justify-center">
            <div className="cursor-pointer w-full max-w-md aspect-[3/2] group perspective-1000" onClick={() => setFlipped(!flipped)}>
                <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
                    {/* Front */}
                    <div className="absolute w-full h-full bg-white rounded-xl shadow-clay flex flex-col items-center justify-center p-8 backface-hidden border-2 border-white group-hover:-translate-y-1 transition-transform">
                        <div className="text-center font-bold text-2xl text-brand-dark">{content.front}</div>
                        <div className="absolute bottom-4 text-xs text-slate-400 font-bold uppercase tracking-widest">Question</div>
                    </div>
                    {/* Back */}
                    <div className="absolute w-full h-full bg-brand-salmon rounded-xl shadow-clay flex flex-col items-center justify-center p-8 backface-hidden border-2 border-white rotate-y-180 text-white">
                        <div className="text-center font-bold text-2xl">{content.back}</div>
                        <div className="absolute bottom-4 text-xs text-white/80 font-bold uppercase tracking-widest">Answer</div>
                    </div>
                </div>
            </div>
            <button className="mt-8 flex items-center gap-2 px-6 py-3 bg-white hover:bg-brand-sky/10 hover:text-brand-sky text-slate-500 rounded-full text-sm font-bold transition-all shadow-sm border border-slate-100" onClick={(e) => { e.stopPropagation(); alert('Saved!'); }}>
                <Library size={16} />
                <span>Save to Library</span>
            </button>
        </div>
    );
};
