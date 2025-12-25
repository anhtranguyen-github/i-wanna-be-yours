"use client";

import React, { useState } from 'react';
import { Search, Sliders, X, ChevronDown, Sparkles, Globe, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchNexusProps, SearchNexusState } from '@/types/search';

export function SearchNexus({
    placeholder = "Search resources...",
    groups,
    state,
    onChange,
    onPersonalTabAttempt,
    isLoggedIn,
    className = ""
}: SearchNexusProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleFilter = (groupId: string, optionId: string) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        const currentActive = state.activeFilters[groupId] || [];
        let nextActive: string[];

        if (group.type === 'SINGLE') {
            nextActive = currentActive.includes(optionId) ? [] : [optionId];
        } else {
            nextActive = currentActive.includes(optionId)
                ? currentActive.filter(id => id !== optionId)
                : [...currentActive, optionId];
        }

        onChange({
            ...state,
            activeFilters: {
                ...state.activeFilters,
                [groupId]: nextActive
            }
        });
    };

    const handleTabChange = (tab: 'PUBLIC' | 'PERSONAL') => {
        if (tab === 'PERSONAL' && !isLoggedIn) {
            onPersonalTabAttempt();
            return;
        }
        onChange({ ...state, activeTab: tab });
    };

    return (
        <div className={`w-full max-w-7xl mx-auto space-y-6 ${className}`}>
            {/* Main Controller Bar */}
            <div className="bg-neutral-white/70 backdrop-blur-md rounded-[2.5rem] border border-neutral-gray/20 p-3 shadow-xl flex flex-col md:flex-row items-center gap-3">

                {/* Segmented Control: Public/Personal */}
                <div className="flex p-1.5 bg-neutral-beige/50 rounded-2xl border border-neutral-gray/10 w-full md:w-auto">
                    <button
                        onClick={() => handleTabChange('PUBLIC')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.activeTab === 'PUBLIC' ? 'bg-neutral-white text-primary-strong shadow-md border border-neutral-gray/10' : 'text-neutral-ink/60 hover:text-neutral-ink'}`}
                    >
                        <Globe size={14} />
                        Public
                    </button>
                    <button
                        onClick={() => handleTabChange('PERSONAL')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.activeTab === 'PERSONAL' ? 'bg-neutral-white text-primary-strong shadow-md border border-neutral-gray/10' : 'text-neutral-ink/60 hover:text-neutral-ink'}`}
                    >
                        <User size={14} />
                        Personal
                    </button>
                </div>

                {/* Primary Search Lab */}
                <div className="flex-1 w-full relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-ink/30 group-focus-within:text-primary-strong transition-colors" size={20} />
                    <input
                        type="text"
                        value={state.query}
                        onChange={(e) => onChange({ ...state, query: e.target.value })}
                        placeholder={placeholder}
                        className="w-full bg-transparent border-none py-5 pl-14 pr-12 text-sm font-black text-neutral-ink placeholder:text-neutral-ink/20 focus:outline-none"
                    />
                    {state.query && (
                        <button
                            onClick={() => onChange({ ...state, query: '' })}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-neutral-ink/20 hover:text-primary-strong transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Parameters Toggle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`h-[58px] px-8 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all border ${isExpanded ? 'bg-neutral-ink text-white border-neutral-ink shadow-lg shadow-neutral-ink/10' : 'bg-neutral-white text-neutral-ink border-neutral-gray/10 hover:border-primary-strong/40'}`}
                >
                    <Sliders size={18} />
                    Filters
                    {Object.values(state.activeFilters).flat().length > 0 && (
                        <span className="w-5 h-5 bg-primary/20 text-primary-strong rounded-full flex items-center justify-center text-[9px] ml-1 animate-in zoom-in duration-300">
                            {Object.values(state.activeFilters).flat().length}
                        </span>
                    )}
                </button>
            </div>

            {/* Expanded Parameters Drawer */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-neutral-white/50 backdrop-blur-sm border border-neutral-gray/10 rounded-[2.5rem] p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                            {groups.map((group) => (
                                <div key={group.id} className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-neutral-gray/10 pb-3">
                                        <h4 className="text-[10px] font-black text-neutral-ink uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Sparkles size={12} className="text-secondary" />
                                            {group.label}
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {group.options.map((option) => {
                                            const isActive = state.activeFilters[group.id]?.includes(option.id);
                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => toggleFilter(group.id, option.id)}
                                                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${isActive ? 'bg-primary-strong text-white border-primary-strong shadow-lg shadow-primary-strong/20 scale-[1.05]' : 'bg-neutral-white text-neutral-ink border-neutral-gray/10 hover:border-primary-strong/40'}`}
                                                >
                                                    {option.icon && <span className="mr-2">{option.icon}</span>}
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
