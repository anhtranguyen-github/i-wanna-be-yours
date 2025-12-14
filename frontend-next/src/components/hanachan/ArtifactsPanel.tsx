import React from "react";
import {
    ChevronLeft,
    Library,
    BrainCircuit,
    X,
    StickyNote,
    BookOpen
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

    const getArtifactIcon = (type: string) => {
        switch (type) {
            case 'flashcard': return <BookOpen size={20} />;
            case 'mindmap': return <BrainCircuit size={20} />;
            case 'task': return <StickyNote size={20} />;
            default: return <Library size={20} />;
        }
    };

    const getWidthClass = () => {
        switch (state) {
            case 'collapsed': return 'w-0 border-l-0';
            case 'minimized': return 'w-[320px] border-l';
            case 'expanded': return 'w-[600px] border-l';
        }
    };

    return (
        <div
            className={`
                h-full bg-white/95 backdrop-blur-xl border-slate-100/50 shadow-2xl z-20
                transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                flex flex-col overflow-hidden relative flex-shrink-0
                ${getWidthClass()}
            `}
        >
            {/* Gradient Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-peach via-brand-green to-brand-softBlue" />

            {/* --- MINIMIZED STATE - List View --- */}
            <div className={`
                absolute inset-y-0 left-0 w-[320px] flex flex-col pt-5 bg-gradient-to-b from-slate-50/80 to-white border-r border-slate-100/50
                transition-all duration-300
                ${state === 'minimized' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
            `}>
                {/* Header */}
                <div className="px-5 mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-brand-dark">Session Artifacts</h2>
                    <button
                        onClick={() => setState('collapsed')}
                        className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Close Panel"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Artifact List */}
                <div className="flex flex-col gap-3 w-full px-4 overflow-y-auto pb-20">
                    {artifacts.length === 0 && (
                        <div className="text-center text-slate-400 mt-16 px-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Library className="opacity-40" size={28} />
                            </div>
                            <p className="text-sm leading-relaxed">No artifacts yet. Ask Hanachan to create a flashcard or mindmap!</p>
                        </div>
                    )}
                    {artifacts.map((artifact, idx) => (
                        <button
                            key={idx}
                            onClick={() => { onArtifactSelect(artifact); }}
                            className={`
                                flex items-start gap-4 p-4 rounded-2xl transition-all border text-left group
                                ${activeArtifact === artifact
                                    ? 'bg-gradient-to-r from-brand-peach/10 to-brand-green/5 border-brand-peach/30 shadow-md'
                                    : 'bg-white border-slate-100 hover:border-brand-peach/30 hover:shadow-sm hover:scale-[1.01]'}
                            `}
                        >
                            <div className={`
                                p-3 rounded-xl flex-shrink-0 transition-all
                                ${activeArtifact === artifact
                                    ? 'bg-brand-peach text-white shadow-lg'
                                    : 'bg-slate-100 text-slate-500 group-hover:bg-brand-peach/20 group-hover:text-brand-dark'}
                            `}>
                                {getArtifactIcon(artifact.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="font-bold text-brand-dark truncate">{artifact.content.title || "Untitled Artifact"}</div>
                                <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider mt-1">{artifact.type}</div>
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


            {/* --- EXPANDED STATE --- */}
            <div className={`
                flex-1 flex flex-col min-w-[600px] h-full
                transition-all duration-300 delay-100
                ${state === 'expanded' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
            `}>
                {/* Header */}
                <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4 bg-white/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <button
                            onClick={() => setState('minimized')}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-brand-dark hover:border-brand-dark/20 shadow-sm hover:shadow transition-all"
                            title="Back to List"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div className="font-bold text-brand-dark flex items-center gap-3 truncate">
                            {activeArtifact && (
                                <span className="p-2 rounded-lg bg-brand-peach/20 text-brand-peach">
                                    {getArtifactIcon(activeArtifact.type)}
                                </span>
                            )}
                            <span className="truncate text-lg">{activeArtifact?.content.title || "Artifact Details"}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setState('collapsed')}
                        className="p-2.5 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-all"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50/50 to-white flex flex-col relative">

                    {activeArtifact ? (
                        <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {activeArtifact.type === 'flashcard' && <FlashcardArtifact content={activeArtifact.content} />}
                            {activeArtifact.type === 'mindmap' && <MindmapArtifact content={activeArtifact.content} />}
                            {activeArtifact.type === 'task' && <TaskArtifact content={activeArtifact.content} />}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-8">
                            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                                <Library size={36} className="opacity-40" />
                            </div>
                            <h3 className="font-bold text-lg mb-2 text-slate-500">No Artifact Selected</h3>
                            <p className="text-sm">Select an item from the sidebar list to view details.</p>
                        </div>
                    )}

                </div>
            </div>

        </div>
    );
}
