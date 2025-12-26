"use client";

import React from "react";

interface ModeTab {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface ModeTabsProps {
    modes: ModeTab[];
    activeMode: string;
    onChange: (mode: string) => void;
}

export function ModeTabs({ modes, activeMode, onChange }: ModeTabsProps) {
    return (
        <div className="flex items-center gap-1 bg-neutral-beige/30 p-1 rounded-2xl w-fit border border-neutral-gray/10">
            {modes.map((mode) => {
                const isActive = activeMode === mode.id;
                return (
                    <button
                        key={mode.id}
                        onClick={() => onChange(mode.id)}
                        className={`
                            flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300
                            ${isActive
                                ? "bg-neutral-ink text-white shadow-lg shadow-neutral-ink/20 translate-y-[-1px]"
                                : "text-neutral-ink/60 hover:text-neutral-ink hover:bg-neutral-beige/50"
                            }
                        `}
                    >
                        {mode.icon && (
                            <span className={`${isActive ? "text-white" : "text-neutral-ink/40"}`}>
                                {mode.icon}
                            </span>
                        )}
                        {mode.label}
                    </button>
                );
            })}
        </div>
    );
}
