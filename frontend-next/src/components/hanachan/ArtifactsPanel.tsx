import React, { useState, useEffect } from "react";
import {
    ChevronRight,
    ChevronLeft,
    Library,
    BrainCircuit,
    Gamepad2,
    X,
    Maximize2,
    Minimize2,
    StickyNote
} from "lucide-react";
import { FlashcardArtifact } from "./artifacts/FlashcardArtifact";
import { MindmapArtifact } from "./artifacts/MindmapArtifact";
import { TaskArtifact } from "./artifacts/TaskArtifact";
import { Artifact } from "@/types/chat";


export type PanelState = 'collapsed' | 'minimized' | 'expanded';

interface ArtifactsPanelProps {
    state: PanelState;
    setState: (state: PanelState) => void;
    artifacts: Artifact[];
    activeArtifact: Artifact | null;
    onArtifactSelect: (artifact: Artifact) => void;
}

export default function ArtifactsPanel({
    state,
    setState,
    artifacts,
    activeArtifact,
    onArtifactSelect
}: ArtifactsPanelProps) {

    // Helper to get Icon for artifact type
    const getArtifactIcon = (type: string) => {
        switch (type) {
            case 'flashcard': return <Library size={20} />;
            case 'mindmap': return <BrainCircuit size={20} />;
            case 'task': return <StickyNote size={20} />;
            default: return <Library size={20} />;
        }
    };

    // Determine width class based on state
    const getWidthClass = () => {
        switch (state) {
            case 'collapsed': return 'w-0 border-l-0';
            case 'minimized': return 'w-[300px] border-l-2';
            case 'expanded': return 'w-[600px] border-l-2';
        }
    };

    return (
        <div
            className={`
                h-full bg-white border-l-slate-100 shadow-xl z-20
                transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]
                flex flex-col overflow-hidden relative flex-shrink-0
                ${getWidthClass()}
            `}
        >
            {/* --- MINIMIZED STATE CONTENT (Now List View) --- */}
            <div className={`
                absolute inset-y-0 left-0 w-[300px] flex flex-col py-4 bg-slate-50 border-r border-slate-100/50
                transition-opacity duration-300
                ${state === 'minimized' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
            `}>
                {/* Header for List View */}
                <div className="px-6 mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-brand-dark">Session Artifacts</h2>
                    <button
                        onClick={() => setState('collapsed')}
                        className="p-2 -mr-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                        title="Close Panel"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Dynamic Attributes List */}
                <div className="flex flex-col gap-3 w-full px-4 overflow-y-auto no-scrollbar pb-20">
                    {artifacts.length === 0 && (
                        <div className="text-center text-slate-400 mt-10 px-4">
                            <Library className="mx-auto mb-2 opacity-30" size={32} />
                            <p className="text-sm">No artifacts created yet. Ask Hanachan to make a flashcard or mindmap!</p>
                        </div>
                    )}
                    {artifacts.map((artifact, idx) => (
                        <button
                            key={idx}
                            onClick={() => { onArtifactSelect(artifact); }}
                            className={`
                                flex items-start gap-4 p-4 rounded-xl transition-all border text-left group
                                ${activeArtifact === artifact
                                    ? 'bg-white border-brand-peach shadow-md ring-1 ring-brand-peach/20'
                                    : 'bg-white border-slate-200 hover:border-brand-peach/50 hover:shadow-sm'}
                            `}
                        >
                            <div className={`
                                p-3 rounded-lg flex-shrink-0 mt-1
                                ${activeArtifact === artifact ? 'bg-brand-peach text-brand-dark' : 'bg-slate-100 text-slate-500 group-hover:bg-brand-peach/20 group-hover:text-brand-dark'}
                            `}>
                                {getArtifactIcon(artifact.type)}
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-brand-dark truncate">{artifact.content.title || "Untitled Artifact"}</div>
                                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mt-1">{artifact.type}</div>
                                {artifact.content.description && (
                                    <div className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                                        {artifact.content.description}
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>


            {/* --- EXPANDED STATE CONTENT --- */}
            <div className={`
                flex-1 flex flex-col min-w-[600px] h-full
                transition-opacity duration-300 delay-100
                ${state === 'expanded' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
            `}>
                {/* Header */}
                <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4 bg-white/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <button
                            onClick={() => setState('minimized')}
                            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-brand-dark hover:border-brand-dark/20 shadow-sm transition-all"
                            title="Back to List"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="font-bold text-brand-dark flex items-center gap-2 truncate">
                            {activeArtifact && <span className="text-brand-peach">{getArtifactIcon(activeArtifact.type)}</span>}
                            <span className="truncate text-lg">{activeArtifact?.content.title || "Artifact Details"}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setState('collapsed')}
                            className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 flex flex-col relative">

                    {activeArtifact ? (
                        /* Dynamic Artifact Rendering */
                        <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {activeArtifact.type === 'flashcard' && <FlashcardArtifact content={activeArtifact.content} />}
                            {activeArtifact.type === 'mindmap' && <MindmapArtifact content={activeArtifact.content} />}
                            {activeArtifact.type === 'task' && <TaskArtifact content={activeArtifact.content} />}
                        </div>
                    ) : (
                        /* Empty State / Placeholder */
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-8 opacity-50">
                            <Library size={48} className="mb-4 opacity-50" />
                            <h3 className="font-bold text-lg mb-1">No Artifact Selected</h3>
                            <p className="text-sm">Select an item from the sidebar list to view details.</p>
                        </div>
                    )}

                </div>
            </div>

        </div>
    );
}
