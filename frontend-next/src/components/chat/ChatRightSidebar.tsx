
"use client";

import React from 'react';
import useSWR from 'swr';
import { useChatLayout } from './ChatLayoutContext';
import { Artifact, ArtifactType } from '@/types/artifact';
import { artifactService } from '@/services/artifactService';
import { useUser } from '@/context/UserContext';
import { NoteRenderer } from '../artifacts/NoteRenderer';
import { FlashcardRenderer } from '../artifacts/FlashcardRenderer';
import { QuizRenderer } from '../artifacts/QuizRenderer';
import {
    PanelRightOpen,
    PanelRightClose,
    ChevronLeft,
    ChevronRight,
    FileText,
    CheckSquare,
    Save,
    MoreHorizontal,
    X,
    Plus,
    BookOpen,
    BrainCircuit,
    Layers,
    Lock
} from 'lucide-react';

export function ChatRightSidebar() {
    const { rightSidebar, setRightSidebar, activeArtifact, openArtifact, setActiveArtifact, effectiveConversationId } = useChatLayout();
    const { user } = useUser();

    // Only fetch artifacts if user is authenticated and we have a conversation - security guard
    const { data: artifacts, error } = useSWR<Artifact[]>(
        effectiveConversationId && user ? ['artifacts', effectiveConversationId, user.id] : null,
        () => artifactService.listByConversation(effectiveConversationId!, user?.id?.toString())
    );

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
                        {(!artifacts || artifacts.length === 0) && (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                No artifacts yet. Ask Hanachan to create some!
                            </div>
                        )}

                        {artifacts?.map(artifact => (
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
                                    <p className="text-xs text-slate-400 flex items-center gap-1">
                                        {formatArtifactType(artifact.type)}
                                        {artifact.metadata?.status === 'new' && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                                        )}
                                    </p>
                                </div>
                                <ChevronLeft size={16} className="text-slate-300 group-hover:text-brand-green opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-x-1" />
                            </button>
                        ))}
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
                                <h3 className="font-bold text-brand-dark leading-tight line-clamp-1">{activeArtifact.title}</h3>
                                <p className="text-xs text-slate-500 capitalize">{formatArtifactType(activeArtifact.type)} Viewer</p>
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
                        onClick={() => {
                            setRightSidebar('minimized');
                            setActiveArtifact(null);
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        title="Close Viewer"
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

function ArtifactContent({ artifact }: { artifact: Artifact }) {
    switch (artifact.type) {
        case 'flashcard':
        case 'flashcard_deck': // Handle both types
            return <FlashcardRenderer artifact={artifact} />;
        case 'quiz':
        case 'exam':
            return <QuizRenderer artifact={artifact} />;
        case 'note':
            return <NoteRenderer artifact={artifact} />;
        default:
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <p>Viewer for <strong>{artifact.type}</strong> not implemented yet.</p>
                    <pre className="mt-4 text-xs bg-slate-100 p-4 rounded text-left overflow-auto max-w-full">
                        {JSON.stringify(artifact.data, null, 2)}
                    </pre>
                </div>
            );
    }
}

function ArtifactIcon({ type }: { type: string }) {
    const icons: Record<string, React.ReactNode> = {
        flashcard: <Layers size={18} className="text-brand-green" />,
        flashcard_deck: <Layers size={18} className="text-brand-green" />,
        quiz: <CheckSquare size={18} className="text-purple-500" />,
        exam: <BookOpen size={18} className="text-red-500" />,
        note: <FileText size={18} className="text-blue-500" />,
        mindmap: <BrainCircuit size={18} className="text-orange-500" />,
    };
    return icons[type] || <FileText size={18} className="text-slate-400" />;
}

function formatArtifactType(type: string): string {
    return type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}
