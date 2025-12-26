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
import PracticeListCard from "@/components/practice/PracticeListCard";
import PracticeCard from "@/components/practice/PracticeCard";
import { SearchNexus } from "@/components/shared/SearchNexus";
import { SearchNexusState, FilterGroup } from "@/types/search";
import { InformativeLoginCard, CreateButton } from "@/components/shared";
import { useUser } from "@/context/UserContext";
import { Globe, User as UserIcon } from "lucide-react";

export default function PracticeHubPage() {
    const router = useRouter();
    const { user } = useUser();

    // State
    const [nodes, setNodes] = useState<PracticeNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('LIST');
    const [searchState, setSearchState] = useState<SearchNexusState>({
        query: "",
        activeFilters: {
            mode: ['ALL'],
            level: ['ALL'],
            skill: ['ALL'],
            timing: ['ALL'],
            origin: ['ALL'],
            status: ['ALL'],
            access: ['PUBLIC']
        },
        activeTab: 'PUBLIC'
    });
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    // Filter Groups Configuration
    const filterGroups: FilterGroup[] = [
        {
            id: 'access',
            label: 'Access',
            type: 'SINGLE',
            options: [
                { id: 'PUBLIC', label: 'Public Portal', icon: <Globe size={12} /> },
                { id: 'PERSONAL', label: 'My Trials', icon: <UserIcon size={12} /> }
            ]
        },
        {
            id: 'mode',
            label: 'Protocol Mode',
            type: 'SINGLE',
            options: [
                { id: 'ALL', label: 'All Protocols' },
                { id: 'QUIZ', label: 'Quick Quiz' },
                { id: 'FULL_EXAM', label: 'Full Exam' },
                { id: 'SINGLE_EXAM', label: 'Single Topic' }
            ]
        },
        {
            id: 'level',
            label: 'Cognitive Level',
            type: 'SINGLE',
            options: [
                { id: 'ALL', label: 'All Levels' },
                { id: 'N5', label: 'JLPT N5' },
                { id: 'N4', label: 'JLPT N4' },
                { id: 'N3', label: 'JLPT N3' },
                { id: 'N2', label: 'JLPT N2' },
                { id: 'N1', label: 'JLPT N1' }
            ]
        },
        {
            id: 'skill',
            label: 'Domain Specification',
            type: 'SINGLE',
            options: [
                { id: 'ALL', label: 'All Skills' },
                { id: 'VOCABULARY', label: 'Vocabulary' },
                { id: 'GRAMMAR', label: 'Grammar' },
                { id: 'READING', label: 'Reading' },
                { id: 'LISTENING', label: 'Listening' }
            ]
        },
        {
            id: 'status',
            label: 'Completion Status',
            type: 'SINGLE',
            options: [
                { id: 'ALL', label: 'All States' },
                { id: 'UNSTARTED', label: 'Pristine' },
                { id: 'IN_PROGRESS', label: 'Active' },
                { id: 'COMPLETED', label: 'Finalized' }
            ]
        }
    ];

    // Fetch Data
    const fetchNodes = useCallback(async () => {
        setIsLoading(true);
        try {
            const apiFilters: FilterState = {
                mode: (searchState.activeFilters.mode?.[0] || 'ALL') as any,
                level: (searchState.activeFilters.level?.[0] || 'ALL') as any,
                skill: (searchState.activeFilters.skill?.[0] || 'ALL') as any,
                timing: (searchState.activeFilters.timing?.[0] || 'ALL') as any,
                origin: searchState.activeTab === 'PUBLIC' ? 'system' : 'manual',
                status: (searchState.activeFilters.status?.[0] || 'ALL') as any,
            };

            const { nodes: fetchedNodes } = await practiceService.getNodes(apiFilters);

            const filtered = fetchedNodes.filter(node =>
                node.title.toLowerCase().includes(searchState.query.toLowerCase()) ||
                node.description.toLowerCase().includes(searchState.query.toLowerCase())
            );

            setNodes(filtered);
        } catch (error) {
            console.error("Failed to load practice nexus:", error);
        } finally {
            setIsLoading(false);
        }
    }, [searchState]);

    useEffect(() => {
        fetchNodes();
    }, [fetchNodes]);

    const handleStartNode = (id: string) => {
        router.push(`/practice/session/${id}`);
    };

    const handleSearchChange = (newState: SearchNexusState) => {
        const accessFilter = newState.activeFilters.access?.[0];

        if (accessFilter && accessFilter !== searchState.activeTab) {
            if (accessFilter === 'PERSONAL' && !user) {
                setShowLoginPrompt(true);
                return;
            }
            newState.activeTab = accessFilter as 'PUBLIC' | 'PERSONAL';
        } else if (newState.activeTab !== searchState.activeTab) {
            newState.activeFilters = {
                ...newState.activeFilters,
                access: [newState.activeTab]
            };
        }

        setSearchState(newState);
        if (newState.activeTab === 'PUBLIC') setShowLoginPrompt(false);
    };

    return (
        <div className="min-h-screen bg-neutral-beige/20 pb-24">
            {/* Header */}
            <header className="bg-neutral-white border-b border-neutral-gray/20 px-8 py-12">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 text-center md:text-left">
                        <h1 className="text-5xl font-black text-neutral-ink font-display tracking-tight">Practice Hub</h1>
                        <p className="text-neutral-ink font-bold max-w-xl">
                            Refine your knowledge through structured drills and simulated exams.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-neutral-white border border-neutral-gray/20 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('LIST')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-neutral-ink text-white' : 'text-neutral-ink hover:bg-neutral-beige'}`}
                            >
                                <StretchHorizontal size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('GRID')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-neutral-ink text-white' : 'text-neutral-ink hover:bg-neutral-beige'}`}
                            >
                                <LayoutGrid size={20} />
                            </button>
                        </div>
                        <CreateButton href="/practice/create" label="Create New Plan" />
                    </div>
                </div>
            </header>

            {/* Nexus Controller */}
            <div className="max-w-7xl mx-auto px-8 -mt-8 relative z-50">
                <SearchNexus
                    placeholder="Search practice protocols..."
                    groups={filterGroups}
                    state={searchState}
                    onChange={handleSearchChange}
                    onPersonalTabAttempt={() => setShowLoginPrompt(true)}
                    isLoggedIn={!!user}
                    variant="minimal"
                    showSwitches={false}
                />
            </div>

            {/* Content Display */}
            <main className="max-w-7xl mx-auto px-8 pt-12">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-neutral-white rounded-[2rem] border border-neutral-gray/20 animate-pulse" />
                        ))}
                    </div>
                ) : nodes.length > 0 ? (
                    <div className={viewMode === 'GRID' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-4"}>
                        {nodes.map(node => (
                            viewMode === 'GRID' ? (
                                <PracticeCard key={node.id} config={node as any} onStart={handleStartNode} />
                            ) : (
                                <PracticeListCard key={node.id} node={node} onStart={handleStartNode} />
                            )
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-neutral-white rounded-[2rem] border border-neutral-gray/20 space-y-6">
                        <div className="w-20 h-20 bg-neutral-beige/50 rounded-full flex items-center justify-center mx-auto">
                            <SearchX size={40} className="text-neutral-ink" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-neutral-ink">No protocols detected</h3>
                            <p className="text-neutral-ink font-bold">Adjust your parameters or initialize a new plan.</p>
                        </div>
                    </div>
                )}

                {/* Personalization Gate */}
                {searchState.activeTab === 'PERSONAL' && !user && (
                    <div className="mt-12">
                        <InformativeLoginCard
                            title="Personal Practice Ledger"
                            description="Track your mastery, bookmark difficult drills, and create customized study tracks."
                            icon={BrainCircuit}
                            benefits={[
                                "Personal Mastery Statistics",
                                "Custom Practice Routines",
                                "AI-Generated Drill Focus",
                                "Cross-Device Synchronization"
                            ]}
                            flowType="PRACTICE"
                        />
                    </div>
                )}
            </main>
        </div>
    );
}
