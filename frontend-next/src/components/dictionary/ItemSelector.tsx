import React from 'react';
import { ChevronRight } from 'lucide-react';

interface Item {
    id: string;
    label: string;
    subLabel?: string;
    type?: string;
}

interface ItemSelectorProps {
    items: Item[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export const ItemSelector = ({ items, selectedId, onSelect }: ItemSelectorProps) => {
    if (items.length === 0) return null;

    return (
        <div className="overflow-x-auto scrollbar-hide py-2 px-1 flex items-center gap-2 border-b border-slate-100 bg-white">
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={`
                        flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                        ${selectedId === item.id
                            ? 'bg-brand-dark text-white shadow-md transform scale-105'
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}
                    `}
                >
                    <span className="font-jp text-sm">{item.label}</span>
                    {item.subLabel && (
                        <span className={`text-[10px] opacity-70 ${selectedId === item.id ? 'text-white/80' : 'text-slate-400'}`}>
                            {item.subLabel}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
};
