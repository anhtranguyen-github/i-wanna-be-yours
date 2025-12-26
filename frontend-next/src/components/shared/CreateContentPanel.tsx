"use client";

import React, { useState, useEffect } from "react";
import {
    X,
    Sparkles,
    Code,
    FileText,
    Plus,
    ChevronRight,
    Trash2,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Globe,
    Lock,
    Type
} from "lucide-react";
import { authFetch } from "@/lib/authFetch";

interface CreateContentPanelProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'QUOOT' | 'FLASHCARDS' | 'PRACTICE';
    onSave: (data: any) => Promise<void>;
}

type Mode = 'AI_GENERATE' | 'PASTE_JSON' | 'MANUAL';

export function CreateContentPanel({ isOpen, onClose, type, onSave }: CreateContentPanelProps) {
    const [mode, setMode] = useState<Mode>('AI_GENERATE');
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState<'private' | 'public'>('private');
    const [prompt, setPrompt] = useState("");
    const [jsonInput, setJsonInput] = useState("");
    const [manualInput, setManualInput] = useState("");
    const [manualSeparator, setManualSeparator] = useState<'pipe' | 'arrow' | 'comma'>('pipe');
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // New Structured Manual State
    const [manualItems, setManualItems] = useState<any[]>([]);
    const [currentItem, setCurrentItem] = useState<any>({
        front: "", back: "", reading: "", mnemonic: "",
        question: "", options: ["", "", "", ""], correctIndex: 0, explanation: ""
    });

    const typeLabel = type === 'QUOOT' ? 'Arena' : type === 'FLASHCARDS' ? 'Set' : 'Protocol';

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setTitle("");
            setDescription("");
            setVisibility('private');
            setPrompt("");
            setJsonInput("");
            setManualInput("");
            setManualItems([]);
            resetCurrentItem();
            setGeneratedContent(null);
            setError(null);
            setIsPreviewMode(false);
        }
    }, [isOpen]);

    const resetCurrentItem = () => {
        setCurrentItem({
            front: "", back: "", reading: "", mnemonic: "",
            question: "", options: ["", "", "", ""], correctIndex: 0, explanation: ""
        });
    };

    if (!isOpen) return null;

    const handleGenerateAI = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const response = await authFetch('/h-api/v1/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `Create a ${typeLabel.toLowerCase()} about: ${prompt}. Return JSON only.`,
                    type: type,
                    session_id: "creator-session-" + Date.now(),
                    user_id: "creator-user"
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            const artifact = data.responses?.find((r: any) => r.type !== 'text');
            if (artifact && artifact.content) {
                if (type === 'PRACTICE') {
                    const quiz = artifact.content.quiz || artifact.content;
                    setGeneratedContent({
                        title: title || quiz.title || prompt.slice(0, 20),
                        description: description || quiz.description || "",
                        visibility: visibility,
                        items: (quiz.questions || quiz.items || []).map((q: any) => ({
                            question: q.content || q.question,
                            options: q.options?.map((o: any) => o.text || o) || [],
                            correctIndex: q.correctOptionIndex !== undefined ? q.correctOptionIndex : (q.options?.findIndex((o: any) => o.id === q.correctOptionId) || 0),
                            explanation: q.explanation || ""
                        }))
                    });
                } else {
                    setGeneratedContent({
                        title: title || artifact.content.title || prompt.slice(0, 20),
                        description: description || artifact.content.description || "",
                        visibility: visibility,
                        items: artifact.content.flashcards?.cards || artifact.content.vocabulary?.items || artifact.content.items || []
                    });
                }
            }
            setIsPreviewMode(true);
        } catch (err: any) {
            setError(err.message || "Failed to generate content");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddItem = () => {
        const item = { ...currentItem };
        if (type === 'PRACTICE') {
            if (!item.question || item.options.some((o: string) => !o.trim())) {
                setError("Please fill in question and all options");
                return;
            }
        } else {
            if (!item.front || !item.back) {
                setError("Term and Definition are required");
                return;
            }
        }
        setManualItems([...manualItems, item]);
        resetCurrentItem();
        setError(null);
    };

    const handleFinalizeManual = () => {
        if (!title.trim()) {
            setError(`Please name your ${typeLabel}`);
            return;
        }
        if (manualItems.length === 0) {
            setError("Add at least one item first");
            return;
        }
        setGeneratedContent({
            title,
            description,
            visibility,
            items: manualItems
        });
        setIsPreviewMode(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(generatedContent);
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to save content");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-neutral-ink/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-neutral-beige h-full shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-neutral-white border-b border-neutral-gray/20 p-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-neutral-ink font-display">Construct {typeLabel}</h2>
                        <p className="text-neutral-ink/60 font-bold">Forge your personal learning arsenal</p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 bg-neutral-beige rounded-xl flex items-center justify-center hover:bg-neutral-gray/10 transition-colors">
                        <X size={24} />
                    </button>
                </header>

                {/* Tabs */}
                {!isPreviewMode && (
                    <div className="flex bg-neutral-white px-8 border-b border-neutral-gray/10">
                        <Tab active={mode === 'AI_GENERATE'} onClick={() => setMode('AI_GENERATE')} icon={<Sparkles size={16} />} label="AI Forge" />
                        <Tab active={mode === 'MANUAL'} onClick={() => setMode('MANUAL')} icon={<FileText size={16} />} label="Manual Craft" />
                        <Tab active={mode === 'PASTE_JSON'} onClick={() => setMode('PASTE_JSON')} icon={<Code size={16} />} label="JSON Import" />
                    </div>
                )}

                <main className="flex-grow overflow-y-auto p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-600 font-bold">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    {!isPreviewMode ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Common Info Section */}
                            <div className="bg-white border border-neutral-gray/20 rounded-2xl p-6 space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-strong">General Information</h4>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-ink/20" size={18} />
                                        <input
                                            className="w-full bg-neutral-beige/10 border-b border-neutral-gray/20 pl-10 pr-4 py-3 font-bold outline-none focus:border-primary-strong transition-all"
                                            placeholder={`${typeLabel} Title`}
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>
                                    <textarea
                                        className="w-full h-20 bg-neutral-beige/10 border border-neutral-gray/10 rounded-xl p-4 text-sm font-medium outline-none focus:border-primary-strong transition-all"
                                        placeholder="Description (Optional)"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setVisibility('private')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${visibility === 'private' ? 'bg-neutral-ink text-white border-neutral-ink' : 'bg-white text-neutral-ink/40 border-neutral-gray/10 hover:border-neutral-ink/20'}`}
                                        >
                                            <Lock size={14} /> Private
                                        </button>
                                        <button
                                            onClick={() => setVisibility('public')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${visibility === 'public' ? 'bg-primary-strong text-white border-primary-strong' : 'bg-white text-neutral-ink/40 border-neutral-gray/10 hover:border-primary-strong/20'}`}
                                        >
                                            <Globe size={14} /> Public
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {mode === 'AI_GENERATE' && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/40">Prompt Hana</label>
                                    <textarea
                                        className="w-full h-32 bg-white border border-neutral-gray/20 rounded-2xl p-6 font-bold focus:border-primary-strong outline-none transition-all placeholder:text-neutral-gray/40"
                                        placeholder={`E.g. Create a N3 ${typeLabel.toLowerCase()} about travel vocabulary...`}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                    />
                                    <button
                                        onClick={handleGenerateAI}
                                        disabled={isGenerating || !prompt.trim()}
                                        className="w-full py-4 bg-primary-strong text-white rounded-2xl font-black uppercase tracking-widest hover:bg-neutral-ink transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                        {isGenerating ? "Hana is thinking..." : "Generate with AI"}
                                    </button>
                                </div>
                            )}

                            {mode === 'MANUAL' && (
                                <div className="space-y-6">
                                    <div className="bg-white border border-neutral-gray/20 rounded-2xl p-6 space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-strong">Item Builder</h4>
                                        {type === 'PRACTICE' ? (
                                            <div className="space-y-4">
                                                <input className="w-full bg-neutral-beige/10 border-b border-neutral-gray/20 p-2 font-bold outline-none" placeholder="Question Content" value={currentItem.question} onChange={e => setCurrentItem({ ...currentItem, question: e.target.value })} />
                                                <div className="grid grid-cols-2 gap-2">
                                                    {currentItem.options.map((opt: string, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <input type="radio" checked={currentItem.correctIndex === idx} onChange={() => setCurrentItem({ ...currentItem, correctIndex: idx })} />
                                                            <input className="flex-1 bg-neutral-beige/10 border border-neutral-gray/10 p-2 text-sm font-bold rounded-lg" placeholder={`Option ${idx + 1}`} value={opt} onChange={e => {
                                                                const newOpts = [...currentItem.options];
                                                                newOpts[idx] = e.target.value;
                                                                setCurrentItem({ ...currentItem, options: newOpts });
                                                            }} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input className="w-full bg-neutral-beige/10 border-b border-neutral-gray/20 p-2 font-bold outline-none" placeholder="Front" value={currentItem.front} onChange={e => setCurrentItem({ ...currentItem, front: e.target.value })} />
                                                    <input className="w-full bg-neutral-beige/10 border-b border-neutral-gray/20 p-2 font-bold outline-none" placeholder="Back" value={currentItem.back} onChange={e => setCurrentItem({ ...currentItem, back: e.target.value })} />
                                                </div>
                                                <input className="w-full bg-neutral-beige/10 border border-neutral-gray/20 p-2 text-sm rounded-lg" placeholder="Reading (Optional)" value={currentItem.reading} onChange={e => setCurrentItem({ ...currentItem, reading: e.target.value })} />
                                            </div>
                                        )}
                                        <button onClick={handleAddItem} className="w-full py-3 bg-neutral-ink text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-strong transition-all">
                                            <Plus size={14} /> Add to {typeLabel}
                                        </button>
                                    </div>

                                    {manualItems.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/40">Collection ({manualItems.length} items)</h4>
                                                <button onClick={() => setManualItems([])} className="text-[10px] font-black text-red-500 uppercase">Clear</button>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                                {manualItems.map((item, idx) => (
                                                    <div key={idx} className="bg-white p-3 rounded-xl border border-neutral-gray/10 flex items-center justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-bold text-sm truncate">{item.front || item.question}</div>
                                                        </div>
                                                        <button onClick={() => setManualItems(manualItems.filter((_, i) => i !== idx))} className="p-2 text-neutral-ink/20 hover:text-red-500 transition-colors">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={handleFinalizeManual} className="w-full py-4 bg-primary-strong text-white rounded-2xl font-black uppercase tracking-widest hover:bg-neutral-ink transition-all">
                                                Finalize Construction
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {mode === 'PASTE_JSON' && (
                                <div className="space-y-4">
                                    <textarea className="w-full h-80 bg-neutral-ink text-primary-strong font-mono rounded-2xl p-6 focus:border-primary-strong outline-none" placeholder='{ "title": "Example", "items": [...] }' value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} />
                                    <button onClick={() => { try { setGeneratedContent(JSON.parse(jsonInput)); setIsPreviewMode(true); } catch { setError("Invalid JSON"); } }} className="w-full py-4 bg-neutral-ink text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-strong transition-all">Preview JSON</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-neutral-ink font-display">Review Creation</h3>
                                <button onClick={() => setIsPreviewMode(false)} className="text-[10px] font-black uppercase tracking-widest text-primary-strong hover:underline">Edit Info</button>
                            </div>
                            <div className="bg-white border border-neutral-gray/20 rounded-3xl overflow-hidden shadow-xl">
                                <div className="p-8 bg-neutral-beige/30 border-b border-neutral-gray/10">
                                    <h4 className="text-2xl font-black text-neutral-ink font-display">{generatedContent?.title}</h4>
                                    <p className="text-sm font-bold text-neutral-ink/40 mt-1">{generatedContent?.description}</p>
                                    <div className="mt-4 flex items-center gap-2">
                                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md ${generatedContent.visibility === 'public' ? 'bg-primary-strong text-white' : 'bg-neutral-ink text-white'}`}>
                                            {generatedContent.visibility}
                                        </span>
                                        <span className="px-2 py-0.5 bg-neutral-gray/10 text-[9px] font-black uppercase tracking-widest rounded-md text-neutral-ink/40">
                                            {generatedContent.items?.length || 0} Items
                                        </span>
                                    </div>
                                </div>
                                <div className="p-8 space-y-4 max-h-[400px] overflow-y-auto">
                                    {generatedContent.items?.map((item: any, i: number) => (
                                        <div key={i} className="flex items-start gap-4 pb-4 border-b border-neutral-gray/5 last:border-0">
                                            <div className="w-6 h-6 rounded bg-neutral-beige flex items-center justify-center shrink-0 text-[10px] font-black text-neutral-ink/40">{i + 1}</div>
                                            <div className="flex-1">
                                                <div className="font-black text-neutral-ink">{item.front || item.question || item.term}</div>
                                                <div className="text-sm font-bold text-neutral-ink/60">{item.back || (item.options ? item.options[item.correctIndex] : item.definition)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                <footer className="bg-neutral-white border-t border-neutral-gray/20 p-8">
                    <button onClick={handleSave} disabled={!generatedContent || !isPreviewMode || isSaving} className="w-full py-4 bg-primary-strong text-white rounded-2xl font-black uppercase tracking-widest hover:bg-neutral-ink transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-primary/20">
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? "Finalizing..." : `Save ${typeLabel}`}
                    </button>
                    <p className="mt-4 text-center text-[10px] font-black uppercase tracking-widest text-neutral-ink/20">Ownership guaranteed: Managed via Hanabira Core.</p>
                </footer>
            </div>
        </div>
    );
}

function Tab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button onClick={onClick} className={`flex items-center gap-2 py-4 px-6 border-b-2 transition-all font-black text-[10px] uppercase tracking-widest ${active ? "border-primary-strong text-primary-strong bg-primary/5" : "border-transparent text-neutral-ink/40 hover:text-neutral-ink hover:bg-neutral-beige/20"}`}>
            {icon}
            {label}
        </button>
    );
}
