import React from "react";
import { X } from "lucide-react";

export interface SettingsState {
    srsActive: boolean;
    frontSide: 'JAPANESE' | 'DEFINITION' | string;
    showBothSides: boolean;
}

interface OptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: SettingsState;
    setSettings: (s: SettingsState) => void;
    onRestart: () => void;
}

export function OptionsModal({ isOpen, onClose, settings, setSettings, onRestart }: OptionsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <div className="absolute inset-0 bg-neutral-ink/60 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-card border border-border/50 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-white p-8 border-b border-border/50 flex items-center justify-between">
                    <h2 className="text-3xl font-black text-neutral-ink font-display tracking-tight">System Config</h2>
                    <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors">
                        <X size={20} className="text-neutral-ink" />
                    </button>
                </div>

                <div className="bg-white p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Track Progress */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-black text-sm uppercase tracking-widest text-neutral-ink">Track Progress</h3>
                            <p className="text-xs text-neutral-ink/60 font-medium">Persist results to SRS database</p>
                        </div>
                        <Toggle
                            enabled={settings.srsActive}
                            setEnabled={(val) => setSettings({ ...settings, srsActive: val })}
                        />
                    </div>

                    {/* Front Side */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-black text-sm uppercase tracking-widest text-neutral-ink">Front Side</h3>
                            <p className="text-xs text-neutral-ink/60 font-medium">Linguistic perspective anchor</p>
                        </div>
                        <select
                            value={settings.frontSide}
                            onChange={(e) => setSettings({ ...settings, frontSide: e.target.value })}
                            className="bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 text-neutral-ink"
                        >
                            <option value="JAPANESE">Japanese</option>
                            <option value="DEFINITION">Definition</option>
                        </select>
                    </div>

                    {/* Show Both Sides */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-black text-sm uppercase tracking-widest text-neutral-ink">Synthesis Mode</h3>
                            <p className="text-xs text-neutral-ink/60 font-medium">Show both sides of cards</p>
                        </div>
                        <Toggle
                            enabled={settings.showBothSides}
                            setEnabled={(val) => setSettings({ ...settings, showBothSides: val })}
                        />
                    </div>

                    {/* Keyboard Shortcuts */}
                    <div className="space-y-4 pt-4 border-t border-neutral-100">
                        <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-neutral-ink/40">Keyboard Command Matrix</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <ShortcutItem keys={["Space"]} label="Flip Card" />
                            <ShortcutItem keys={["←", "→"]} label="Navigate" />
                            <ShortcutItem keys={["1", "2"]} label="Evaluation" />
                            <ShortcutItem keys={["P"]} label="Auto-Iterate" />
                            <ShortcutItem keys={["S"]} label="Registry Shuffle" />
                            <ShortcutItem keys={["U"]} label="Neural Undo" />
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-neutral-50 border-t border-border/50 flex gap-4">
                    <button
                        onClick={() => { onRestart(); onClose(); }}
                        className="flex-1 py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-colors"
                    >
                        Restart Cycle
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-neutral-ink text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-colors"
                    >
                        Confirm Sync
                    </button>
                </div>
            </div>
        </div>
    );
}

function Toggle({ enabled, setEnabled }: { enabled: boolean; setEnabled: (v: boolean) => void }) {
    return (
        <button
            onClick={() => setEnabled(!enabled)}
            className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${enabled ? 'bg-primary' : 'bg-neutral-200 border border-neutral-300'}`}
        >
            <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    );
}

function ShortcutItem({ keys, label }: { keys: string[]; label: string }) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-[10px] font-bold text-neutral-ink">{label}</span>
            <div className="flex gap-1">
                {keys.map(k => (
                    <kbd key={k} className="px-2 py-1 bg-white border border-neutral-200 rounded-md text-[9px] font-black text-neutral-ink">{k}</kbd>
                ))}
            </div>
        </div>
    );
}
