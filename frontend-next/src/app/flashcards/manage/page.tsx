"use client";

import React, { useState, useEffect } from "react";
import { flashcardService } from "@/services/flashcardService";
import {
    Search,
    Filter,
    Trash2,
    Edit3,
    MoreHorizontal,
    Plus,
    X,
    Check
} from "lucide-react";

export default function ManageDeckPage() {
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState("");
    const [editModal, setEditModal] = useState<any>(null); // Card being edited

    useEffect(() => {
        loadCards();
    }, []);

    const loadCards = async () => {
        setLoading(true);
        try {
            // For now, reuse getDueFlashcards or create a separate getAll endpoint
            // Since we don't have a getAll, we'll use getDue for demo, 
            // BUT really we should add a getAll endpoint in backend.
            // Using getDue for now is a temporary hack to show UI.
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

    const handleSaveEdit = async (newData: any) => {
        try {
            await flashcardService.updatePersonalCard(editModal.source_id, newData);
            setCards(prev => prev.map(c =>
                c.source_id === editModal.source_id
                    ? { ...c, content: { ...c.content, ...newData } }
                    : c
            ));
            setEditModal(null);
        } catch (err) {
            alert("Failed to update");
        }
    };

    const filteredCards = cards.filter(c => {
        const content = c.content || {};
        const term = filterText.toLowerCase();
        const front = (content.front || content.kanji || "").toString().toLowerCase();
        const back = (content.back || content.meaning || "").toString().toLowerCase();
        return front.includes(term) || back.includes(term);
    });

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Manage Deck</h1>
                        <p className="text-slate-500">View, edit, and organize your collection.</p>
                    </div>
                    <button className="btn-primary flex items-center gap-2">
                        <Plus size={20} />
                        <span>Add New Card</span>
                    </button>
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search cards..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-brand-peach outline-none transition-all"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2">
                            <Filter size={18} />
                            <span>Filter</span>
                        </button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-400 font-bold tracking-wider">
                                <th className="p-4 pl-6">Front</th>
                                <th className="p-4">Back</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Deck</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading your cards...</td></tr>
                            )}
                            {!loading && filteredCards.length === 0 && (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No cards found.</td></tr>
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
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${card.card_type === 'PERSONAL' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {card.card_type === 'PERSONAL' ? 'Personal' : 'Static'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                {card.deck_name || "Default"}
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
                                                        onClick={(e) => handleDelete(card.source_id, e)}
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

            {/* Simple Edit Modal */}
            {editModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-xl text-slate-800">Edit Card</h3>
                            <button onClick={() => setEditModal(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            {/* Read Only notice if static */}
                            {editModal.card_type !== 'PERSONAL' && (
                                <div className="p-3 bg-yellow-50 text-yellow-700 text-sm rounded-xl mb-2">
                                    Static cards cannot be edited directly. Changes here are local notes only.
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Front</label>
                                <input
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg focus:border-brand-peach outline-none"
                                    defaultValue={editModal.content?.front || editModal.content?.kanji}
                                    id="edit-front"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Back</label>
                                <textarea
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-24 resize-none focus:border-brand-peach outline-none"
                                    defaultValue={editModal.content?.back || editModal.content?.meaning}
                                    id="edit-back"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                            <button onClick={() => setEditModal(null)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-200/50 rounded-xl">Cancel</button>
                            <button
                                onClick={() => {
                                    const front = (document.getElementById('edit-front') as HTMLInputElement).value;
                                    const back = (document.getElementById('edit-back') as HTMLInputElement).value;
                                    handleSaveEdit({ front, back });
                                }}
                                className="px-6 py-3 font-bold text-white bg-brand-green hover:bg-green-500 rounded-xl shadow-lg shadow-green-200"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
