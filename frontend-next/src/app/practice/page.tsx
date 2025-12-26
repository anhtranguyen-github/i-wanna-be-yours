"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Zap,
    Activity,
    BrainCircuit,
    SearchX,
    Globe,
    User as UserIcon,
    Layers,
    ShieldCheck
} from "lucide-react";
import { FilterState, PracticeNode } from "@/types/practice";
import * as practiceService from "@/services/practiceService";
import { SearchNexus } from "@/components/shared/SearchNexus";
import { SearchNexusState, FilterGroup } from "@/types/search";
import { InformativeLoginCard, CreateButton, PageHeader, ViewModeToggle, CreateContentPanel, ListingCard } from "@/components/shared";
import type { ViewMode } from "@/components/shared";
import { useUser } from "@/context/UserContext";
import { useGlobalAuth } from "@/context/GlobalAuthContext";

export default function PracticeHubPage() {
    const router = useRouter();
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();

    // State
    const [nodes, setNodes] = useState<PracticeNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');
    const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);

    const [searchState, setSearchState] = useState<SearchNexusState>({
        query: "",
        activeFilters: {
            mode: ['ALL'],
            level: ['ALL'],
            skill: ['ALL'],
            access: ['PUBLIC']
        },
        activeTab: 'PUBLIC'
    });
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

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
            id: 'level',
            label: 'JLPT Level',
            type: 'SINGLE',
            options: [
                { id: 'ALL', label: 'All Levels' },
                { id: 'N5', label: 'JLPT N5' },
                { id: 'N4', label: 'JLPT N4' },
                { id: 'N3', label: 'JLPT N3' },
                { id: 'N2', label: 'JLPT N2' },
                { id: 'N1', label: 'JLPT N1' }
            ]
        }
    ];

    const fetchNodes = useCallback(async () => {
        setIsLoading(true);
        try {
            const apiFilters: FilterState = {
                mode: (searchState.activeFilters.mode?.[0] || 'ALL') as any,
                level: (searchState.activeFilters.level?.[0] || 'ALL') as any,
                visibility: searchState.activeTab === 'PUBLIC' ? undefined : 'private'
            } as any;

            const { nodes: fetchedNodes } = await practiceService.getNodes(apiFilters, !!user);

            let filtered = fetchedNodes;

            // Filter by Access tab logic
            if (searchState.activeTab === 'PUBLIC') {
                filtered = filtered.filter(n => n.tags?.visibility !== 'private');
            } else {
                filtered = filtered.filter(n => n.tags?.visibility === 'private');
            }

            // Search
            if (searchState.query.trim()) {
                const q = searchState.query.toLowerCase();
                filtered = filtered.filter(node =>
                    node.title.toLowerCase().includes(q) ||
                    node.description.toLowerCase().includes(q)
                );
            }

            setNodes(filtered);
        } catch (error) {
            console.error("Failed to load practice nexus:", error);
        } finally {
            setIsLoading(false);
        }
    }, [searchState, user]);

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

    const handleCreateClick = () => {
        if (!user) {
            openAuth('LOGIN', {
                flowType: 'PRACTICE',
                title: 'Design Your Protocol',
                description: 'Sign in to create custom practice plans and track your cognitive progress.'
            });
        } else {
            setIsCreatePanelOpen(true);
        }
    };

    const handleSaveContent = async (data: any) => {
        try {
            await practiceService.createNode({
                title: data.title || "New Protocol",
                description: data.description || "Custom training sequence",
                visibility: data.visibility || 'private',
                mode: (searchState.activeFilters.mode?.[0] !== 'ALL' ? searchState.activeFilters.mode?.[0] : 'QUIZ') as any,
                level: (searchState.activeFilters.level?.[0] !== 'ALL' ? searchState.activeFilters.level?.[0] : 'N3') as any,
                skills: ['VOCABULARY'],
                questions: data.items?.map((item: any, i: number) => ({
                    content: item.question || item.front || item.term || "",
                    options: item.options?.map((opt: any, oi: number) => ({
                        id: `o-${oi}`,
                        text: opt
                    })) || [],
                    correctOptionId: (item.correctIndex !== undefined) ? `o-${item.correctIndex}` : (item.correctOptionId || "o-0"),
                    explanation: item.explanation || ""
                })) || []
            });
            fetchNodes();
            setIsCreatePanelOpen(false);
        } catch (error) {
            console.error("Failed to save protocol:", error);
            throw error;
        }
    };

    return (
        <div className="min-h-screen bg-neutral-beige/20 pb-24">
            {/* Header */}
            <PageHeader
                title="Practice Hub"
                subtitle="Structured drills and simulated exams"
                icon={<BrainCircuit size={24} className="text-primary-strong" />}
                rightContent={
                    <>
                        <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
                        <CreateButton label="Create Protocol" onClick={handleCreateClick} />
                    </>
                }
            >
                <SearchNexus
                    placeholder="Search protocols..."
                    groups={filterGroups}
                    state={searchState}
                    onChange={handleSearchChange}
                    onPersonalTabAttempt={() => setShowLoginPrompt(true)}
                    isLoggedIn={!!user}
                    variant="minimal"
                    showSwitches={false}
                />
            </PageHeader>


            {/* Content Display */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-neutral-white rounded-[2rem] border border-neutral-gray/20 animate-pulse" />
                        ))}
                    </div>
                ) : nodes.length > 0 ? (
                    <div className={viewMode === 'GRID' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                        {nodes.map(node => (
                            <ListingCard
                                key={node.id}
                                title={node.title}
                                description={node.description}
                                icon={<BrainCircuit size={24} />}
                                iconBgColor="bg-neutral-beige/50"
                                viewMode={viewMode}
                                badge={{ label: node.tags?.level || node.level }}
                                metadata={[
                                    { label: 'Questions', value: node.stats.questionCount, icon: <Layers size={14} /> },
                                    ...(node.tags?.visibility === 'global' ? [{ label: 'Official', value: 'Verified', icon: <ShieldCheck size={14} className="text-primary-strong" /> }] : []),
                                    ...(node.creatorName && node.tags?.visibility !== 'global' ? [{ label: 'By', value: node.creatorName, icon: <UserIcon size={14} /> }] : [])
                                ]}
                                onClick={() => handleStartNode(node.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-neutral-white rounded-[2rem] border border-neutral-gray/20 space-y-6">
                        <div className="w-20 h-20 bg-neutral-beige/50 rounded-full flex items-center justify-center mx-auto">
                            <SearchX size={40} className="text-neutral-ink" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-neutral-ink font-display">No protocols detected</h3>
                            <p className="text-neutral-ink/60 font-bold max-w-sm mx-auto">Adjust your parameters or initialize a new training plan.</p>
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

            <CreateContentPanel
                isOpen={isCreatePanelOpen}
                onClose={() => setIsCreatePanelOpen(false)}
                type="PRACTICE"
                onSave={handleSaveContent}
            />
        </div>
    );
}
