"use client";

import React, { useState } from "react";
import {
    ChevronDown,
    Sliders,
    X,
    Search,
    History,
    CheckCircle,
    Zap,
    Trophy,
    FlaskConical
} from "lucide-react";
import { JLPTLevel, SkillType, PracticeMode, FilterState, ProtocolOrigin } from "@/types/practice";

interface AdvancedFilterBarProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

const levels: (JLPTLevel | "ALL")[] = ["ALL", "N5", "N4", "N3", "N2", "N1"];
const skills: (SkillType | "ALL")[] = ["ALL", "VOCABULARY", "GRAMMAR", "READING", "LISTENING"];
const modes: { value: PracticeMode; label: string; icon: React.ReactNode }[] = [
    { value: "ALL", label: "All Protocols", icon: <FlaskConical size={14} /> },
    { value: "FULL_EXAM", label: "Standard Simulation", icon: <Trophy size={14} /> },
    { value: "QUIZ", label: "Daily Burst", icon: <Zap size={14} /> },
    { value: "SINGLE_EXAM", label: "Skill Forge", icon: <Search size={14} /> },
];

export default function AdvancedFilterBar({
    filters,
    onFilterChange,
    searchQuery,
    onSearchChange
}: AdvancedFilterBarProps) {
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    const updateFilter = (updates: Partial<FilterState>) => {
        onFilterChange({ ...filters, ...updates });
    };

    return (
        <div className="space-y-4">
            {/* Top Bar: Primary Navigation & Search */}
            <div className="flex flex-wrap items-end gap-6 bg-neutral-white/50 p-6 rounded-[2rem] border border-neutral-gray/10  backdrop-blur-sm">

                {/* Search Lab */}
                <div className="flex-1 min-w-[300px] relative">
                    <label className="block text-[10px] font-black text-neutral-ink uppercase tracking-widest mb-3 ml-1">Search Cognitive Nodes</label>
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-ink group-focus-within:text-primary-strong transition-colors" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Find specific protocol..."
                            className="w-full bg-neutral-white border border-neutral-gray/20 rounded-2xl py-4 pl-14 pr-6 text-sm font-black text-neutral-ink focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all "
                        />
                        {searchQuery && (
                            <button
                                onClick={() => onSearchChange("")}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-ink hover:text-primary-strong transition-colors"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Level Sector */}
                <div className="w-48 relative">
                    <label className="block text-[10px] font-black text-neutral-ink uppercase tracking-widest mb-3 ml-1">Level Sector</label>
                    <select
                        value={filters.levels?.[0] || 'ALL'}
                        onChange={(e) => updateFilter({ levels: e.target.value === 'ALL' ? [] : [e.target.value as any] })}
                        className="appearance-none w-full bg-neutral-white border border-neutral-gray/20 rounded-2xl px-6 py-4 pr-12 text-sm font-black text-neutral-ink cursor-pointer hover:border-primary focus:outline-none transition-all  font-display uppercase tracking-wider"
                    >
                        {levels.map((level) => (
                            <option key={level} value={level}>{level === "ALL" ? "Global Level" : `JLPT ${level}`}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-5 bottom-5 text-neutral-ink pointer-events-none" />
                </div>

                {/* Domain Sector */}
                <div className="w-56 relative">
                    <label className="block text-[10px] font-black text-neutral-ink uppercase tracking-widest mb-3 ml-1">Domain Module</label>
                    <select
                        value={filters.skills?.[0] || 'ALL'}
                        onChange={(e) => updateFilter({ skills: e.target.value === 'ALL' ? [] : [e.target.value as any] })}
                        className="appearance-none w-full bg-neutral-white border border-neutral-gray/20 rounded-2xl px-6 py-4 pr-12 text-sm font-black text-neutral-ink cursor-pointer hover:border-primary focus:outline-none transition-all  font-display uppercase tracking-wider"
                    >
                        {skills.map((skill) => (
                            <option key={skill} value={skill}>{skill === "ALL" ? "All Domains" : skill.charAt(0) + skill.slice(1).toLowerCase()}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-5 bottom-5 text-neutral-ink pointer-events-none" />
                </div>

                {/* Advanced Toggle */}
                <button
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    className={`
                        h-[58px] px-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all border
                        ${isAdvancedOpen
                            ? "bg-neutral-ink text-white border-neutral-ink "
                            : "bg-neutral-white text-neutral-ink border-neutral-gray/20 hover:border-primary "}
                    `}
                >
                    <Sliders size={18} />
                    Parameters
                </button>
            </div>

            {/* Advanced Parameter Drawer */}
            {isAdvancedOpen && (
                <div className="bg-neutral-beige/30 border border-neutral-gray/10 rounded-[2rem] p-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                        {/* Protocol Mode */}
                        <div className="space-y-4">
                            <h4 className="text-[9px] font-black text-neutral-ink uppercase tracking-[0.25em] flex items-center gap-2">
                                <Trophy size={12} className="text-secondary" />
                                Execution Protocol
                            </h4>
                            <div className="flex flex-col gap-2">
                                {modes.map((mode) => (
                                    <button
                                        key={mode.value}
                                        onClick={() => updateFilter({ mode: mode.value })}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                            ${filters.mode === mode.value
                                                ? "bg-primary-strong text-white  scale-[1.02]"
                                                : "bg-neutral-white text-neutral-ink hover:bg-neutral-beige"}
                                        `}
                                    >
                                        {mode.icon}
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Timing Paradigm */}
                        <div className="space-y-4">
                            <h4 className="text-[9px] font-black text-neutral-ink uppercase tracking-[0.25em] flex items-center gap-2">
                                <History size={12} className="text-primary-sky" />
                                Temporal Logic
                            </h4>
                            <div className="flex flex-col gap-2">
                                {[
                                    { value: 'ALL', label: 'Adaptive Timing' },
                                    { value: 'TIMED', label: 'Strict Protocol' },
                                    { value: 'UNLIMITED', label: 'Free Observation' }
                                ].map((t) => (
                                    <button
                                        key={t.value}
                                        onClick={() => updateFilter({ timing: t.value as any })}
                                        className={`
                                            px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-left transition-all
                                            ${filters.timing === t.value
                                                ? "bg-primary-sky text-white "
                                                : "bg-neutral-white text-neutral-ink hover:bg-neutral-beige"}
                                        `}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Node Origin */}
                        <div className="space-y-4">
                            <h4 className="text-[9px] font-black text-neutral-ink uppercase tracking-[0.25em] flex items-center gap-2">
                                <FlaskConical size={12} className="text-primary-leaf" />
                                Synthesis Origin
                            </h4>
                            <div className="flex flex-col gap-2">
                                {[
                                    { value: 'ALL', label: 'Global Source' },
                                    { value: 'system', label: 'Official Core' },
                                    { value: 'ai', label: 'Neural Synthetic' },
                                    { value: 'manual', label: 'Manual Input' }
                                ].map((o) => (
                                    <button
                                        key={o.value}
                                        onClick={() => updateFilter({ origin: o.value as ProtocolOrigin })}
                                        className={`
                                            px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-left transition-all
                                            ${filters.origin === o.value
                                                ? "bg-primary-leaf text-white "
                                                : "bg-neutral-white text-neutral-ink hover:bg-neutral-beige"}
                                        `}
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Personal Status */}
                        <div className="space-y-4">
                            <h4 className="text-[9px] font-black text-neutral-ink uppercase tracking-[0.25em] flex items-center gap-2">
                                <CheckCircle size={12} className="text-accent" />
                                Memory Status
                            </h4>
                            <div className="flex flex-col gap-2">
                                {[
                                    { value: 'ALL', label: 'Show Entire Nexus' },
                                    { value: 'NEVER_ATTEMPTED', label: 'Untouched Nodes' },
                                    { value: 'IN_PROGRESS', label: 'Active Sessions' },
                                    { value: 'COMPLETED', label: 'Finalized Protocols' }
                                ].map((s) => (
                                    <button
                                        key={s.value}
                                        onClick={() => updateFilter({ status: s.value as any })}
                                        className={`
                                            px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-left transition-all
                                            ${filters.status === s.value
                                                ? "bg-accent text-white "
                                                : "bg-neutral-white text-neutral-ink hover:bg-neutral-beige"}
                                        `}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
