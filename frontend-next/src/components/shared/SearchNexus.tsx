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
    className = "",
    variant = 'default',
    showSwitches = true,
    showFilters = true
}: SearchNexusProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const isMinimal = variant === 'minimal';

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
        <div className={`w-full max-w-7xl mx-auto space-y-4 ${className}`}>
            {/* Main Controller Bar */}
            <div className={`bg-neutral-white rounded-[2rem] border border-neutral-gray/20 p-2 flex flex-col md:flex-row items-center gap-2 ${isMinimal ? '' : ' backdrop-blur-md bg-neutral-white/70'}`}>

                {/* Segmented Control: Public/Personal */}
                {showSwitches && (
                    <div className="flex p-1 bg-neutral-beige/30 rounded-xl border border-neutral-gray/10 w-full md:w-auto">
                        <button
                            onClick={() => handleTabChange('PUBLIC')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${state.activeTab === 'PUBLIC' ? 'bg-neutral-white text-neutral-ink  border border-neutral-gray/10' : 'text-neutral-ink hover:text-primary-strong'}`}
                        >
                            <Globe size={14} />
                            Public
                        </button>
                        <button
                            onClick={() => handleTabChange('PERSONAL')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${state.activeTab === 'PERSONAL' ? 'bg-neutral-white text-neutral-ink  border border-neutral-gray/10' : 'text-neutral-ink hover:text-primary-strong'}`}
                        >
                            <User size={14} />
                            Personal
                        </button>
                    </div>
                )}

                {/* Primary Search Lab */}
                <div className="flex-1 w-full relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-ink group-focus-within:text-primary-strong transition-colors" size={20} />
                    <input
                        type="text"
                        value={state.query}
                        onChange={(e) => onChange({ ...state, query: e.target.value })}
                        placeholder={placeholder}
                        className="w-full bg-transparent border-none py-4 pl-14 pr-12 text-sm font-bold text-neutral-ink placeholder:text-neutral-ink focus:outline-none"
                    />
                    {state.query && (
                        <button
                            onClick={() => onChange({ ...state, query: '' })}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-neutral-ink hover:text-primary-strong transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Parameters Toggle */}
                {showFilters && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`h-[52px] px-8 rounded-xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all border ${isExpanded ? 'bg-neutral-ink text-white border-neutral-ink' : 'bg-neutral-white text-neutral-ink border-neutral-gray/20 hover:border-primary-strong/40'}`}
                    >
                        <Sliders size={18} />
                        Filters
                        {Object.values(state.activeFilters).flat().length > 0 && (
                            <span className="w-5 h-5 bg-primary-strong text-white rounded-full flex items-center justify-center text-[9px] ml-1">
                                {Object.values(state.activeFilters).flat().length}
                            </span>
                        )}
                    </button>
                )}
            </div>

            {/* Expanded Parameters Drawer */}
            <AnimatePresence>
                {isExpanded && showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-neutral-white border border-neutral-gray/10 rounded-[2rem] p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {groups.map((group) => (
                                <div key={group.id} className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-neutral-gray/10 pb-2">
                                        <h4 className="text-[10px] font-black text-neutral-ink uppercase tracking-[0.2em] flex items-center gap-2">
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
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${isActive ? 'bg-neutral-ink text-white border-neutral-ink' : 'bg-neutral-white text-neutral-ink border-neutral-gray/10 hover:border-primary-strong/40'}`}
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
