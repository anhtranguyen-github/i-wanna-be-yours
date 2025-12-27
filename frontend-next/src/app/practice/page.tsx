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
    Users,
    Layers,
    ShieldCheck
} from "lucide-react";
import { FilterState, PracticeNode } from "@/types/practice";
import * as practiceService from "@/services/practiceService";
import { SearchNexus } from "@/components/shared/SearchNexus";
import { SearchNexusState, FilterGroup } from "@/types/search";
import { InformativeLoginCard, CreateButton, PageHeader, ViewModeToggle, CreateContentPanel, ListingCard, RetrievalModal, HistoryModal, ShareModal } from "@/components/shared";
import { Link2, History } from "lucide-react";
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
    const [isRetrievalOpen, setIsRetrievalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Share & Edit State
    const [shareTarget, setShareTarget] = useState<{ id: string, title: string } | null>(null);
    const [editingNode, setEditingNode] = useState<any | null>(null);

    const [searchState, setSearchState] = useState<SearchNexusState>({
        query: "",
        activeFilters: {
            ownership: [],
            level: [],
            mode: [],
            skills: []
        },
        activeTab: 'ALL'
    });
    const [customTags, setCustomTags] = useState<string[]>([]);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const filterGroups: FilterGroup[] = [
        {
            id: 'ownership',
            label: 'Owned by',
            type: 'MULTI',
            options: [
                { id: 'GLOBAL', label: 'Official', icon: <ShieldCheck size={14} className="text-primary-strong" /> },
                { id: 'COMMUNITY', label: 'Community', icon: <Users size={14} /> },
                ...(user ? [{ id: 'MINE', label: 'Mine', icon: <UserIcon size={14} /> }] : [])
            ]
        },
        {
            id: 'level',
            label: 'Level',
            type: 'MULTI',
            options: [
                { id: 'N5', label: 'N5' },
                { id: 'N4', label: 'N4' },
                { id: 'N3', label: 'N3' },
                { id: 'N2', label: 'N2' },
                { id: 'N1', label: 'N1' }
            ]
        },
        {
            id: 'mode',
            label: 'Mode',
            type: 'MULTI',
            options: [
                { id: 'QUIZ', label: 'Quiz' },
                { id: 'SINGLE_EXAM', label: 'Timed' },
                { id: 'FULL_EXAM', label: 'Simulated' }
            ]
        },
        {
            id: 'skills',
            label: 'Skills',
            type: 'MULTI',
            options: [
                { id: 'VOCABULARY', label: 'Vocab' },
                { id: 'GRAMMAR', label: 'Grammar' },
                { id: 'KANJI', label: 'Kanji' },
                { id: 'READING', label: 'Reading' }
            ]
        },
        ...(user && customTags.length > 0 ? [{
            id: 'custom_tags',
            label: 'My Tags',
            type: 'MULTI' as const,
            options: customTags.map(tag => ({ id: tag, label: tag }))
        }] : [])
    ];


    const fetchNodes = useCallback(async () => {
        setIsLoading(true);
        try {
            const apiFilters: FilterState = {
                mode: (searchState.activeFilters.mode?.[0] || 'ALL') as any,
                level: (searchState.activeFilters.level?.[0] || 'ALL') as any,
                ownership: searchState.activeFilters.ownership || []
            } as any;

            const { nodes: fetchedNodes } = await practiceService.getNodes(apiFilters, !!user);

            let filtered = fetchedNodes;

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
        router.push(`/practice/details/${id}`);
    };

    const handleSearchChange = (newState: SearchNexusState) => {
        const ownershipFilter = newState.activeFilters.ownership || [];

        if (ownershipFilter.includes('MINE') && !user) {
            setShowLoginPrompt(true);
            return;
        }

        setSearchState(newState);
        if (!ownershipFilter.includes('MINE')) setShowLoginPrompt(false);
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

    const handleEditNode = async (nodeId: string) => {
        try {
            const result = await practiceService.getNodeSessionData(nodeId);
            // Transform internal format for CreateContentPanel
            const transformedItems = result.questions.map(q => ({
                question: q.content,
                options: q.options.map(o => o.text),
                correctIndex: q.options.findIndex(o => o.id === q.correctOptionId),
                explanation: q.explanation || ""
            }));

            setEditingNode({
                ...result.node,
                items: transformedItems
            });
            setIsCreatePanelOpen(true);
        } catch (err) {
            console.error("Failed to fetch full node for editing:", err);
        }
    };

    const handleShareNode = (node: PracticeNode) => {
        setShareTarget({ id: node.id, title: node.title });
    };

    const handleSaveContent = async (data: any) => {
        try {
            const nodeData = {
                title: data.title || "New Protocol",
                description: data.description || "Custom training sequence",
                isPublic: data.visibility === 'public' || data.visibility === 'global',
                mode: (searchState.activeFilters.mode?.[0] !== 'ALL' ? searchState.activeFilters.mode?.[0] : 'QUIZ') as any,
                level: (searchState.activeFilters.level?.[0] !== 'ALL' ? searchState.activeFilters.level?.[0] : 'N3') as any,
                skills: ['VOCABULARY'] as any[],
                questions: data.items?.map((item: any, i: number) => ({
                    content: item.question || item.front || item.term || "",
                    options: item.options?.map((opt: any, oi: number) => ({
                        id: `o-${oi}`,
                        text: opt
                    })) || [],
                    correctOptionId: (item.correctIndex !== undefined) ? `o-${item.correctIndex}` : (item.correctOptionId || "o-0"),
                    explanation: item.explanation || ""
                })) || []
            };

            if (editingNode) {
                await practiceService.updateNode(editingNode.id, nodeData as any);
            } else {
                await practiceService.createNode(nodeData);
            }

            fetchNodes();
            setIsCreatePanelOpen(false);
            setEditingNode(null);
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
                backHref="/activity"
                backLabel="Back"
                backPosition="inline"
                rightContent={
                    <>
                        <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
                        <button
                            onClick={() => setIsRetrievalOpen(true)}
                            className="w-10 h-10 rounded-xl bg-neutral-white border border-neutral-gray/20 flex items-center justify-center text-neutral-ink hover:text-primary-strong hover:border-primary-strong transition-all"
                            title="Add by ID"
                        >
                            <Link2 size={20} />
                        </button>
                        <button
                            onClick={() => {
                                if (!user) {
                                    openAuth('LOGIN', {
                                        flowType: 'PRACTICE',
                                        title: 'Calibration Logs',
                                        description: 'Sign in to access your detailed performance metrics and calibration history.'
                                    });
                                } else {
                                    setIsHistoryOpen(true);
                                }
                            }}
                            className="w-10 h-10 rounded-xl bg-neutral-white border border-neutral-gray/20 flex items-center justify-center text-neutral-ink hover:text-primary-strong hover:border-primary-strong transition-all"
                            title="View History"
                        >
                            <History size={20} />
                        </button>
                        <CreateButton label="Create Protocol" onClick={() => { setEditingNode(null); handleCreateClick(); }} />
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
                                    ...(node.isPublic ? [{ label: 'Official', value: 'Verified', icon: <ShieldCheck size={14} className="text-primary-strong" /> }] : []),
                                    ...((node as any).creatorName && !node.isPublic ? [{ label: 'By', value: (node as any).creatorName, icon: <UserIcon size={14} /> }] : [])
                                ]}
                                onClick={() => handleStartNode(node.id)}
                                onEdit={user && user.id.toString() === (node as any).userId ? () => handleEditNode(node.id) : undefined}
                                onShare={user && user.id.toString() === (node as any).userId ? () => handleShareNode(node) : undefined}
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
                {searchState.activeFilters.access?.[0] === 'PRIVATE' && !user && (
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
                onClose={() => { setIsCreatePanelOpen(false); setEditingNode(null); }}
                type="PRACTICE"
                onSave={handleSaveContent}
                initialData={editingNode}
            />

            <RetrievalModal
                isOpen={isRetrievalOpen}
                onClose={() => setIsRetrievalOpen(false)}
                type="PRACTICE"
            />

            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
            />

            <ShareModal
                isOpen={!!shareTarget}
                onClose={() => setShareTarget(null)}
                contentId={shareTarget?.id || ''}
                contentType="practice-arena"
                title={shareTarget?.title || ''}
            />
        </div>
    );
}
