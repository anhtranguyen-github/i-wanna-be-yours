"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    LayoutGrid,
    StretchHorizontal,
    ArrowLeft,
    Zap,
    Activity,
    BrainCircuit,
    SearchX
} from "lucide-react";
import { FilterState, PracticeNode, PracticeMode, JLPTLevel, SkillType } from "@/types/practice";
import * as practiceService from "@/services/practiceService";
import AdvancedFilterBar from "@/components/practice/AdvancedFilterBar";
import PracticeListCard from "@/components/practice/PracticeListCard";
import PracticeCard from "@/components/practice/PracticeCard";

export default function PracticeHubPage() {
    const router = useRouter();

    // State
    const [nodes, setNodes] = useState<PracticeNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('LIST');
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState<FilterState>({
        mode: 'ALL',
        level: 'ALL',
        skill: 'ALL',
        timing: 'ALL',
        origin: 'ALL',
        status: 'ALL'
    });

    // Fetch Data
    const fetchNodes = useCallback(async () => {
        setIsLoading(true);
        try {
            const { nodes: fetchedNodes } = await practiceService.getNodes(filters);

            // Front-end search filtering
            const filtered = fetchedNodes.filter(node =>
                node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                node.description.toLowerCase().includes(searchQuery.toLowerCase())
            );

            setNodes(filtered);
        } catch (error) {
            console.error("Failed to load practice nexus:", error);
        } finally {
            setIsLoading(false);
        }
    }, [filters, searchQuery]);

    useEffect(() => {
        fetchNodes();
    }, [fetchNodes]);

    const handleStartNode = (id: string) => {
        // Unified route - no more JLPT vs Quiz distinction
        router.push(`/practice/session/${id}`);
    };

    return (
        <div className="min-h-screen bg-secondary/30 pb-20">
            {/* Header Section */}
            <div className="bg-neutral-white border-b border-neutral-gray/10 px-8 py-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-1000" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-ink hover:text-primary-strong transition-all mb-8 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Command Center
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary-strong text-white rounded-2xl shadow-lg shadow-primary/20">
                                    <BrainCircuit size={32} />
                                </div>
                                <h1 className="text-5xl font-black text-neutral-ink font-display tracking-tight">Practice Nexus</h1>
                            </div>
                            <p className="text-lg text-neutral-ink/70 font-medium max-w-2xl leading-relaxed">
                                Unified training environment. Select your objective, specify your cognitive parameters, and initiate the protocol.
                            </p>
                            <div className="flex items-center gap-6 mt-4">
                                <div className="flex items-center gap-2 text-primary-strong font-black text-xs uppercase tracking-widest">
                                    <Zap size={16} />
                                    Active Nodes: {nodes.length}
                                </div>
                                <div className="flex items-center gap-2 text-secondary font-black text-xs uppercase tracking-widest">
                                    <Activity size={16} />
                                    Proficiency: Advanced
                                </div>
                            </div>
                        </div>

                        {/* View Switcher */}
                        <div className="flex items-center p-1.5 bg-neutral-beige rounded-2xl border border-neutral-gray/10 shadow-inner">
                            <button
                                onClick={() => setViewMode('LIST')}
                                className={`p-3 rounded-xl transition-all ${viewMode === 'LIST' ? "bg-neutral-white text-primary-strong shadow-md scale-105" : "text-neutral-ink/40 hover:text-neutral-ink"}`}
                                title="List View"
                            >
                                <StretchHorizontal size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('GRID')}
                                className={`p-3 rounded-xl transition-all ${viewMode === 'GRID' ? "bg-neutral-white text-primary-strong shadow-md scale-105" : "text-neutral-ink/40 hover:text-neutral-ink"}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Hub */}
            <div className="max-w-7xl mx-auto px-8 -mt-8 relative z-20">
                <AdvancedFilterBar
                    filters={filters}
                    onFilterChange={setFilters}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />
            </div>

            {/* Content Area */}
            <main className="max-w-7xl mx-auto px-8 mt-12">
                {isLoading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-32 bg-neutral-white/50 border border-neutral-gray/10 rounded-[1.5rem] animate-pulse" />
                        ))}
                    </div>
                ) : nodes.length > 0 ? (
                    <div className={viewMode === 'LIST' ? "flex flex-col gap-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"}>
                        {nodes.map(node => (
                            viewMode === 'LIST' ? (
                                <PracticeListCard key={node.id} node={node} onStart={handleStartNode} />
                            ) : (
                                <PracticeCard key={node.id} config={node as any} onStart={handleStartNode} />
                            )
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-neutral-white/30 rounded-[3rem] border-2 border-dashed border-neutral-gray/20">
                        <div className="p-8 bg-neutral-beige/50 rounded-full mb-8">
                            <SearchX size={64} className="text-neutral-ink/20" />
                        </div>
                        <h3 className="text-3xl font-black text-neutral-ink font-display mb-4">No Nodes Detected</h3>
                        <p className="text-neutral-ink/60 font-bold max-w-sm">
                            Your current parameters yielded zero matches in the Nexus. Try relaxing your filters or synthesis criteria.
                        </p>
                        <button
                            onClick={() => {
                                setFilters({ mode: 'ALL', level: 'ALL', skill: 'ALL', timing: 'ALL', origin: 'ALL', status: 'ALL' });
                                setSearchQuery("");
                            }}
                            className="mt-8 px-8 py-4 bg-neutral-ink text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-strong transition-all"
                        >
                            Reset Parameters
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
