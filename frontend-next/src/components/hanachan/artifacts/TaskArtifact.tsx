"use client";

import { useState } from "react";
import Image from "next/image";

export const TaskArtifact = ({ content }: { content: any }) => {
    const [checked, setChecked] = useState(false);
    return (
        <div className={`
            flex p-4 rounded-2xl mb-3 gap-4 items-start transition-all duration-300 group
            ${checked
                ? 'bg-slate-50 border border-slate-100 opacity-70'
                : 'bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-green/30 hover:-translate-y-0.5'}
        `}>
            {/* Custom Animated Checkbox */}
            <div
                className="cursor-pointer mt-1 relative flex-shrink-0"
                onClick={() => setChecked(!checked)}
            >
                <div className={`
                    w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center overflow-hidden
                    ${checked
                        ? 'bg-brand-green border-brand-green shadow-sm shadow-brand-green/30'
                        : 'bg-white border-slate-300 group-hover:border-brand-green/50'}
                `}>
                    <svg
                        viewBox="0 0 24 24"
                        className={`w-4 h-4 text-white transition-all duration-300 ${checked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 min-w-0">
                <div className={`
                    font-bold text-lg transition-colors duration-300 leading-snug
                    ${checked ? 'text-slate-400 line-through decoration-slate-300' : 'text-brand-dark'}
                `}>
                    {content.title}
                </div>

                {content.prompt && (
                    <div className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                        {content.prompt}
                    </div>
                )}
            </div>

            {/* Optional Decoration */}
            {!checked && (
                <div className="absolute right-0 top-0 w-20 h-20 opacity-[0.03] pointer-events-none">
                    <Image src="/img/specific.png" alt="decoration" width={80} height={80} className="object-cover" />
                </div>
            )}
        </div>
    );
};
