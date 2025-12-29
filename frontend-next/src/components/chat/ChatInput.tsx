/**
 * ChatInput Component
 *
 * The main chat input area with attachment support and action buttons.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
    Send,
    Paperclip,
    Mic,
    FileText,
    CheckSquare,
    Sparkles,
    X,
    Loader2
} from 'lucide-react';
import { ArtifactType } from '@/types/artifact';

export interface AttachedFile {
    id: string;
    file?: File;
    uploading: boolean;
    error?: boolean;
    backendId?: string;
    title: string;
    ingestionStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onQuickAction?: (type: ArtifactType) => void;
    onFileSelect?: (files: File[]) => void;
    attachedFiles?: AttachedFile[];
    onRemoveAttachment?: (id: string) => void;
    isLoading?: boolean;
    disabled?: boolean;
    placeholder?: string;
    isGuest?: boolean;
}

export function ChatInput({
    value,
    onChange,
    onSend,
    onQuickAction,
    onFileSelect,
    attachedFiles = [],
    onRemoveAttachment,
    isLoading = false,
    disabled = false,
    placeholder = "Ask Hanachan anything...",
    isGuest = false
}: ChatInputProps) {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px';
        }
    }, [value]);

    const hasUploading = attachedFiles.some(f => f.uploading);
    const hasIngesting = attachedFiles.some(f => f.ingestionStatus === 'processing' || f.ingestionStatus === 'pending');

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!disabled && !isLoading && !hasUploading && !hasIngesting) {
                onSend();
            }
        }
    }, [onSend, disabled, isLoading, hasUploading, hasIngesting]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && onFileSelect) {
            const files = Array.from(e.target.files);
            onFileSelect(files);
            e.target.value = '';
        }
    }, [onFileSelect]);

    const canSend = (value.trim() || attachedFiles.length > 0) && !isLoading && !hasUploading && !hasIngesting && !disabled;

    return (
        <div className="border-t border-slate-100 pt-4 px-4 pb-6 bg-white z-10 w-full max-w-3xl mx-auto">
            {/* Attachment Tray */}
            {attachedFiles.length > 0 && (
                <div className="flex gap-2 overflow-x-auto mb-3 pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                    {attachedFiles.map(file => (
                        <div key={file.id} className="relative flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200  min-w-[160px] max-w-[240px] group">
                            <div className="w-8 h-8 bg-white rounded-lg border border-slate-100 flex items-center justify-center flex-shrink-0">
                                {file.file?.type.startsWith('image/') ? (
                                    <span className="text-xs">🖼️</span>
                                ) : (
                                    <FileText size={16} className="text-neutral-ink" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-700 truncate">{file.title}</p>
                                <p className="text-[10px] text-neutral-ink">
                                    {file.uploading ? 'Uploading...' :
                                        file.ingestionStatus === 'processing' ? 'Ingesting...' :
                                            file.ingestionStatus === 'pending' ? 'Queued...' :
                                                file.ingestionStatus === 'failed' ? 'Failed' :
                                                    file.ingestionStatus === 'completed' ? 'Ready' :
                                                        file.file ? `${(file.file.size / 1024).toFixed(1)} KB` : 'Resource'}
                                </p>
                            </div>
                            {file.uploading || file.ingestionStatus === 'processing' || file.ingestionStatus === 'pending' ? (
                                <div className="w-6 h-6 flex items-center justify-center">
                                    <Loader2 size={14} className="animate-spin text-primary" />
                                </div>
                            ) : file.ingestionStatus === 'completed' ? (
                                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-50 text-green-600">
                                    <CheckSquare size={14} />
                                </div>
                            ) : (
                                <button
                                    onClick={() => onRemoveAttachment?.(file.id)}
                                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-neutral-ink hover:text-red-500 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Input Container */}
            <div className="relative flex items-end gap-2 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                {/* File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                />

                {/* Attachment button */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-neutral-ink hover:text-brand-green transition-colors"
                    title="Attach file"
                >
                    <Paperclip size={20} />
                </button>

                {/* Text input */}
                <textarea
                    ref={inputRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isGuest ? "Login to synchronize with Hanachan..." : placeholder}
                    rows={1}
                    className="flex-1 bg-transparent py-3 text-brand-dark placeholder:text-neutral-ink resize-none focus:outline-none text-sm max-h-[200px]"
                />

                {/* Action buttons */}
                <div className="flex items-center gap-1 pr-2 pb-1.5">
                    <button
                        className="p-2 text-neutral-ink hover:text-primary transition-colors"
                        title="Voice input"
                    >
                        <Mic size={20} />
                    </button>
                    <button
                        onClick={onSend}
                        disabled={!isGuest && !canSend}
                        className={`p-2 rounded-xl transition-all font-bold text-xs ${isGuest
                            ? "bg-primary text-white px-4 hover:scale-105 active:scale-95 flex items-center gap-2"
                            : "bg-primary-strong text-white hover:bg-primary-strong/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            }`}
                        title={isGuest ? "Unlock Neural Access" : "Send message"}
                    >
                        {isGuest ? (
                            <>
                                <Sparkles size={16} />
                                Synchronize
                            </>
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </div>
            </div>

            {/* Quick Actions Toolbar */}
            <div className="flex items-center justify-between mt-3 px-1">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onQuickAction?.('flashcard')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-ink hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all"
                    >
                        <FileText size={14} />
                        Flashcards
                    </button>
                    <button
                        onClick={() => onQuickAction?.('quiz')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-ink hover:text-purple-600 hover:bg-purple-50 border border-transparent hover:border-purple-200 transition-all"
                    >
                        <CheckSquare size={14} />
                        Quiz
                    </button>
                    <button
                        onClick={() => onQuickAction?.('summary')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-ink hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all"
                    >
                        <Sparkles size={14} />
                        Summary
                    </button>
                </div>

                <p className="text-xs text-neutral-ink">
                    Hanachan makes mistakes. Verify info.
                </p>
            </div>
        </div>
    );
}
