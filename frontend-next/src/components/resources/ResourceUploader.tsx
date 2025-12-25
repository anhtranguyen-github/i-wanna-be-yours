
"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { resourceService } from '@/services/resourceService';
import { useUser } from '@/context/UserContext';
import { useSWRConfig } from 'swr';

interface ResourceUploaderProps {
    onClose: () => void;
    onUploadComplete?: () => void;
}

export function ResourceUploader({ onClose, onUploadComplete }: ResourceUploaderProps) {
    const { user } = useUser();
    const { mutate } = useSWRConfig();
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        if (!user) {
            setError("You must be logged in to upload files.");
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            // Upload files sequentially
            for (let i = 0; i < files.length; i++) {
                await resourceService.upload(files[i], String(user.id));
            }

            // Revalidate resources list
            mutate((key: any) => {
                // Check for string key (resources page list)
                if (typeof key === 'string' && key.includes('/f-api/v1/resources')) return true;
                // Check for array key (sidebar list [url, userId])
                if (Array.isArray(key) && key[0] === '/f-api/v1/resources') return true;
                return false;
            });

            if (onUploadComplete) onUploadComplete();
            else onClose();

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to upload file");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 "
                onClick={onClose}
            />

            <div className="relative bg-card rounded-2xl  border border-border w-full max-w-lg p-10 m-4 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-foreground font-display">Upload Resource</h3>
                    <button onClick={onClose} className="text-neutral-ink hover:text-foreground hover:bg-muted p-2 rounded-xl transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div
                    className={`
                        border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer 
                        ${isDragging ? 'border-primary bg-primary/5 scale-[0.98]' : 'border-border hover:border-primary/50 hover:bg-muted/30'}
                    `}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        handleUpload(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        multiple
                        onChange={(e) => handleUpload(e.target.files)}
                    />

                    {isUploading ? (
                        <div className="flex flex-col items-center py-6">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest font-display">Uploading...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-6">
                            <div className="bg-primary/10 p-5 rounded-2xl mb-6 ">
                                <Upload className="text-primary" size={32} />
                            </div>
                            <p className="text-lg font-black text-foreground mb-2 font-display">Click to upload or drag & drop</p>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">PDF, DOCX, TXT, Images (max 50MB)</p>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-8 p-4 bg-destructive/5 text-destructive text-sm font-bold rounded-xl border border-destructive/20 flex items-center gap-3">
                        <AlertCircle size={20} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
