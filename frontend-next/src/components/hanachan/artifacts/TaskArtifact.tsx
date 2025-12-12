"use client";

import { useState } from "react";

export const TaskArtifact = ({ content }: { content: any }) => {
    const [checked, setChecked] = useState(false);
    return (
        <div className="flex bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-2 gap-4 items-start hover:shadow-md transition-all group">
            <div
                className="cursor-pointer mt-1"
                onClick={() => setChecked(!checked)}
            >
                {checked ? (
                    <div className="w-6 h-6 rounded-full bg-brand-emerald text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-brand-emerald/50">✓</div>
                ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-brand-emerald/50 transition-colors" />
                )}
            </div>
            <div className="flex flex-col flex-1">
                <div className={`font-medium text-brand-dark text-lg ${checked ? 'line-through text-slate-400' : ''}`}>{content.title}</div>
                <div className="text-sm text-slate-500 mt-1">{content.prompt || ''}</div>
            </div>
        </div>
    );
};
