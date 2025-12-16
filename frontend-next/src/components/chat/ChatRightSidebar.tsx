"use client";

import React, { useState } from 'react';
import { useChatLayout } from './ChatLayoutContext';
import {
    PanelRightOpen,
    PanelRightClose,
    ChevronLeft,
    ChevronRight,
    FileText,
    Sparkles,
    BookOpen,
    Languages,
    Network,
    CheckSquare,
    GraduationCap
} from 'lucide-react';

// Mock artifacts
const mockArtifacts = [
    { id: '1', type: 'flashcard', title: 'N5 Verbs Deck', count: 12 },
    { id: '2', type: 'quiz', title: 'Grammar Quiz', count: 5 },
    { id: '3', type: 'vocabulary', title: 'Daily Words', count: 8 },
    { id: '4', type: 'mindmap', title: 'Verb Conjugation', count: 1 },
];

// Knowledge tree data
const knowledgeTree = [
    {
        id: 'writing',
        title: 'Japanese Writing Systems',
        children: [
            { id: 'hiragana', title: 'Hiragana (ひらがな)' },
            { id: 'katakana', title: 'Katakana (カタカナ)' },
            { id: 'kanji', title: 'Kanji (漢字)' },
        ]
    },
    {
        id: 'grammar',
        title: 'Grammar Patterns',
        children: [
            { id: 'particles', title: 'Particles' },
            { id: 'verbs', title: 'Verb Forms' },
            { id: 'adjectives', title: 'Adjectives' },
        ]
    },
    {
        id: 'vocabulary',
        title: 'Vocabulary',
        children: [
            { id: 'n5', title: 'JLPT N5' },
            { id: 'n4', title: 'JLPT N4' },
            { id: 'n3', title: 'JLPT N3' },
        ]
    },
];

export function ChatRightSidebar() {
    const { rightSidebar, setRightSidebar, toggleRightSidebar } = useChatLayout();
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['writing']));

    const toggleNode = (id: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedNodes(newExpanded);
    };

    // Collapsed state - just a toggle button
    if (rightSidebar === 'collapsed') {
        return (
            <div className="flex flex-col items-center py-3 h-full">
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

    // Minimized state - artifact list
    if (rightSidebar === 'minimized') {
        return (
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-slate-100">
                    <h3 className="font-display font-bold text-brand-dark">Session Artifacts</h3>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setRightSidebar('expanded')}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                            title="Expand"
                        >
                            <ChevronLeft size={18} />
                        </button>
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
                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-brand-green/10 transition-colors group text-left"
                            >
                                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-brand-green/30 transition-colors">
                                    <ArtifactIcon type={artifact.type} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-brand-dark truncate group-hover:text-brand-green transition-colors">
                                        {artifact.title}
                                    </h4>
                                    <p className="text-xs text-slate-400">
                                        {artifact.count} items
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Quick Actions</p>
                        <div className="grid grid-cols-2 gap-2">
                            <QuickActionButton icon={<GraduationCap size={16} />} label="Practice" />
                            <QuickActionButton icon={<Languages size={16} />} label="Translate" />
                            <QuickActionButton icon={<CheckSquare size={16} />} label="Quiz Me" />
                            <QuickActionButton icon={<Sparkles size={16} />} label="Summary" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Expanded state - full knowledge explorer
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
                <h3 className="font-display font-bold text-brand-dark">Knowledge Explorer</h3>
                <div className="flex gap-1">
                    <button
                        onClick={() => setRightSidebar('minimized')}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                        title="Minimize"
                    >
                        <ChevronRight size={18} />
                    </button>
                    <button
                        onClick={() => setRightSidebar('collapsed')}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                        title="Close"
                    >
                        <PanelRightClose size={18} />
                    </button>
                </div>
            </div>

            {/* Knowledge Tree */}
            <div className="flex-1 overflow-y-auto p-3">
                <div className="space-y-1">
                    {knowledgeTree.map(node => (
                        <div key={node.id}>
                            <button
                                onClick={() => toggleNode(node.id)}
                                className="w-full flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                            >
                                <div className={`transition-transform duration-200 ${expandedNodes.has(node.id) ? 'rotate-90' : ''}`}>
                                    <ChevronRight size={16} className="text-slate-400" />
                                </div>
                                <Network size={16} className="text-brand-green" />
                                <span className="font-semibold text-sm text-brand-dark group-hover:text-brand-green transition-colors">
                                    {node.title}
                                </span>
                            </button>

                            {expandedNodes.has(node.id) && (
                                <div className="ml-6 mt-1 space-y-1">
                                    {node.children.map(child => (
                                        <button
                                            key={child.id}
                                            className="w-full flex items-center gap-2 p-2 pl-4 rounded-lg hover:bg-brand-green/10 transition-colors group text-left"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-brand-green transition-colors" />
                                            <span className="text-sm text-slate-600 group-hover:text-brand-green transition-colors">
                                                {child.title}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Session Artifacts Section */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                    <h4 className="font-display font-bold text-brand-dark mb-3">Session Artifacts</h4>
                    <div className="space-y-2">
                        {mockArtifacts.map(artifact => (
                            <button
                                key={artifact.id}
                                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group text-left"
                            >
                                <ArtifactIcon type={artifact.type} />
                                <span className="text-sm text-slate-600 group-hover:text-brand-green transition-colors truncate">
                                    {artifact.title}
                                </span>
                                <span className="text-xs text-slate-400 ml-auto">{artifact.count}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ArtifactIcon({ type }: { type: string }) {
    const icons: Record<string, React.ReactNode> = {
        flashcard: <FileText size={16} className="text-brand-green" />,
        quiz: <GraduationCap size={16} className="text-purple-500" />,
        vocabulary: <Languages size={16} className="text-blue-500" />,
        mindmap: <Network size={16} className="text-orange-500" />,
    };
    return icons[type] || <FileText size={16} className="text-slate-400" />;
}

function QuickActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <button className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-brand-green/30 hover:bg-brand-green/5 transition-colors text-sm text-slate-600 hover:text-brand-green">
            {icon}
            <span className="font-medium">{label}</span>
        </button>
    );
}
