'use client';

import * as React from 'react';
import { DetailModal } from '@/components/ui/detail-modal';
import { MasteredItem } from '@/mocks/strategyMockData';
import { cn } from '@/lib/utils';
import { Search, Filter, BookOpen, GraduationCap, Type, AlertTriangle, Brain } from 'lucide-react';

interface MasteredItemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    items: MasteredItem[];
    category: string;
    // Tactical OKR stats
    velocity?: number;
    target?: number;
    unit?: string;
    confidence?: number;
    contributing_task_types?: string[];
    projected_completion?: string;
    current?: number;
}

export function MasteredItemsModal({
    isOpen,
    onClose,
    title,
    items = [],
    category,
    velocity,
    target,
    unit,
    confidence,
    contributing_task_types = [],
    projected_completion,
    current,
}: MasteredItemsModalProps) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [levelFilter, setLevelFilter] = React.useState<string | 'all'>('all');

    const safeItems = items || [];

    const filteredItems = safeItems.filter((item) => {
        const matchesSearch = item?.title?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLevel = levelFilter === 'all' || item?.level === levelFilter;
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
    const highRiskCount = safeItems.filter(i => i.performance === 'low').length;

    return (
        <DetailModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            subtitle={`Reviewing ${safeItems.length} ${category} items tracked in your study plan`}
            size="lg"
        >
            <div className="space-y-6">
                {/* Tactical Overview Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Velocity</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-slate-900">{velocity || 0}</span>
                            <span className="text-xs font-bold text-slate-500">{unit}/day</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Confidence</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-slate-900">{confidence || 0}</span>
                            <span className="text-xs font-bold text-slate-500">%</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 col-span-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Contributing Sources</span>
                        <div className="flex flex-wrap gap-2">
                            {contributing_task_types.length > 0 ? (
                                contributing_task_types.map(type => (
                                    <span key={type} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] uppercase font-black text-slate-500">
                                        {type}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs font-bold text-slate-400">Standard Study Routines</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sensei Briefing Section */}
                {safeItems.length > 0 ? (
                    <div className="bg-brand-dark rounded-2xl p-5 text-white relative overflow-hidden shadow-xl shadow-brand-dark/20">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-salmon/20 rounded-full blur-3xl opacity-50" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-sky/10 rounded-full blur-2xl opacity-30" />

                        <div className="flex items-start gap-5 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10">
                                <Brain className="text-brand-salmon" size={24} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-black text-brand-salmon text-[10px] uppercase tracking-widest">Sensei&apos;s Strategic Briefing</h3>
                                <p className="text-sm font-bold leading-relaxed">
                                    {highRiskCount > 0
                                        ? `There are ${highRiskCount} items currently at high-risk for knowledge decay. I recommend initiating a focused "Deep Drill" session for ${category} today.`
                                        : `Your retention for this ${category} cluster is exceptional. No immediate tactical shifts required—maintain current SRS cycles.`
                                    }
                                </p>
                                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/10 font-black text-[10px] uppercase tracking-tighter text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        {safeItems.filter(i => i.status === 'mastered' || i.status === 'burned').length} Mastered
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        {safeItems.filter(i => i.status === 'learning' || i.status === 'reviewing').length} Learning
                                    </div>
                                    {highRiskCount > 0 && (
                                        <div className="flex items-center gap-1 text-red-400">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            {highRiskCount} Critical
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-900 rounded-2xl p-5 text-slate-300 relative overflow-hidden border border-slate-800">
                        <div className="flex items-start gap-5 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                                <Brain className="text-slate-500" size={24} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-black text-slate-500 text-[10px] uppercase tracking-widest">Sensei Insight: Precision Mastery</h3>
                                <p className="text-sm font-medium leading-relaxed">
                                    We are now tracking <strong>{items.length} individual items</strong> for this objective.
                                    Review these specific patterns and words to improve your confidence score and velocity toward the N3 deadline.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

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
                                                        "text-[10px] font-bold uppercase tracking-tight",
                                                    item.status === 'burned' ? "text-slate-400" :
                                                        item.status === 'mastered' ? "text-emerald-500" :
                                                            item.status === 'reviewing' ? "text-indigo-500" :
                                                                "text-brand-salmon"
                                                )}>
                                                    • {item.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats and Indicators */}
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">Proficiency</span>
                                            <span className={cn(
                                                "text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-tight",
                                                item.performance === 'perfect' ? "bg-emerald-100 text-emerald-700" :
                                                    item.performance === 'high' ? "bg-blue-100 text-blue-700" :
                                                        item.performance === 'medium' ? "bg-amber-100 text-amber-700" :
                                                            "bg-red-100 text-red-700"
                                            )}>
                                                {item.performance}
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
                                                {(item.last_rating || 'NEW').toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Action Dot Indicator */}
                                        <div className={cn(
                                            "w-2 h-2 rounded-full relative z-10",
                                            item.performance === 'low' ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/50" :
                                                item.status === 'learning' ? "bg-indigo-400" :
                                                    "bg-emerald-400"
                                        )} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 space-y-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                            {safeItems.length === 0 ? <Search className="text-slate-300" size={32} /> : <Filter className="text-slate-300" size={32} />}
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-brand-dark">
                                {safeItems.length === 0
                                    ? (current > 0 ? "Synchronizing Items..." : "No Items Mastered Yet")
                                    : "No Results Matching Filters"}
                            </h3>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                {safeItems.length === 0
                                    ? (current > 0
                                        ? `We found ${current} ${unit} in your aggregate progress. We are currently loading the individual proficiency records for your "Sensei Briefing".`
                                        : `Your journey is just beginning. Start your daily study tasks to see individual ${unit} and their proficiency levels appear here.`)
                                    : "Try adjusting your search or category filters to find the items you are looking for."}
                            </p>
                        </div>
                        <div className="flex justify-center gap-3">
                            {safeItems.length > 0 && (
                                <button
                                    onClick={() => { setSearchQuery(''); setLevelFilter('all'); }}
                                    className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors"
                                >
                                    Clear Filters
                                </button>
                            )}
                            {current === 0 && safeItems.length === 0 && (
                                <button
                                    onClick={onClose}
                                    className="px-8 py-3 bg-brand-salmon text-white rounded-xl font-black hover:bg-brand-salmon/90 transition-all shadow-lg shadow-brand-salmon/20"
                                >
                                    Begin Level N{category.charAt(category.length - 1)} Study
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DetailModal>
    );
}
