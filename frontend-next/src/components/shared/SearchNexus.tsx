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
            <div className={`bg-neutral-white rounded-[2rem] border-2 border-neutral-gray/20 p-2 flex flex-col md:flex-row items-center gap-2 ${isMinimal ? '' : ' shadow-lg'}`}>

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
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all relative ${state.activeTab === 'PERSONAL' ? 'bg-neutral-white text-neutral-ink border border-neutral-gray/10' : 'text-neutral-ink hover:text-primary-strong'} ${!isLoggedIn ? 'opacity-60 grayscale-[0.5]' : ''}`}
                        >
                            <User size={14} />
                            Personal
                            {!isLoggedIn && <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full border border-white" />}
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
            <div className="relative">
                <AnimatePresence>
                    {isExpanded && showFilters && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute right-0 top-2 z-50 p-1"
                        >
                            <div className="bg-neutral-white border-2 border-neutral-gray/20 rounded-[2rem] p-8 shadow-2xl shadow-neutral-ink/20 flex flex-col gap-8 w-fit min-w-[300px]">
                                {groups.map((group) => (
                                    <div key={group.id} className="space-y-3">
                                        <div className="flex items-center justify-between border-b border-neutral-ink/10 pb-2">
                                            <h4 className="text-[9px] font-black text-neutral-ink uppercase tracking-[0.2em] flex items-center gap-2">
                                                {group.label}
                                            </h4>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {group.options.map((option) => {
                                                const isActive = state.activeFilters[group.id]?.includes(option.id);
                                                // Guest restrictions: COMMUNITY and MINE require login
                                                const isGuestRestricted = !isLoggedIn && (option.id === 'COMMUNITY' || option.id === 'MINE');
                                                const Icon = option.icon;

                                                return (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => {
                                                            if (isGuestRestricted) {
                                                                onPersonalTabAttempt();
                                                                return;
                                                            }
                                                            toggleFilter(group.id, option.id);
                                                        }}
                                                        disabled={isGuestRestricted}
                                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border relative flex items-center gap-2 ${isActive ? 'bg-neutral-ink text-white border-neutral-ink' : 'bg-neutral-white text-neutral-ink border-neutral-ink/20 hover:border-primary-strong/40'} ${isGuestRestricted ? 'opacity-40 blur-[0.5px] cursor-not-allowed' : ''}`}
                                                    >
                                                        {Icon && <span className="flex-shrink-0 text-neutral-ink">{Icon}</span>}
                                                        {option.label}
                                                        {isGuestRestricted && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-accent rounded-full" />}
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
        </div>
    );
}
