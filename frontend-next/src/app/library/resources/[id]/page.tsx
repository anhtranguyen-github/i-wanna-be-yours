
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Trash2, Edit, FileText, Calendar, Tag, HardDrive } from 'lucide-react';
import { resourceService, Resource } from '@/services/resourceService';

export default function ResourceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [resource, setResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResource = async () => {
            try {
                if (typeof params.id !== 'string') return;
                const data = await resourceService.get(params.id);
                setResource(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load resource");
            } finally {
                setLoading(false);
            }
        };
        fetchResource();
    }, [params.id]);

    const handleDelete = async () => {
        if (!resource) return;
        if (confirm("Are you sure you want to delete this resource? This cannot be undone.")) {
            try {
                await resourceService.delete(resource.id);
                router.push('/library/resources');
            } catch (err) {
                alert("Failed to delete resource");
            }
        }
    };

    const handleDownload = () => {
        if (resource) {
            window.open(resourceService.getDownloadUrl(resource.id), '_blank');
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'Unknown size';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
                <div className="animate-pulse">Loading resource...</div>
            </div>
        );
    }

    if (error || !resource) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-xl font-semibold text-slate-700 mb-2">Resource Not Found</h2>
                <p className="text-slate-500 mb-6">{error || "The requested resource could not be found."}</p>
                <button
                    onClick={() => router.push('/library/resources')}
                    className="flex items-center gap-2 text-brand-green font-medium hover:underline"
                >
                    <ArrowLeft size={18} />
                    Back to Resources
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Back button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-600 hover:text-brand-green mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Back
            </button>

            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-brand-dark mb-3">
                                {resource.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full">
                                    <FileText size={14} />
                                    <span className="capitalize">{resource.type}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <HardDrive size={14} />
                                    {formatFileSize(resource.fileSize)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={14} />
                                    {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start">
                            {/* Future: Edit functionality 
                            <button className="p-2.5 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors" title="Edit Metadata">
                                <Edit size={20} />
                            </button>
                             */}
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2.5 bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white rounded-xl transition-all font-medium"
                            >
                                <Download size={20} />
                                <span>Download</span>
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-2.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                                title="Delete Resource"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 md:p-8">
                    {resource.type === 'image' ? (
                        <div className="bg-slate-50 rounded-xl p-4 flex justify-center border border-slate-100">
                            <img
                                src={resourceService.getDownloadUrl(resource.id)}
                                alt={resource.title}
                                className="max-w-full max-h-[600px] rounded-lg shadow-sm"
                            />
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-xl p-12 text-center border border-slate-100 flex flex-col items-center">
                            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                                <FileText size={64} className="text-slate-300" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-700 mb-2">Document Preview</h3>
                            <p className="text-slate-500 max-w-md mx-auto mb-6">
                                This file type cannot be previewed directly in the browser.
                                Please download the file to view its contents.
                            </p>
                            <button
                                onClick={handleDownload}
                                className="text-brand-green font-medium hover:underline"
                            >
                                Download File ({formatFileSize(resource.fileSize)})
                            </button>
                        </div>
                    )}
                </div>

                {/* Tags & Metadata Footer */}
                {resource.tags && resource.tags.length > 0 && (
                    <div className="px-6 md:px-8 pb-8 pt-2 border-t border-slate-50/50">
                        <div className="flex items-start gap-4">
                            <Tag size={18} className="text-slate-400 mt-1.5" />
                            <div className="flex flex-wrap gap-2">
                                {resource.tags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
