'use client';

import * as React from 'react';
import { DetailModal } from '@/components/ui/detail-modal';
import { MasteredItem } from '@/mocks/strategyMockData';
import { cn } from '@/lib/utils';
import { Search, Filter, BookOpen, GraduationCap, Type } from 'lucide-react';

interface MasteredItemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    items: MasteredItem[];
    category: string;
}

export function MasteredItemsModal({
    isOpen,
    onClose,
    title,
    items,
    category,
}: MasteredItemsModalProps) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [levelFilter, setLevelFilter] = React.useState<string | 'all'>('all');

    const filteredItems = items.filter((item) => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLevel = levelFilter === 'all' || item.level === levelFilter;
        return matchesSearch && matchesLevel;
    });

    const levels = ['N1', 'N2', 'N3', 'N4', 'N5'];

    const getIcon = (type: string) => {
        switch (type) {
            case 'vocabulary': return <Type size={16} className="text-blue-500" />;
            case 'grammar': return <GraduationCap size={16} className="text-purple-500" />;
            case 'kanji': return <BookOpen size={16} className="text-emerald-500" />;
            default: return <BookOpen size={16} className="text-slate-500" />;
        }
    };

    return (
        <DetailModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            subtitle={`Reviewing ${items.length} ${category} items tracked in your study plan`}
            size="lg"
        >
            <div className="space-y-6">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search items..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon/20 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon/20 transition-all font-medium"
                            value={levelFilter}
                            onChange={(e) => setLevelFilter(e.target.value)}
                        >
                            <option value="all">All Levels</option>
                            {levels.map((l) => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Items Grid */}
                {filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredItems.map((item) => (
                            <div key={item.id} className="group flex flex-col p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-salmon/20 transition-all">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-brand-salmon/5 transition-colors">
                                            {getIcon(item.type)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{item.title}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                                                    item.level === 'N1' ? "bg-red-100 text-red-700" :
                                                        item.level === 'N2' ? "bg-orange-100 text-orange-700" :
                                                            item.level === 'N3' ? "bg-amber-100 text-amber-700" :
                                                                item.level === 'N4' ? "bg-lime-100 text-lime-700" :
                                                                    "bg-emerald-100 text-emerald-700"
                                                )}>
                                                    {item.level}
                                                </span>
                                                <span className="text-[10px] text-slate-400 capitalize">{item.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border",
                                            item.status === 'burned' ? "bg-slate-900 text-white border-slate-900" :
                                                item.status === 'mastered' ? "bg-emerald-500 text-white border-emerald-500" :
                                                    item.status === 'reviewing' ? "bg-amber-400 text-white border-amber-400" :
                                                        "bg-indigo-400 text-white border-indigo-400"
                                        )}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Performance & Last Rating Row */}
                                <div className="pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">Performance</span>
                                            <span className={cn(
                                                "text-xs font-bold",
                                                item.performance === 'perfect' ? "text-emerald-600" :
                                                    item.performance === 'high' ? "text-blue-600" :
                                                        item.performance === 'medium' ? "text-amber-600" :
                                                            "text-red-500"
                                            )}>
                                                {item.performance.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="w-px h-6 bg-slate-100" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">Last Activity</span>
                                            <span className={cn(
                                                "text-xs font-bold flex items-center gap-1",
                                                item.last_rating === 'perfect' ? "text-emerald-600" :
                                                    item.last_rating === 'easy' ? "text-emerald-500" :
                                                        item.last_rating === 'medium' ? "text-amber-500" :
                                                            "text-red-500"
                                            )}>
                                                {item.last_rating === 'hard' && "⚠️"}
                                                {item.last_rating.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Dot Indicator */}
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        item.performance === 'low' ? "bg-red-500 animate-pulse" :
                                            item.status === 'learning' ? "bg-indigo-400" :
                                                "bg-emerald-400"
                                    )} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium whitespace-pre-wrap">No items found matching your filters.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setLevelFilter('all'); }}
                            className="mt-4 text-sm text-brand-salmon font-bold hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>
        </DetailModal>
    );
}
