"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    Zap,
    Activity,
    BrainCircuit,
    SearchX,
    Globe,
    User as UserIcon,
    Layers,
    Gamepad2,
    ChevronRight,
    Sparkles
} from "lucide-react";
import { FilterState, PracticeNode } from "@/types/practice";
import * as practiceService from "@/services/practiceService";
import { SearchNexus } from "@/components/shared/SearchNexus";
import { SearchNexusState, FilterGroup } from "@/types/search";
import {
    InformativeLoginCard,
    CreateButton,
    PageHeader,
    ViewModeToggle,
    CreateContentPanel,
    ListingCard
} from "@/components/shared";
import type { ViewMode } from "@/components/shared";
import { useUser } from "@/context/UserContext";
import { useGlobalAuth } from "@/context/GlobalAuthContext";

// =============================================================================
// GAME CARDS DATA
// =============================================================================

const games = [
    {
        id: 'quoot',
        title: 'Quoot',
        description: 'Fast-paced vocabulary battles. Race against time, build streaks, and compete for high scores!',
        href: '/quoot',
        icon: <Zap className="w-7 h-7" />,
        color: 'bg-gradient-to-br from-amber-500 to-orange-600',
        stats: 'Answer quickly • 3 lives • Streak bonuses',
        isActive: true,
        isNew: true
    },
    {
        id: 'flashcards',
        title: 'Flashcards',
        description: 'SRS-based study mode for deep learning. Review cards at optimal intervals.',
        href: '/flashcards',
        icon: <Layers className="w-7 h-7" />,
        color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
        stats: 'Spaced repetition • Custom decks',
        isActive: true,
        isNew: false
    }
];

// =============================================================================
// COMPONENTS
// =============================================================================

function GameCard({ game }: { game: typeof games[0] }) {
    const CardContent = (
        <div className={`group relative bg-neutral-white rounded-[2rem] border border-neutral-gray/20 p-8 h-full transition-all duration-300 ${game.isActive ? 'hover:border-primary-strong cursor-pointer scale-100 active:scale-[0.98]' : 'opacity-60 cursor-not-allowed'}`}>
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${game.color} opacity-10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:opacity-20 transition-opacity`} />

            {/* New Badge */}
            {game.isNew && (
                <div className="absolute -top-3 -right-3 px-3 py-1 bg-accent text-accent-foreground text-[9px] font-black uppercase tracking-widest rounded-full ">
                    New
                </div>
            )}

            {/* Icon */}
            <div className={`w-16 h-16 ${game.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform `}>
                {game.icon}
            </div>

            {/* Content */}
            <h3 className="text-2xl font-black text-neutral-ink font-display tracking-tight mb-2 group-hover:text-primary-strong transition-colors">
                {game.title}
            </h3>
            <p className="text-neutral-ink font-bold mb-4 leading-relaxed">
                {game.description}
            </p>

            {/* Stats */}
            <div className="flex items-center justify-between mt-auto">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/60">
                    {game.stats}
                </span>
                {game.isActive && (
                    <ChevronRight size={20} className="text-neutral-ink group-hover:text-primary-strong group-hover:translate-x-1 transition-all" />
                )}
            </div>
        </div>
    );

    if (!game.isActive) {
        return CardContent;
    }

    return (
        <Link href={game.href}>
            {CardContent}
        </Link>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

type ActivityTab = 'GAMES' | 'PRACTICE';

export default function ActivityHubPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();

    // State
    const [activeTab, setActiveTab] = useState<ActivityTab>((searchParams.get('tab') as ActivityTab) || 'GAMES');
    const [nodes, setNodes] = useState<PracticeNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('GRID');
    const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);

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

    // Filter Groups Configuration for Practice
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
        }
    ];

    // Fetch Practice Data
    const fetchNodes = useCallback(async () => {
        if (activeTab !== 'PRACTICE') return;

        setIsLoading(true);
        try {
            const apiFilters: FilterState = {
                mode: (searchState.activeFilters.mode?.[0] || 'ALL') as any,
                level: (searchState.activeFilters.level?.[0] || 'ALL') as any,
                skill: (searchState.activeFilters.skill?.[0] || 'ALL') as any,
                timing: (searchState.activeFilters.timing?.[0] || 'ALL') as any,
                origin: searchState.activeTab === 'PUBLIC' ? 'system' : 'manual',
                status: (searchState.activeFilters.status?.[0] || 'ALL') as any,
                access: searchState.activeTab as 'PUBLIC' | 'PERSONAL'
            };

            const { nodes: fetchedNodes } = await practiceService.getNodes(apiFilters, !!user);

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
    }, [searchState, user, activeTab]);

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
                title: data.title || "New Practice Plan",
                description: data.description || "Custom training sequence",
                mode: (searchState.activeFilters.mode?.[0] !== 'ALL' ? searchState.activeFilters.mode?.[0] : 'QUIZ') as any,
                level: (searchState.activeFilters.level?.[0] !== 'ALL' ? searchState.activeFilters.level?.[0] : 'N3') as any,
                skills: (searchState.activeFilters.skill?.[0] !== 'ALL' ? [searchState.activeFilters.skill?.[0]] : ['VOCABULARY']) as any,
                questions: data.items?.map((item: any, i: number) => ({
                    content: item.question || item.term || "",
                    options: item.options?.map((opt: any, oi: number) => ({ id: `o-${oi}`, text: opt })) || [],
                    correctOptionId: item.correctOptionId || "o-0",
                    explanation: item.explanation || ""
                })) || [],
                isPublic: false
            });
            fetchNodes();
            setIsCreatePanelOpen(false);
        } catch (error) {
            console.error("Failed to save practice plan:", error);
            throw error;
        }
    };

    const handleTabChange = (tab: ActivityTab) => {
        setActiveTab(tab);
        // Reset loading if switching to games which is static
        if (tab === 'GAMES') setIsLoading(false);
        else fetchNodes();
    };

    return (
        <div className="min-h-screen bg-neutral-beige/20 pb-24">
            {/* Unified Hub Header */}
            <header className="bg-neutral-white border-b border-neutral-gray/20 pt-12 pb-0 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Activity className="text-primary-strong w-6 h-6" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink/40">Operation Activity</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-neutral-ink font-display tracking-tight">Mission Control</h1>
                        </div>

                        <nav className="flex gap-4 border-b-2 border-transparent">
                            <button
                                onClick={() => handleTabChange('GAMES')}
                                className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'GAMES' ? 'border-primary-strong text-neutral-ink' : 'border-transparent text-neutral-ink/40 hover:text-neutral-ink'}`}
                            >
                                Simulated Games
                            </button>
                            <button
                                onClick={() => handleTabChange('PRACTICE')}
                                className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'PRACTICE' ? 'border-primary-strong text-neutral-ink' : 'border-transparent text-neutral-ink/40 hover:text-neutral-ink'}`}
                            >
                                Training Protocols
                            </button>
                        </nav>
                    </div>

                    {activeTab === 'PRACTICE' && (
                        <div className="pb-8 animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <SearchNexus
                                    placeholder="Search protocols..."
                                    groups={filterGroups}
                                    state={searchState}
                                    onChange={handleSearchChange}
                                    onPersonalTabAttempt={() => setShowLoginPrompt(true)}
                                    isLoggedIn={!!user}
                                    variant="minimal"
                                    showSwitches={false}
                                    className="flex-1"
                                />
                                <div className="flex items-center gap-3">
                                    <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
                                    <CreateButton label="Create Plan" onClick={handleCreateClick} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                {activeTab === 'GAMES' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-500">
                        {games.map((game) => (
                            <GameCard key={game.id} game={game} />
                        ))}
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                        icon={node.mode === 'FULL_EXAM' ? <Zap size={24} /> : <BrainCircuit size={24} />}
                                        iconBgColor={node.mode === 'FULL_EXAM' ? 'bg-amber-100' : 'bg-neutral-beige/50'}
                                        viewMode={viewMode}
                                        badge={{ label: node.tags.level }}
                                        metadata={[
                                            { label: 'Units', value: node.stats.questionCount, icon: <Layers size={14} /> },
                                            ...(node.personalData?.bestScore ? [{ label: '% Best', value: node.personalData.bestScore, icon: <Activity size={14} className="text-secondary" /> }] : [])
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
                    </div>
                )}
            </main>

            {/* Create Content Panel */}
            <CreateContentPanel
                isOpen={isCreatePanelOpen}
                onClose={() => setIsCreatePanelOpen(false)}
                type="PRACTICE"
                onSave={handleSaveContent}
            />
        </div>
    );
}
