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
    AlertCircle
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

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
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
                    prompt: `Create a ${type.toLowerCase()} deck about: ${prompt}. Return JSON only.`,
                    type: type,
                    session_id: "creator-session-" + Date.now(),
                    user_id: "creator-user" // Will be overridden or pulled from context if available
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            // Extract content from artifacts
            const artifact = data.responses?.find((r: any) => r.type !== 'text');
            if (artifact && artifact.content) {
                // Determine format based on type
                if (type === 'PRACTICE') {
                    setGeneratedContent(artifact.content.quiz || artifact.content);
                } else {
                    setGeneratedContent({
                        title: artifact.content.title || prompt.slice(0, 20),
                        items: artifact.content.flashcards?.cards || artifact.content.vocabulary?.items || artifact.content.items || []
                    });
                }
            } else if (data.responses?.[0]?.content) {
                // Fallback to text content if no artifact
                setGeneratedContent({ title: "Draft", items: [{ term: "Note", definition: data.responses[0].content }] });
            }

            setIsPreviewMode(true);
        } catch (err: any) {
            setError(err.message || "Failed to generate content");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleParseManualText = () => {
        setError(null);
        try {
            const lines = manualInput.split('\n').filter(l => l.trim());
            const items = lines.map(line => {
                let parts: string[] = [];
                if (manualSeparator === 'pipe') parts = line.split('|');
                else if (manualSeparator === 'arrow') parts = line.split('->');
                else if (manualSeparator === 'comma') parts = line.split(',');

                if (parts.length < 2) throw new Error("Invalid format on line: " + line);
                return { term: parts[0].trim(), definition: parts[1].trim() };
            });

            setGeneratedContent({
                title: "New " + type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() + " Deck",
                items: items
            });
            setIsPreviewMode(true);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleAddItem = () => {
        const item = { ...currentItem };

        // Basic Validation
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

    const removeItem = (index: number) => {
        setManualItems(manualItems.filter((_, i) => i !== index));
    };

    const handleFinalizeManual = () => {
        if (manualItems.length === 0) {
            setError("Add at least one item first");
            return;
        }
        setGeneratedContent({
            title: `Custom ${type} Creation`,
            items: manualItems
        });
        setIsPreviewMode(true);
    };

    const handleValidateJSON = () => {
        setError(null);
        try {
            const parsed = JSON.parse(jsonInput);
            setGeneratedContent(parsed);
            setIsPreviewMode(true);
        } catch (err: any) {
            setError("Invalid JSON format");
        }
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
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-neutral-ink/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative w-full max-w-2xl bg-neutral-beige h-full shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-neutral-white border-b border-neutral-gray/20 p-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-neutral-ink font-display">Create {type}</h2>
                        <p className="text-neutral-ink/60 font-bold">Construct your own learning arsenal</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 bg-neutral-beige rounded-xl flex items-center justify-center hover:bg-neutral-gray/10 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </header>

                {/* Tabs */}
                {!isPreviewMode && (
                    <div className="flex bg-neutral-white px-8 border-b border-neutral-gray/10">
                        <Tab
                            active={mode === 'AI_GENERATE'}
                            onClick={() => setMode('AI_GENERATE')}
                            icon={<Sparkles size={16} />}
                            label="AI Generate"
                        />
                        <Tab
                            active={mode === 'PASTE_JSON'}
                            onClick={() => setMode('PASTE_JSON')}
                            icon={<Code size={16} />}
                            label="Paste JSON"
                        />
                        <Tab
                            active={mode === 'MANUAL'}
                            onClick={() => setMode('MANUAL')}
                            icon={<FileText size={16} />}
                            label="Manual Input"
                        />
                    </div>
                )}

                {/* Body */}
                <main className="flex-grow overflow-y-auto p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-600 font-bold">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    {!isPreviewMode ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {mode === 'AI_GENERATE' && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/40">Prompt Hanachan</label>
                                    <textarea
                                        className="w-full h-40 bg-white border border-neutral-gray/20 rounded-2xl p-6 font-bold focus:border-primary-strong outline-none transition-all placeholder:text-neutral-gray/40"
                                        placeholder="E.g. Create a N2 level deck about common business Japanese phrases used in email correspondence..."
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                    />
                                    <button
                                        onClick={handleGenerateAI}
                                        disabled={isGenerating || !prompt.trim()}
                                        className="w-full py-4 bg-primary-strong text-white rounded-2xl font-black uppercase tracking-widest hover:bg-neutral-ink transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                        {isGenerating ? "Hana is thinking..." : "Generate Magic"}
                                    </button>
                                </div>
                            )}

                            {mode === 'PASTE_JSON' && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/40">JSON Payload</label>
                                    <textarea
                                        className="w-full h-80 bg-neutral-ink text-primary-strong font-mono rounded-2xl p-6 focus:border-primary-strong outline-none transition-all"
                                        placeholder='{ "title": "Example", "items": [...] }'
                                        value={jsonInput}
                                        onChange={(e) => setJsonInput(e.target.value)}
                                    />
                                    <button
                                        onClick={handleValidateJSON}
                                        disabled={!jsonInput.trim()}
                                        className="w-full py-4 bg-neutral-ink text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-strong transition-all disabled:opacity-50"
                                    >
                                        Validate & Preview
                                    </button>
                                </div>
                            )}

                            {mode === 'MANUAL' && (
                                <div className="space-y-6">
                                    <div className="bg-white border border-neutral-gray/20 rounded-2xl p-6 space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-strong">New Entry</h4>

                                        {/* Activity-specific form fields */}
                                        {type === 'PRACTICE' ? (
                                            <div className="space-y-4">
                                                <input
                                                    className="w-full bg-neutral-beige/30 border-b border-neutral-gray/20 p-2 font-bold outline-none"
                                                    placeholder="Question Content"
                                                    value={currentItem.question}
                                                    onChange={e => setCurrentItem({ ...currentItem, question: e.target.value })}
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    {currentItem.options.map((opt: string, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                name="correct"
                                                                checked={currentItem.correctIndex === idx}
                                                                onChange={() => setCurrentItem({ ...currentItem, correctIndex: idx })}
                                                            />
                                                            <input
                                                                className="flex-1 bg-neutral-beige/10 border border-neutral-gray/10 p-2 text-sm font-bold rounded-lg"
                                                                placeholder={`Option ${idx + 1}`}
                                                                value={opt}
                                                                onChange={e => {
                                                                    const newOpts = [...currentItem.options];
                                                                    newOpts[idx] = e.target.value;
                                                                    setCurrentItem({ ...currentItem, options: newOpts });
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <textarea
                                                    className="w-full h-20 bg-neutral-beige/10 border border-neutral-gray/10 p-2 text-xs font-medium rounded-lg"
                                                    placeholder="Explanation (Optional)"
                                                    value={currentItem.explanation}
                                                    onChange={e => setCurrentItem({ ...currentItem, explanation: e.target.value })}
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input
                                                        className="w-full bg-neutral-beige/30 border-b border-neutral-gray/20 p-2 font-bold outline-none"
                                                        placeholder="Front (Term/Kanji)"
                                                        value={currentItem.front}
                                                        onChange={e => setCurrentItem({ ...currentItem, front: e.target.value })}
                                                    />
                                                    <input
                                                        className="w-full bg-neutral-beige/30 border-b border-neutral-gray/20 p-2 font-bold outline-none"
                                                        placeholder="Back (Meaning)"
                                                        value={currentItem.back}
                                                        onChange={e => setCurrentItem({ ...currentItem, back: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input
                                                        className="w-full bg-neutral-beige/10 border border-neutral-gray/10 p-2 text-sm rounded-lg"
                                                        placeholder="Reading/Furigana"
                                                        value={currentItem.reading}
                                                        onChange={e => setCurrentItem({ ...currentItem, reading: e.target.value })}
                                                    />
                                                    {type === 'FLASHCARDS' && (
                                                        <input
                                                            className="w-full bg-neutral-beige/10 border border-neutral-gray/10 p-2 text-sm rounded-lg"
                                                            placeholder="Mnemonic (Optional)"
                                                            value={currentItem.mnemonic}
                                                            onChange={e => setCurrentItem({ ...currentItem, mnemonic: e.target.value })}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleAddItem}
                                            className="w-full py-2 bg-neutral-ink text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-strong transition-all"
                                        >
                                            <Plus size={14} /> Add to Collection
                                        </button>
                                    </div>

                                    {/* Items List */}
                                    {manualItems.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/40">Ready to Finalize ({manualItems.length} items)</h4>
                                                <button onClick={() => setManualItems([])} className="text-[10px] font-black text-red-500 uppercase">Clear All</button>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                                {manualItems.map((item, idx) => (
                                                    <div key={idx} className="bg-white p-3 rounded-xl border border-neutral-gray/10 flex items-center justify-between group">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-bold text-sm truncate">{item.front || item.question}</div>
                                                            <div className="text-[10px] text-neutral-ink/40 truncate">{item.back || item.options?.join(', ')}</div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeItem(idx)}
                                                            className="p-2 text-neutral-ink/20 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={handleFinalizeManual}
                                                className="w-full py-4 bg-primary-strong text-white rounded-2xl font-black uppercase tracking-widest hover:bg-neutral-ink shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-3"
                                            >
                                                Finalize {manualItems.length > 1 ? `${manualItems.length} Items` : '1 Item'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Text-based parsing fallback */}
                                    <div className="pt-8 border-t border-neutral-gray/10">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/20 mb-4 text-center">Or paste bulk list</p>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex bg-white rounded-lg p-1 border border-neutral-gray/10">
                                                <SeparatorBtn active={manualSeparator === 'pipe'} onClick={() => setManualSeparator('pipe')}>|</SeparatorBtn>
                                                <SeparatorBtn active={manualSeparator === 'arrow'} onClick={() => setManualSeparator('arrow')}>→</SeparatorBtn>
                                                <SeparatorBtn active={manualSeparator === 'comma'} onClick={() => setManualSeparator('comma')}>,</SeparatorBtn>
                                            </div>
                                        </div>
                                        <textarea
                                            className="w-full h-32 bg-white/50 border border-neutral-gray/10 rounded-2xl p-4 text-sm font-medium focus:border-primary-strong outline-none transition-all placeholder:text-neutral-gray/40"
                                            placeholder={manualSeparator === 'pipe' ? "Term | Definition" : manualSeparator === 'arrow' ? "Term -> Definition" : "Term, Definition"}
                                            value={manualInput}
                                            onChange={(e) => setManualInput(e.target.value)}
                                        />
                                        <button
                                            onClick={handleParseManualText}
                                            disabled={!manualInput.trim()}
                                            className="mt-4 w-full py-2 bg-neutral-white border border-neutral-gray/20 text-neutral-ink rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary-strong transition-all disabled:opacity-50"
                                        >
                                            Parse Text List
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-neutral-ink font-display">Construction Preview</h3>
                                <button
                                    onClick={() => setIsPreviewMode(false)}
                                    className="text-[10px] font-black uppercase tracking-widest text-primary-strong hover:underline"
                                >
                                    Modify Input
                                </button>
                            </div>

                            <div className="bg-white border border-neutral-gray/20 rounded-3xl overflow-hidden">
                                <div className="p-6 bg-neutral-beige/30 border-b border-neutral-gray/10">
                                    <h4 className="text-xl font-black text-neutral-ink font-display">{generatedContent?.title || "Untitled Creation"}</h4>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-accent text-[9px] font-black uppercase tracking-widest rounded-md">Personal</span>
                                        <span className="px-2 py-0.5 bg-primary/20 text-[9px] font-black uppercase tracking-widest rounded-md text-primary-strong">AI Generated</span>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                                    {(generatedContent?.items || generatedContent?.content || []).map((item: any, i: number) => (
                                        <div key={i} className="flex items-start gap-4 pb-4 border-b border-neutral-gray/5 last:border-0">
                                            <div className="w-8 h-8 rounded-lg bg-neutral-beige flex items-center justify-center shrink-0 text-[10px] font-black">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-black text-neutral-ink">{item.front || item.question || item.term || item.title}</div>
                                                <div className="text-sm font-bold text-neutral-ink/60">{item.back || (item.options ? item.options[item.correctIndex] : item.definition || item.answer)}</div>
                                                {(item.reading || item.reading) && <div className="text-[10px] text-primary-strong mt-1 font-black">{item.reading}</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer className="bg-neutral-white border-t border-neutral-gray/20 p-8">
                    <button
                        onClick={handleSave}
                        disabled={!generatedContent || !isPreviewMode || isSaving}
                        className="w-full py-4 bg-neutral-ink text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-strong transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? "Saving..." : "Finalize & Save"}
                    </button>
                    <p className="mt-4 text-center text-[10px] font-black uppercase tracking-widest text-neutral-ink/20">
                        Proceed with caution: Knowledge is power.
                    </p>
                </footer>
            </div>
        </div>
    );
}

function Tab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 py-4 px-6 border-b-2 transition-all font-black text-[10px] uppercase tracking-widest
                ${active
                    ? "border-primary-strong text-primary-strong bg-primary/5"
                    : "border-transparent text-neutral-ink/40 hover:text-neutral-ink hover:bg-neutral-beige/20"}
            `}
        >
            {icon}
            {label}
        </button>
    );
}

function SeparatorBtn({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`w-8 h-8 flex items-center justify-center rounded-md font-black transition-all ${active ? "bg-neutral-ink text-white" : "text-neutral-ink/40 hover:bg-neutral-beige"}`}
        >
            {children}
        </button>
    );
}
