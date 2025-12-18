
"use client";

import React from 'react';
import { X, Download, ExternalLink, Plus, FileText, Image, Music } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { resourceService, Resource } from '@/services/resourceService';

interface ResourcePreviewModalProps {
    resource: Resource | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToChat?: () => void;
}

export function ResourcePreviewModal({
    resource,
    isOpen,
    onClose,
    onAddToChat
}: ResourcePreviewModalProps) {
    const router = useRouter();

    if (!isOpen || !resource) return null;

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'Unknown size';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getIcon = () => {
        switch (resource.type) {
            case 'image': return <Image size={24} className="text-blue-500" />;
            case 'audio': return <Music size={24} className="text-purple-500" />;
            default: return <FileText size={24} className="text-brand-green" />;
        }
    };

    const handleOpenFullPage = () => {
        router.push(`/library/resources/${resource.id}`);
        onClose();
    };

    const handleDownload = () => {
        window.open(resourceService.getDownloadUrl(resource.id), '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4 overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        {getIcon()}
                        <div>
                            <h2 className="font-semibold text-brand-dark truncate max-w-md">
                                {resource.title}
                            </h2>
                            <p className="text-xs text-slate-500">
                                {resource.type} • {formatFileSize(resource.fileSize)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Content Preview */}
                <div className="flex-1 overflow-auto p-4 bg-slate-50 flex items-center justify-center">
                    {resource.type === 'image' ? (
                        <img
                            src={resourceService.getDownloadUrl(resource.id)}
                            alt={resource.title}
                            className="max-w-full max-h-full object-contain rounded-lg shadow"
                        />
                    ) : (
                        <div className="bg-white rounded-lg p-8 shadow-sm text-center flex flex-col items-center">
                            <FileText size={48} className="text-slate-300 mb-4" />
                            <p className="text-slate-600 mb-2">Preview not available for this file type.</p>
                            <p className="text-xs text-slate-400">Please download or view on full page.</p>
                        </div>
                    )}
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-white">
                    <div className="flex gap-2">
                        {onAddToChat && (
                            <button
                                onClick={() => { onAddToChat(); onClose(); }}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-green/90 transition-colors"
                            >
                                <Plus size={18} />
                                Add to Chat
                            </button>
                        )}
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
                        >
                            <Download size={18} />
                            Download
                        </button>
                    </div>
                    <button
                        onClick={handleOpenFullPage}
                        className="flex items-center gap-2 px-4 py-2 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"
                    >
                        <ExternalLink size={18} />
                        Open Full Page
                    </button>
                </div>
            </div>
        </div>
    );
}
