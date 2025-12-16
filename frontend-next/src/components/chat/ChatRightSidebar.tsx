"use client";

import React from 'react';
import { useChatLayout, ActiveArtifact } from './ChatLayoutContext';
import {
    PanelRightOpen,
    PanelRightClose,
    ChevronLeft,
    ChevronRight,
    FileText,
    Sparkles,
    CheckSquare,
    GraduationCap,
    Edit3,
    Save,
    MoreHorizontal,
    X,
    Plus
} from 'lucide-react';

// Mock artifacts (Vocab/Mindmap removed)
const mockArtifacts = [
    { id: '1', type: 'flashcard', title: 'N5 Verbs Deck', count: 12 },
    { id: '2', type: 'quiz', title: 'Grammar Quiz', count: 5 },
    { id: '3', type: 'flashcard', title: 'Kanji Practice', count: 20 },
    { id: '4', type: 'quiz', title: 'Listing Practice', count: 3 },
];

export function ChatRightSidebar() {
    const { rightSidebar, setRightSidebar, activeArtifact, openArtifact } = useChatLayout();

    // COLLAPSED STATE
    if (rightSidebar === 'collapsed') {
        return (
            <div className="flex flex-col items-center py-4 h-full border-l border-slate-200 bg-white">
                <button
                    onClick={() => setRightSidebar('minimized')}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                    title="Open sidebar"
                >
                    <PanelRightOpen size={20} />
                </button>
            </div>
        );
    }

    // MINIMIZED STATE (List View)
    if (rightSidebar === 'minimized') {
        return (
            <div className="flex flex-col h-full border-l border-slate-200 bg-white">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="font-display font-bold text-brand-dark">Session Artifacts</h3>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setRightSidebar('collapsed')}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                            title="Close"
                        >
                            <PanelRightClose size={18} />
                        </button>
                    </div>
                </div>

                {/* Artifact List */}
                <div className="flex-1 overflow-y-auto p-3">
                    <div className="space-y-2">
                        {mockArtifacts.map(artifact => (
                            <button
                                key={artifact.id}
                                onClick={() => openArtifact(artifact)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-brand-green/10 transition-colors group text-left border border-transparent hover:border-brand-green/20"
                            >
                                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-brand-green/30 transition-colors shadow-sm">
                                    <ArtifactIcon type={artifact.type} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-brand-dark truncate group-hover:text-brand-green transition-colors">
                                        {artifact.title}
                                    </h4>
                                    <p className="text-xs text-slate-400">
                                        {artifact.type.charAt(0).toUpperCase() + artifact.type.slice(1)} • {artifact.count} items
                                    </p>
                                </div>
                                <ChevronLeft size={16} className="text-slate-300 group-hover:text-brand-green opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-x-1" />
                            </button>
                        ))}

                        {/* New Artifact Button (Inline) */}
                        <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-300 hover:border-brand-green hover:bg-brand-green/5 transition-all group text-left text-slate-400 hover:text-brand-green">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 group-hover:bg-white transition-colors">
                                <Plus size={20} />
                            </div>
                            <span className="text-sm font-medium">Create New Artifact</span>
                        </button>
                    </div>

                    {/* Quick Creation Actions (Simplified) */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Quick Actions</p>
                        <div className="grid grid-cols-2 gap-2">
                            <QuickActionButton icon={<FileText size={16} />} label="Flashcard" />
                            <QuickActionButton icon={<CheckSquare size={16} />} label="Quiz" />
                            <QuickActionButton icon={<GraduationCap size={16} />} label="Exercise" />
                            <QuickActionButton icon={<Sparkles size={16} />} label="Summary" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // EXPANDED STATE (Artifact Window)
    return (
        <div className="flex flex-col h-full border-l border-slate-200 bg-white shadow-xl relative z-20">
            {/* Window Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setRightSidebar('minimized')}
                        className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                        title="Back to list"
                    >
                        <ChevronRight size={20} />
                    </button>
                    {activeArtifact && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                                <ArtifactIcon type={activeArtifact.type} />
                            </div>
                            <div>
                                <h3 className="font-bold text-brand-dark leading-tight">{activeArtifact.title}</h3>
                                <p className="text-xs text-slate-500 capitalize">{activeArtifact.type} Editor</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-green text-white text-sm font-medium hover:bg-brand-green/90 transition-colors shadow-sm">
                        <Save size={16} />
                        Save
                    </button>
                    <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-dark transition-colors">
                        <MoreHorizontal size={20} />
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <button
                        onClick={() => setRightSidebar('minimized')}
                        className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        title="Close Editor"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Artifact Content Area */}
            <div className="flex-1 overflow-auto bg-slate-50/30 p-6">
                {activeArtifact ? (
                    <ArtifactContent artifact={activeArtifact} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <FileText size={48} className="mb-4 opacity-50" />
                        <p>Select an artifact to view or edit</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- SUB COMPONENTS ---

function ArtifactContent({ artifact }: { artifact: ActiveArtifact }) {
    switch (artifact.type) {
        case 'flashcard':
            return <FlashcardEditor />;
        case 'quiz':
            return <QuizEditor />;
        default:
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <p>Editor for {artifact.type} not implemented yet.</p>
                </div>
            );
    }
}

function FlashcardEditor() {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-brand-dark">Deck Settings</h2>
                    <button className="text-brand-green text-sm font-medium hover:underline">Edit Details</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                        <div className="text-2xl font-bold text-brand-dark mb-1">12</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Cards</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                        <div className="text-2xl font-bold text-brand-green mb-1">85%</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Retention</div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700">Cards Preview</h3>
                    <button className="flex items-center gap-1 text-sm text-brand-green font-medium">
                        <Edit3 size={14} /> Add Card
                    </button>
                </div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                                {i}
                            </div>
                            <div>
                                <p className="font-jp text-lg font-medium text-brand-dark">食べる</p>
                                <p className="text-sm text-slate-500">To eat</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-lg font-medium">
                                N5
                            </div>
                            <button className="p-2 text-slate-300 hover:text-brand-green transition-colors">
                                <Edit3 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function QuizEditor() {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-brand-dark">Quiz Settings</h2>
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-lg font-bold">Grammar</span>
                </div>
                <p className="text-slate-600 text-sm">Practicing particles and simple conjugation forms.</p>
            </div>

            <div className="grid gap-4">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-green/30 transition-all shadow-sm">
                        <div className="flex justify-between mb-4">
                            <span className="font-bold text-slate-400 text-xs uppercase">Question {i}</span>
                            <button className="text-slate-400 hover:text-brand-dark transition-colors"><MoreHorizontal size={16} /></button>
                        </div>
                        <p className="text-lg font-jp mb-6">私は日本____行きます。</p>
                        <div className="grid grid-cols-2 gap-3">
                            {['に (ni)', 'を (wo)', 'で (de)', 'が (ga)'].map((opt, idx) => (
                                <button key={idx} className={`p-3 border rounded-lg text-left transition-colors text-sm ${idx === 0 ? 'border-brand-green bg-brand-green/5 text-brand-dark font-medium' : 'border-slate-200 hover:bg-slate-50'}`}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ArtifactIcon({ type }: { type: string }) {
    const icons: Record<string, React.ReactNode> = {
        flashcard: <FileText size={18} className="text-brand-green" />,
        quiz: <CheckSquare size={18} className="text-purple-500" />,
    };
    return icons[type] || <FileText size={18} className="text-slate-400" />;
}

function QuickActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <button className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 hover:border-brand-green/30 hover:bg-brand-green/5 transition-colors text-sm text-slate-600 hover:text-brand-green">
            {icon}
            <span className="font-medium">{label}</span>
        </button>
    );
}
