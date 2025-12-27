"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Gamepad2,
    Layers,
    Star,
    Globe,
    Zap,
    User as UserIcon,
    ShieldCheck,
    Link2,
    History
} from "lucide-react";
import { RetrievalModal, ShareModal } from "@/components/shared";
import { SearchNexus } from "@/components/shared/SearchNexus";
import { SearchNexusState, FilterGroup } from "@/types/search";
import { InformativeLoginCard, CreateButton, PageHeader, ViewModeToggle, CreateContentPanel, ListingCard, HistoryModal } from "@/components/shared";
import type { ViewMode } from "@/components/shared";
import { useUser } from "@/context/UserContext";
import { useGlobalAuth } from "@/context/GlobalAuthContext";
import { fetchQuootArenas, createQuootArena, updateQuootArena, fetchQuootArenaById } from "@/services/quootService";

// =============================================================================
// TYPES
// =============================================================================

interface QuootArena {
    id: string;
    title: string;
    description: string;
    cardCount: number;
    avgScore?: number;
    level?: string;
    coverColor?: string;
    coverEmoji?: string;
    isPersonal?: boolean;
    visibility?: 'global' | 'public' | 'private';
    creatorName?: string;
    userId?: string;
}


// =============================================================================
// MAIN PAGE
// =============================================================================

export default function GamePage() {
    const router = useRouter();
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();

    const [searchState, setSearchState] = useState<SearchNexusState>({
        query: "",
        activeFilters: {
            access: ['ALL']
        },
        activeTab: 'ALL'
    });
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('GRID');
    const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
    const [isRetrievalOpen, setIsRetrievalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Share & Edit State
    const [shareTarget, setShareTarget] = useState<{ id: string, title: string } | null>(null);
    const [editingArena, setEditingArena] = useState<any | null>(null);

    const filterGroups: FilterGroup[] = [
        {
            id: 'access',
            label: 'Scope',
            type: 'SINGLE',
            options: [
                { id: 'ALL', label: 'All', icon: <Layers size={14} /> },
                { id: 'GLOBAL', label: 'Official', icon: <ShieldCheck size={14} className="text-primary-strong" /> },
                { id: 'PUBLIC', label: 'Public', icon: <Globe size={14} /> },
                { id: 'PRIVATE', label: 'Personal', icon: <UserIcon size={14} /> }
            ]
        },
        {
            id: 'level',
            label: 'Level',
            type: 'SINGLE',
            options: [
                { id: 'N5', label: 'N5' },
                { id: 'N4', label: 'N4' },
                { id: 'N3', label: 'N3' },
                { id: 'N2', label: 'N2' },
                { id: 'N1', label: 'N1' }
            ]
        }
    ];


    const [arenas, setArenas] = useState<QuootArena[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadArenas = async () => {
        setIsLoading(true);
        try {
            const apiFilters = {
                level: searchState.activeFilters.level?.[0],
                access: searchState.activeFilters.access?.[0]
            };
            const fetchedArenas = await fetchQuootArenas(apiFilters);
            const mappedArenas: QuootArena[] = fetchedArenas.map((a: any) => ({
                id: a.id,
                title: a.title,
                description: a.description || "",
                cardCount: a.cardCount || 0,
                level: a.level,
                coverColor: 'bg-primary/20',
                coverEmoji: a.icon || '⚔️',
                isPersonal: a.visibility === 'private',
                visibility: a.visibility,
                creatorName: a.creatorName,
                userId: a.userId
            }));
            setArenas(mappedArenas);
        } catch (err) {
            console.error("Failed to load quoot arenas:", err);
            setArenas([]); // clear on error or keep previous? clear for now
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadArenas();
    }, [searchState.activeFilters, user]);

    const filteredArenas = useMemo(() => {
        let result = [...arenas];

        // Search
        if (searchState.query) {
            const q = searchState.query.toLowerCase();
            result = result.filter(a =>
                a.title.toLowerCase().includes(q) ||
                a.description.toLowerCase().includes(q)
            );
        }

        return result;
    }, [arenas, searchState.query]);

    const handleSearchChange = (newState: SearchNexusState) => {
        const accessFilter = newState.activeFilters.access?.[0];

        if (accessFilter === 'PRIVATE' && !user) {
            setShowLoginPrompt(true);
            return;
        }

        setSearchState(newState);
        if (accessFilter !== 'PRIVATE') setShowLoginPrompt(false);
    };

    const handleArenaSelect = (arenaId: string) => {
        router.push(`/quoot/details/${arenaId}`);
    };

    const handleCreateClick = () => {
        if (!user) {
            openAuth('LOGIN', {
                flowType: 'QUOOT',
                title: 'Forge Your Arena',
                description: 'Join the ranks to create custom battle arenas and track your mastery.'
            });
        } else {
            setIsCreatePanelOpen(true);
        }
    };

    const handleEditArena = async (arenaId: string) => {
        try {
            const fullArena = await fetchQuootArenaById(arenaId);
            setEditingArena(fullArena);
            setIsCreatePanelOpen(true);
        } catch (err) {
            console.error("Failed to fetch full arena for editing:", err);
        }
    };

    const handleShareArena = (arena: QuootArena) => {
        setShareTarget({ id: arena.id, title: arena.title });
    };

    const handleSaveContent = async (data: any) => {
        try {
            const arenaData = {
                title: data.title || "New Arena",
                description: data.description || "Forged via Hanachan AI",
                visibility: data.visibility || 'private',
                level: (searchState.activeFilters.level?.[0] !== 'ALL' ? searchState.activeFilters.level?.[0] : 'N3') as any,
                cards: data.items?.map((item: any) => ({
                    front: item.front || item.term || item.kanji || "",
                    back: item.back || item.definition || item.meaning || "",
                    reading: item.reading || item.hiragana || "",
                    type: 'vocabulary'
                }))
            };

            if (editingArena) {
                await updateQuootArena(editingArena.id, arenaData);
            } else {
                await createQuootArena(arenaData);
            }

            await loadArenas();
            setIsCreatePanelOpen(false);
            setEditingArena(null);
        } catch (err) {
            console.error("Failed to save arena:", err);
            throw err;
        }
    };

    return (
        <div className="min-h-screen bg-neutral-beige/20 pb-24">
            {/* Header */}
            <PageHeader
                title="Quoot"
                subtitle="High-stakes vocabulary battles"
                icon={<Zap size={24} className="text-white" />}
                iconBgColor="bg-primary-strong"
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
                                        flowType: 'QUOOT',
                                        title: 'Battle History',
                                        description: 'Sign in to review your past victories and track your progression.'
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
                        <CreateButton label="Create Arena" onClick={() => { setEditingArena(null); handleCreateClick(); }} />
                    </>
                }
            >
                <SearchNexus
                    placeholder="Search battle arenas..."
                    groups={filterGroups}
                    state={searchState}
                    onChange={handleSearchChange}
                    onPersonalTabAttempt={() => setShowLoginPrompt(true)}
                    isLoggedIn={!!user}
                    variant="minimal"
                    showSwitches={false}
                />
            </PageHeader>


            {/* Content Area */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                <section>
                    <div className={viewMode === 'GRID'
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        : "flex flex-col gap-4"
                    }>
                        {filteredArenas.map((arena) => (
                            <ListingCard
                                key={arena.id}
                                title={arena.title}
                                description={arena.description}
                                icon={<span className="text-2xl">{arena.coverEmoji || '⚔️'}</span>}
                                iconBgColor={arena.coverColor || 'bg-primary/10'}
                                viewMode={viewMode}
                                onClick={() => handleArenaSelect(arena.id)}
                                badge={arena.level ? { label: arena.level } : undefined}
                                metadata={[
                                    { label: 'Cards', value: arena.cardCount, icon: <Layers size={14} /> },
                                    ...(arena.visibility === 'global' ? [{ label: 'Official', value: 'Verified', icon: <ShieldCheck size={14} className="text-primary-strong" /> }] : []),
                                    ...(arena.creatorName && arena.visibility !== 'global' ? [{ label: 'By', value: arena.creatorName, icon: <UserIcon size={14} /> }] : [])
                                ]}
                                onEdit={user && user.id.toString() === arena.userId ? () => handleEditArena(arena.id) : undefined}
                                onShare={user && user.id.toString() === arena.userId ? () => handleShareArena(arena) : undefined}
                            />
                        ))}
                    </div>

                    {filteredArenas.length === 0 && !isLoading && (
                        <div className="bg-neutral-white border border-dashed border-neutral-gray/30 rounded-[2rem] p-20 text-center">
                            <Layers size={48} className="mx-auto text-neutral-gray/30 mb-6" />
                            <h3 className="text-xl font-black text-neutral-ink font-display mb-2">No arenas found</h3>
                            <p className="text-neutral-ink/60 font-bold max-w-md mx-auto">
                                Try adjusting your search or filters to discover new battle arenas.
                            </p>
                        </div>
                    )}
                </section>

                {/* Personalization Gate */}
                {searchState.activeFilters.access?.[0] === 'PRIVATE' && !user && (
                    <div className="mt-20">
                        <InformativeLoginCard
                            title="Your Personal Armory"
                            description="Sign in to save your battle history, track your progress on specific arenas, and create your own custom drills."
                            benefits={[
                                "Track personal high scores",
                                "Earn unique battle badges",
                                "Create private training arenas",
                                "Review difficult cards"
                            ]}
                            icon={Gamepad2}
                            flowType="QUOOT"
                        />
                    </div>
                )}
            </main>

            <CreateContentPanel
                isOpen={isCreatePanelOpen}
                onClose={() => { setIsCreatePanelOpen(false); setEditingArena(null); }}
                type="QUOOT"
                onSave={handleSaveContent}
                initialData={editingArena}
            />

            <RetrievalModal
                isOpen={isRetrievalOpen}
                onClose={() => setIsRetrievalOpen(false)}
                type="QUOOT"
            />

            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
            />

            <ShareModal
                isOpen={!!shareTarget}
                onClose={() => setShareTarget(null)}
                contentId={shareTarget?.id || ''}
                contentType="quoot-arena"
                title={shareTarget?.title || ''}
            />
        </div>
    );
}
