
"use client";

import React from 'react';
import { useChatLayout } from './ChatLayoutContext';
import { useChatConversation } from './ChatConversationContext';
import { Artifact } from '@/types/artifact';
import { useArtifacts } from '@/hooks/useArtifacts';
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
    Lock,
    Loader2
} from 'lucide-react';

export function ChatRightSidebar() {
    const { rightSidebar, setRightSidebar, activeArtifact, openArtifact, setActiveArtifact } = useChatLayout();
    const { effectiveConversationId } = useChatConversation();

    // Use the new useArtifacts hook for consistent SWR-based artifact management
    const { artifacts, isLoading, error } = useArtifacts(effectiveConversationId);

    // SAFETY CHECK: Ensure no stale artifacts show when no conversation is selected
    const displayArtifacts = effectiveConversationId ? artifacts : [];

    // COLLAPSED STATE
    if (rightSidebar === 'collapsed') {
        return (
            <div className="flex flex-col items-center py-4 h-full border-l border-neutral-gray/20 bg-secondary shadow-inner">
                <button
                    onClick={() => setRightSidebar('minimized')}
                    className="p-2.5 rounded-2xl hover:bg-muted text-muted-foreground transition-all active:scale-95"
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
            <div className="flex flex-col h-full border-l border-border bg-sidebar ">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-neutral-gray/30 bg-neutral-beige">
                    <h3 className="font-display font-black text-neutral-ink tracking-widest text-xs uppercase">Resources</h3>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setRightSidebar('collapsed')}
                            className="p-2 rounded-2xl hover:bg-muted text-muted-foreground transition-all active:scale-95"
                            title="Close"
                        >
                            <PanelRightClose size={18} />
                        </button>
                    </div>
                </div>

                {/* Artifact List */}
                <div className="flex-1 overflow-y-auto p-3">
                    <div className="space-y-3">
                        {/* Loading State */}
                        {isLoading && (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border animate-pulse">
                                        <div className="w-12 h-12 rounded-xl bg-muted" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-muted rounded w-3/4" />
                                            <div className="h-2 bg-muted rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty State */}
                        {!isLoading && displayArtifacts.length === 0 && (
                            <div className="text-center py-12 px-4">
                                <FileText size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                                <p className="text-sm font-bold text-muted-foreground">
                                    No resources yet. Let&apos;s create some together!
                                </p>
                            </div>
                        )}

                        {/* Artifact Cards */}
                        {!isLoading && displayArtifacts.map(artifact => (
                            <button
                                key={artifact.id}
                                onClick={() => openArtifact(artifact)}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-neutral-white border border-neutral-gray/20 hover:border-primary/40 shadow-sm hover:shadow-xl transition-all group text-left relative overflow-hidden"
                            >
                                <div className="w-12 h-12 rounded-xl bg-muted/50 border border-border flex items-center justify-center group-hover:border-primary/20 transition-colors ">
                                    <ArtifactIcon type={artifact.type} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-foreground truncate group-hover:text-primary transition-colors font-display">
                                        {artifact.title}
                                    </h4>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        {formatArtifactType(artifact.type)}
                                        {artifact.metadata?.status === 'new' && (
                                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                                        )}
                                    </p>
                                </div>
                                <ChevronLeft size={18} className="text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-x-1" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // EXPANDED STATE (Artifact Window)
    return (
        <div className="flex flex-col h-full border-l border-neutral-gray/30 bg-neutral-white relative z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.05)]">
            {/* Window Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-gray/20 bg-neutral-beige shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setRightSidebar('minimized')}
                        className="p-2 rounded-2xl hover:bg-muted text-muted-foreground transition-all active:scale-95"
                        title="Back to list"
                    >
                        <ChevronRight size={22} />
                    </button>
                    {activeArtifact && (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center ">
                                <ArtifactIcon type={activeArtifact.type} />
                            </div>
                            <div>
                                <h3 className="font-display font-black text-foreground leading-tight line-clamp-1 truncate tracking-tight">{activeArtifact.title}</h3>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{formatArtifactType(activeArtifact.type)} Viewer</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary-strong text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 font-display shadow-lg shadow-primary/20">
                        <Save size={18} />
                        Save
                    </button>
                    <button className="p-2.5 rounded-2xl hover:bg-muted text-muted-foreground transition-all active:scale-95">
                        <MoreHorizontal size={22} />
                    </button>
                    <div className="w-px h-8 bg-border mx-1" />
                    <button
                        onClick={() => {
                            setRightSidebar('minimized');
                            setActiveArtifact(null);
                        }}
                        className="p-2.5 rounded-2xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all active:scale-95"
                        title="Close Viewer"
                    >
                        <X size={22} />
                    </button>
                </div>
            </div>

            {/* Artifact Content Area */}
            <div className="flex-1 overflow-auto bg-muted/10 p-8">
                {activeArtifact ? (
                    <ArtifactContent artifact={activeArtifact} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50">
                        <FileText size={64} className="mb-6 opacity-30 animate-pulse" />
                        <p className="text-lg font-bold font-display">Select a resource to view</p>
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
        flashcard: <Layers size={18} className="text-primary" />,
        flashcard_deck: <Layers size={18} className="text-primary" />,
        quiz: <CheckSquare size={18} className="text-grammar" />,
        exam: <BookOpen size={18} className="text-destructive font-bold" />,
        note: <FileText size={18} className="text-accent" />,
        mindmap: <BrainCircuit size={18} className="text-kanji" />,
    };
    return icons[type] || <FileText size={18} className="text-muted-foreground" />;
}

function formatArtifactType(type: string): string {
    return type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}
