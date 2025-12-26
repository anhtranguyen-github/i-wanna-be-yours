"use client";

import { LayoutGrid, StretchHorizontal } from "lucide-react";

export type ViewMode = 'LIST' | 'GRID';

interface ViewModeToggleProps {
    viewMode: ViewMode;
    onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
    return (
        <div className="flex bg-neutral-white border border-neutral-gray/20 rounded-xl p-1">
            <button
                onClick={() => onChange('LIST')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'LIST'
                        ? 'bg-neutral-ink text-white'
                        : 'text-neutral-ink hover:bg-neutral-beige'
                    }`}
                aria-label="List view"
            >
                <StretchHorizontal size={20} />
            </button>
            <button
                onClick={() => onChange('GRID')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'GRID'
                        ? 'bg-neutral-ink text-white'
                        : 'text-neutral-ink hover:bg-neutral-beige'
                    }`}
                aria-label="Grid view"
            >
                <LayoutGrid size={20} />
            </button>
        </div>
    );
}
