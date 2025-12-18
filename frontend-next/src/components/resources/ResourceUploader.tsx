
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
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg text-brand-dark">Upload Resource</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div
                    className={`
                        border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                        ${isDragging ? 'border-brand-green bg-brand-green/5' : 'border-slate-200 hover:border-brand-green/50'}
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
                        <div className="flex flex-col items-center py-4">
                            <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin mb-3"></div>
                            <p className="text-sm text-slate-500">Uploading...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-4">
                            <div className="bg-brand-green/10 p-3 rounded-full mb-3">
                                <Upload className="text-brand-green" size={24} />
                            </div>
                            <p className="font-medium text-brand-dark mb-1">Click to upload or drag and drop</p>
                            <p className="text-xs text-slate-400">PDF, DOCX, TXT, Images (max 50MB)</p>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
