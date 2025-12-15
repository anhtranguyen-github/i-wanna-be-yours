"use client";

import React, { useState, useEffect } from "react";
import { flashcardService } from "@/services/flashcardService";
import {
    Search,
    Filter,
    Trash2,
    Edit3,
    Plus,
    X,
    Tag as TagIcon,
    BookOpen,
    Layers,
    Check
} from "lucide-react";
import { ALL_TAGS, Tag, getTagById, getTagsByType } from "../decks-data";

// Tag color mapping
const TAG_COLORS: Record<string, { bg: string; text: string; activeBg: string }> = {
    kanji: { bg: 'bg-rose-50', text: 'text-rose-600', activeBg: 'bg-rose-500' },
    vocabulary: { bg: 'bg-emerald-50', text: 'text-emerald-600', activeBg: 'bg-emerald-500' },
    grammar: { bg: 'bg-sky-50', text: 'text-sky-600', activeBg: 'bg-sky-500' },
    n5: { bg: 'bg-green-50', text: 'text-green-600', activeBg: 'bg-green-500' },
    n4: { bg: 'bg-lime-50', text: 'text-lime-600', activeBg: 'bg-lime-500' },
    n3: { bg: 'bg-yellow-50', text: 'text-yellow-600', activeBg: 'bg-yellow-500' },
    n2: { bg: 'bg-orange-50', text: 'text-orange-600', activeBg: 'bg-orange-500' },
    n1: { bg: 'bg-red-50', text: 'text-red-600', activeBg: 'bg-red-500' },
    beginner: { bg: 'bg-teal-50', text: 'text-teal-600', activeBg: 'bg-teal-500' },
    intermediate: { bg: 'bg-amber-50', text: 'text-amber-600', activeBg: 'bg-amber-500' },
    advanced: { bg: 'bg-red-50', text: 'text-red-600', activeBg: 'bg-red-500' },
};

const getTagColor = (tagId: string, isActive: boolean) => {
    const colors = TAG_COLORS[tagId] || { bg: 'bg-slate-50', text: 'text-slate-600', activeBg: 'bg-slate-500' };
    return isActive
        ? `${colors.activeBg} text-white`
        : `${colors.bg} ${colors.text}`;
};

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

    // Get tag groups for filters
    const categoryTags = getTagsByType('category').filter(t => t.id !== 'personal');
    const levelTags = getTagsByType('level');
    const skillTags = getTagsByType('skill');

    useEffect(() => {
        loadCards();
    }, []);

    const loadCards = async () => {
        setLoading(true);
        try {
            const data = await flashcardService.getDueFlashcards();
            setCards(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this card?")) return;
        try {
            await flashcardService.deletePersonalCard(id);
            setCards(prev => prev.filter(c => c.source_id !== id));
        } catch (err) {
            alert("Failed to delete");
        }
    };

    const handleSaveEdit = async (newData: Partial<CardData['content']>, tags: string[]) => {
        if (!editModal) return;
        try {
            await flashcardService.updatePersonalCard(editModal.source_id!, { ...newData, tags });
            setCards(prev => prev.map(c =>
                c.source_id === editModal.source_id
                    ? { ...c, content: { ...c.content, ...newData }, tags }
                    : c
            ));
            setEditModal(null);
        } catch (err) {
            alert("Failed to update");
        }
    };

    const handleCreate = async (data: { front: string; back: string; tags: string[] }) => {
        try {
            const newCard = await flashcardService.createPersonalCard({
                front: data.front,
                back: data.back,
                tags: data.tags,
            });
            setCards(prev => [newCard, ...prev]);
            setCreateModal(false);
        } catch (err) {
            alert("Failed to create card");
        }
    };

    const toggleFilterTag = (tagId: string) => {
        setFilterTags(prev =>
            prev.includes(tagId)
                ? prev.filter(t => t !== tagId)
                : [...prev, tagId]
        );
    };

    const filteredCards = cards.filter(c => {
        const content = c.content || {};
        const term = filterText.toLowerCase();
        const front = (content.front || content.kanji || "").toString().toLowerCase();
        const back = (content.back || content.meaning || "").toString().toLowerCase();
        const matchesSearch = front.includes(term) || back.includes(term);

        // Match tags if any selected
        const matchesTags = filterTags.length === 0 ||
            filterTags.some(tagId => (c.tags || []).includes(tagId));

        return matchesSearch && matchesTags;
    });

    const clearFilters = () => {
        setFilterTags([]);
        setFilterText("");
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Manage Deck</h1>
                        <p className="text-slate-500">View, edit, and organize your collection.</p>
                    </div>
                    <button
                        onClick={() => setCreateModal(true)}
                        className="px-6 py-3 bg-brand-green hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-200 flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        <span>Add New Card</span>
                    </button>
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-6 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search cards..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition-all"
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 ${showFilters || filterTags.length > 0
                                ? 'bg-brand-dark text-white border-brand-dark'
                                : 'border-slate-200 text-slate-600 hover:border-brand-dark/30'
                                }`}
                        >
                            <Filter size={18} />
                            <span className="font-bold text-sm">Filter by Tags</span>
                            {filterTags.length > 0 && (
                                <span className="bg-white/20 text-xs font-bold px-1.5 py-0.5 rounded-full">
                                    {filterTags.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Expanded Filters */}
                    {showFilters && (
                        <div className="bg-slate-50 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            {/* Active Tags */}
                            {filterTags.length > 0 && (
                                <div className="flex flex-wrap gap-2 pb-3 border-b border-slate-200">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider self-center mr-2">
                                        Active:
                                    </span>
                                    {filterTags.map(tagId => {
                                        const tag = getTagById(tagId);
                                        return tag ? (
                                            <button
                                                key={tagId}
                                                onClick={() => toggleFilterTag(tagId)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${getTagColor(tagId, true)}`}
                                            >
                                                {tag.label}
                                                <X size={12} />
                                            </button>
                                        ) : null;
                                    })}
                                    <button
                                        onClick={clearFilters}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}

                            {/* Category Tags */}
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                    Category
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {categoryTags.map(tag => (
                                        <button
                                            key={tag.id}
                                            onClick={() => toggleFilterTag(tag.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterTags.includes(tag.id)
                                                ? getTagColor(tag.id, true)
                                                : getTagColor(tag.id, false) + ' hover:scale-105'
                                                }`}
                                        >
                                            {tag.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Level Tags */}
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                    JLPT Level
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {levelTags.map(tag => (
                                        <button
                                            key={tag.id}
                                            onClick={() => toggleFilterTag(tag.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterTags.includes(tag.id)
                                                ? getTagColor(tag.id, true)
                                                : getTagColor(tag.id, false) + ' hover:scale-105'
                                                }`}
                                        >
                                            {tag.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Skill Tags */}
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                    Skill Level
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {skillTags.map(tag => (
                                        <button
                                            key={tag.id}
                                            onClick={() => toggleFilterTag(tag.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterTags.includes(tag.id)
                                                ? getTagColor(tag.id, true)
                                                : getTagColor(tag.id, false) + ' hover:scale-105'
                                                }`}
                                        >
                                            {tag.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Results count */}
                <div className="mb-4 text-sm text-slate-500">
                    Showing <span className="font-bold text-slate-800">{filteredCards.length}</span> cards
                    {filterTags.length > 0 && " matching your filters"}
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-400 font-bold tracking-wider">
                                <th className="p-4 pl-6">Front</th>
                                <th className="p-4">Back</th>
                                <th className="p-4">Tags</th>
                                <th className="p-4">Type</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading your cards...</td></tr>
                            )}
                            {!loading && filteredCards.length === 0 && (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">
                                    No cards found.
                                    {filterTags.length > 0 && (
                                        <button onClick={clearFilters} className="text-brand-green font-bold ml-2 hover:underline">
                                            Clear filters
                                        </button>
                                    )}
                                </td></tr>
                            )}
                            {filteredCards.map((card) => {
                                const content = card.content || {};
                                return (
                                    <tr key={card._id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setEditModal(card)}>
                                        <td className="p-4 pl-6 font-bold text-slate-800 text-lg">
                                            {content.front || content.kanji || "?"}
                                        </td>
                                        <td className="p-4 text-slate-600 max-w-xs truncate">
                                            {content.back || content.meaning || "?"}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {(card.tags || []).slice(0, 3).map(tagId => {
                                                    const tag = getTagById(tagId);
                                                    return tag ? (
                                                        <span
                                                            key={tagId}
                                                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getTagColor(tagId, false)}`}
                                                        >
                                                            {tag.label}
                                                        </span>
                                                    ) : null;
                                                })}
                                                {(card.tags || []).length > 3 && (
                                                    <span className="text-xs text-slate-400">+{card.tags!.length - 3}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${card.card_type === 'PERSONAL' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {card.card_type === 'PERSONAL' ? 'Personal' : 'Static'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditModal(card); }}
                                                    className="p-2 text-slate-400 hover:text-brand-green hover:bg-brand-green/10 rounded-lg"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                {card.card_type === 'PERSONAL' && (
                                                    <button
                                                        onClick={(e) => handleDelete(card.source_id!, e)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Create Modal */}
            {createModal && (
                <CardFormModal
                    mode="create"
                    onClose={() => setCreateModal(false)}
                    onSave={(data) => handleCreate(data)}
                />
            )}

            {/* Edit Modal */}
            {editModal && (
                <CardFormModal
                    mode="edit"
                    card={editModal}
                    onClose={() => setEditModal(null)}
                    onSave={(data) => handleSaveEdit({ front: data.front, back: data.back }, data.tags)}
                />
            )}
        </div>
    );
}

// ==================== Card Form Modal ====================

interface CardFormModalProps {
    mode: 'create' | 'edit';
    card?: CardData;
    onClose: () => void;
    onSave: (data: { front: string; back: string; tags: string[] }) => void;
}

function CardFormModal({ mode, card, onClose, onSave }: CardFormModalProps) {
    const [front, setFront] = useState(card?.content?.front || card?.content?.kanji || "");
    const [back, setBack] = useState(card?.content?.back || card?.content?.meaning || "");
    const [selectedTags, setSelectedTags] = useState<string[]>(card?.tags || []);

    const categoryTags = getTagsByType('category').filter(t => t.id !== 'personal');
    const levelTags = getTagsByType('level');
    const skillTags = getTagsByType('skill');

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(t => t !== tagId)
                : [...prev, tagId]
        );
    };

    const handleSubmit = () => {
        if (!front.trim()) {
            alert("Front side is required");
            return;
        }
        onSave({ front, back, tags: selectedTags });
    };

    const isStatic = mode === 'edit' && card?.card_type !== 'PERSONAL';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mode === 'create' ? 'bg-brand-green text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {mode === 'create' ? <Plus size={20} /> : <Edit3 size={20} />}
                        </div>
                        <h3 className="font-bold text-xl text-slate-800">
                            {mode === 'create' ? 'Create New Card' : 'Edit Card'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 flex flex-col gap-5 overflow-y-auto flex-1">
                    {isStatic && (
                        <div className="p-3 bg-yellow-50 text-yellow-700 text-sm rounded-xl">
                            Static cards cannot be edited. Changes here are local notes only.
                        </div>
                    )}

                    {/* Front */}
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">
                            Front Side *
                        </label>
                        <input
                            type="text"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition-all"
                            placeholder="Word, kanji, or question..."
                            value={front}
                            onChange={(e) => setFront(e.target.value)}
                            disabled={isStatic}
                        />
                    </div>

                    {/* Back */}
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">
                            Back Side
                        </label>
                        <textarea
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl h-28 resize-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition-all"
                            placeholder="Meaning, reading, or answer..."
                            value={back}
                            onChange={(e) => setBack(e.target.value)}
                            disabled={isStatic}
                        />
                    </div>

                    {/* Tags Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <TagIcon size={16} className="text-slate-400" />
                            <label className="text-xs font-bold uppercase text-slate-400">
                                Tags
                            </label>
                        </div>

                        {/* Selected Tags */}
                        {selectedTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 pb-3 border-b border-slate-100">
                                {selectedTags.map(tagId => {
                                    const tag = getTagById(tagId);
                                    return tag ? (
                                        <button
                                            key={tagId}
                                            onClick={() => toggleTag(tagId)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${getTagColor(tagId, true)}`}
                                        >
                                            {tag.label}
                                            <X size={12} />
                                        </button>
                                    ) : null;
                                })}
                            </div>
                        )}

                        {/* Category */}
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                Category
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {categoryTags.map(tag => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => toggleTag(tag.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedTags.includes(tag.id)
                                            ? getTagColor(tag.id, true)
                                            : getTagColor(tag.id, false) + ' hover:scale-105'
                                            }`}
                                    >
                                        {tag.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Level */}
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                JLPT Level
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {levelTags.map(tag => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => toggleTag(tag.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedTags.includes(tag.id)
                                            ? getTagColor(tag.id, true)
                                            : getTagColor(tag.id, false) + ' hover:scale-105'
                                            }`}
                                    >
                                        {tag.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Skill Level */}
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                Skill Level
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {skillTags.map(tag => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => toggleTag(tag.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedTags.includes(tag.id)
                                            ? getTagColor(tag.id, true)
                                            : getTagColor(tag.id, false) + ' hover:scale-105'
                                            }`}
                                    >
                                        {tag.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center flex-shrink-0">
                    <div className="text-xs text-slate-400">
                        {selectedTags.length} tags selected
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-200/50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!front.trim()}
                            className="px-6 py-3 font-bold text-white bg-brand-green hover:bg-green-500 rounded-xl shadow-lg shadow-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Check size={18} />
                            {mode === 'create' ? 'Create Card' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
