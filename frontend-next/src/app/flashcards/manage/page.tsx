"use client";

import React, { useState, useEffect } from "react";
import { flashcardService } from "@/services/flashcardService";
import { Search, Filter, Trash2, Edit3, Plus, X, Tag as TagIcon, Check, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

// Inline tag definitions (no longer importing from decks-data)
interface Tag {
    id: string;
    label: string;
}

const CATEGORY_TAGS: Tag[] = [
    { id: 'kanji', label: 'Kanji' },
    { id: 'vocabulary', label: 'Vocabulary' },
    { id: 'grammar', label: 'Grammar' },
    { id: 'reading', label: 'Reading' }
];

const LEVEL_TAGS: Tag[] = [
    { id: 'N5', label: 'N5' },
    { id: 'N4', label: 'N4' },
    { id: 'N3', label: 'N3' },
    { id: 'N2', label: 'N2' },
    { id: 'N1', label: 'N1' }
];

const SKILL_TAGS: Tag[] = [
    { id: 'reading', label: 'Reading' },
    { id: 'listening', label: 'Listening' },
    { id: 'speaking', label: 'Speaking' },
    { id: 'writing', label: 'Writing' }
];

const ALL_TAGS = [...CATEGORY_TAGS, ...LEVEL_TAGS, ...SKILL_TAGS];

const getTagById = (id: string): Tag | undefined => ALL_TAGS.find(t => t.id === id);

interface CardData {
    _id?: string;
    source_id?: string;
    card_type: 'PERSONAL' | 'STATIC';
    deck_name?: string;
    tags?: string[];
    content: {
        front?: string;
        back?: string;
        kanji?: string;
        meaning?: string;
        reading?: string;
        example?: string;
    };
}

export default function ManageDeckPage() {
    const [cards, setCards] = useState<CardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState("");
    const [filterTags, setFilterTags] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [editModal, setEditModal] = useState<CardData | null>(null);
    const [createModal, setCreateModal] = useState(false);

    useEffect(() => { loadCards(); }, []);

    const loadCards = async () => {
        setLoading(true);
        try { const data = await flashcardService.getDueFlashcards(); setCards(data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this card?")) return;
        try { await flashcardService.deletePersonalCard(id); setCards(prev => prev.filter(c => c.source_id !== id)); }
        catch (err) { alert("Failed to delete"); }
    };

    const handleSaveEdit = async (newData: Partial<CardData['content']>, tags: string[]) => {
        if (!editModal) return;
        try {
            await flashcardService.updatePersonalCard(editModal.source_id!, { ...newData, tags });
            setCards(prev => prev.map(c => c.source_id === editModal.source_id ? { ...c, content: { ...c.content, ...newData }, tags } : c));
            setEditModal(null);
        } catch (err) { alert("Failed to update"); }
    };

    const handleCreate = async (data: { front: string; back: string; tags: string[] }) => {
        try {
            const newCard = await flashcardService.createPersonalCard({ front: data.front, back: data.back, tags: data.tags });
            setCards(prev => [newCard, ...prev]);
            setCreateModal(false);
        } catch (err) { alert("Failed to create card"); }
    };

    const toggleFilterTag = (tagId: string) => {
        setFilterTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
    };

    const filteredCards = cards.filter(c => {
        const content = c.content || {};
        const term = filterText.toLowerCase();
        const front = (content.front || content.kanji || "").toString().toLowerCase();
        const back = (content.back || content.meaning || "").toString().toLowerCase();
        const matchesSearch = front.includes(term) || back.includes(term);
        const matchesTags = filterTags.length === 0 || filterTags.some(tagId => (c.tags || []).includes(tagId));
        return matchesSearch && matchesTags;
    });

    const clearFilters = () => { setFilterTags([]); setFilterText(""); };

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="bg-card border-b border-border sticky top-0 z-50 px-6 py-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/flashcards" className="w-10 h-10 bg-muted hover:bg-muted/80 rounded-xl flex items-center justify-center transition-colors">
                            <ArrowLeft size={20} className="text-neutral-ink" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground font-display">Manage Deck</h1>
                            <p className="text-sm text-neutral-ink">View and edit your flashcards</p>
                        </div>
                    </div>
                    <button onClick={() => setCreateModal(true)} className="flex items-center gap-2 px-5 py-3 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-colors">
                        <Plus size={18} />
                        Add Card
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Search & Filters */}
                <div className="bg-card rounded-2xl border border-border p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-ink" size={18} />
                            <input
                                type="text"
                                placeholder="Search cards..."
                                className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-2.5 rounded-xl border transition-colors flex items-center gap-2 font-bold text-sm ${showFilters || filterTags.length > 0 ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-foreground border-transparent hover:border-border'}`}
                        >
                            <Filter size={16} />
                            Filter
                            {filterTags.length > 0 && <span className="w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">{filterTags.length}</span>}
                        </button>
                    </div>

                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[{ label: 'Category', tags: CATEGORY_TAGS }, { label: 'JLPT Level', tags: LEVEL_TAGS }, { label: 'Skill', tags: SKILL_TAGS }].map((group, i) => (
                                <div key={i}>
                                    <label className="text-xs font-bold text-neutral-ink mb-2 block">{group.label}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {group.tags.map(tag => (
                                            <button key={tag.id} onClick={() => toggleFilterTag(tag.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterTags.includes(tag.id) ? 'bg-primary text-primary-foreground' : 'bg-muted text-neutral-ink hover:text-foreground'}`}>
                                                {tag.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Results */}
                <div className="text-sm text-neutral-ink mb-4">
                    Showing <span className="font-bold text-foreground">{filteredCards.length}</span> cards
                    {filterTags.length > 0 && <button onClick={clearFilters} className="ml-2 text-primary hover:underline">Clear filters</button>}
                </div>

                {/* Table */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border bg-muted">
                                <th className="px-6 py-4 text-xs font-bold text-neutral-ink uppercase tracking-wide">Front</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-ink uppercase tracking-wide">Back</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-ink uppercase tracking-wide hidden md:table-cell">Tags</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-ink uppercase tracking-wide text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-neutral-ink mx-auto" /></td></tr>
                            ) : filteredCards.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-neutral-ink">No cards found</td></tr>
                            ) : filteredCards.map((card) => {
                                const content = card.content || {};
                                return (
                                    <tr key={card._id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setEditModal(card)}>
                                        <td className="px-6 py-4 font-bold text-foreground font-jp text-lg">{content.front || content.kanji || "?"}</td>
                                        <td className="px-6 py-4 text-neutral-ink font-jp max-w-xs truncate">{content.back || content.meaning || "?"}</td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {(card.tags || []).slice(0, 3).map(tagId => {
                                                    const tag = getTagById(tagId);
                                                    return tag ? <span key={tagId} className="px-2 py-0.5 bg-muted rounded text-xs font-bold text-neutral-ink">{tag.label}</span> : null;
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); setEditModal(card); }} className="p-2 text-neutral-ink hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit3 size={16} /></button>
                                                {card.card_type === 'PERSONAL' && <button onClick={(e) => handleDelete(card.source_id!, e)} className="p-2 text-neutral-ink hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 size={16} /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Modals */}
            {createModal && <CardFormModal mode="create" onClose={() => setCreateModal(false)} onSave={handleCreate} />}
            {editModal && <CardFormModal mode="edit" card={editModal} onClose={() => setEditModal(null)} onSave={(data) => handleSaveEdit({ front: data.front, back: data.back }, data.tags)} />}
        </div>
    );
}

function CardFormModal({ mode, card, onClose, onSave }: { mode: 'create' | 'edit'; card?: CardData; onClose: () => void; onSave: (data: { front: string; back: string; tags: string[] }) => void; }) {
    const [front, setFront] = useState(card?.content?.front || card?.content?.kanji || "");
    const [back, setBack] = useState(card?.content?.back || card?.content?.meaning || "");
    const [selectedTags, setSelectedTags] = useState<string[]>(card?.tags || []);

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
    };

    const isStatic = mode === 'edit' && card?.card_type !== 'PERSONAL';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80">
            <div className="w-full max-w-xl bg-card rounded-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mode === 'create' ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-neutral-ink'}`}>
                            {mode === 'create' ? <Plus size={20} /> : <Edit3 size={20} />}
                        </div>
                        <h3 className="font-bold text-lg text-foreground">{mode === 'create' ? 'Add Card' : 'Edit Card'}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg text-neutral-ink"><X size={20} /></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {isStatic && <div className="p-3 bg-accent/10 text-accent text-sm rounded-xl font-bold">Static cards cannot be edited.</div>}

                    <div>
                        <label className="text-xs font-bold text-neutral-ink mb-1.5 block">Front</label>
                        <input type="text" className="w-full p-3 bg-muted border-none rounded-xl font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Word or question..." value={front} onChange={(e) => setFront(e.target.value)} disabled={isStatic} />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-neutral-ink mb-1.5 block">Back</label>
                        <textarea className="w-full p-3 bg-muted border-none rounded-xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Meaning or answer..." value={back} onChange={(e) => setBack(e.target.value)} disabled={isStatic} />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-neutral-ink mb-2 block flex items-center gap-2"><TagIcon size={14} /> Tags</label>
                        {selectedTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {selectedTags.map(tagId => {
                                    const tag = getTagById(tagId);
                                    return tag ? <button key={tagId} onClick={() => toggleTag(tagId)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground flex items-center gap-1">{tag.label} <X size={12} /></button> : null;
                                })}
                            </div>
                        )}
                        <div className="space-y-3">
                            {[{ label: 'Category', tags: CATEGORY_TAGS }, { label: 'JLPT Level', tags: LEVEL_TAGS }, { label: 'Skill', tags: SKILL_TAGS }].map((group, i) => (
                                <div key={i}>
                                    <span className="text-xs text-neutral-ink mb-1 block">{group.label}</span>
                                    <div className="flex flex-wrap gap-2">
                                        {group.tags.map(tag => (
                                            <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${selectedTags.includes(tag.id) ? 'bg-primary/20 text-primary' : 'bg-muted text-neutral-ink hover:text-foreground'}`}>
                                                {tag.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border bg-muted flex justify-between items-center">
                    <span className="text-xs text-neutral-ink">{selectedTags.length} tags</span>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 font-bold text-neutral-ink hover:text-foreground transition-colors">Cancel</button>
                        <button onClick={() => onSave({ front, back, tags: selectedTags })} disabled={!front.trim()} className="px-5 py-2.5 font-bold bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                            <Check size={16} />
                            {mode === 'create' ? 'Create' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
