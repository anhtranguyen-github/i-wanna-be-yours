
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
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-neutral-ink">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                <div className="text-xs font-black uppercase tracking-widest font-display animate-pulse">Loading resource...</div>
            </div>
        );
    }

    if (error || !resource) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-card rounded-2xl flex items-center justify-center mb-10 ">
                    <FileText size={48} className="text-neutral-ink" />
                </div>
                <h2 className="text-3xl font-black text-foreground mb-4 font-display">Resource Not Found</h2>
                <p className="text-neutral-ink font-bold mb-10 max-w-md leading-relaxed">{error || "The requested resource could not be found."}</p>
                <button
                    onClick={() => router.push('/library/resources')}
                    className="flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl font-black font-display uppercase tracking-widest text-sm  hover:opacity-90 active:scale-95 transition-all"
                >
                    <ArrowLeft size={18} />
                    Back to Resources
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            {/* Back button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-3 text-neutral-ink hover:text-primary mb-10 transition-all active:scale-95 group"
            >
                <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest font-display">Back to Vault</span>
            </button>

            <div className="max-w-6xl mx-auto bg-card rounded-2xl  border border-border overflow-hidden">
                {/* Header */}
                <div className="p-8 md:p-12 border-b border-border">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                        <div className="flex-1">
                            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-6 font-display leading-tight">
                                {resource.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6">
                                <span className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest font-display">
                                    <FileText size={14} />
                                    <span className="capitalize">{resource.type}</span>
                                </span>
                                <span className="flex items-center gap-2 text-[10px] font-black text-neutral-ink uppercase tracking-widest font-display">
                                    <HardDrive size={16} className="text-neutral-ink" />
                                    {formatFileSize(resource.fileSize)}
                                </span>
                                <span className="flex items-center gap-2 text-[10px] font-black text-neutral-ink uppercase tracking-widest font-display">
                                    <Calendar size={16} className="text-neutral-ink" />
                                    {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 self-start">
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl hover:opacity-90 hover:scale-105  transition-all font-black font-display uppercase tracking-widest text-[11px]"
                            >
                                <Download size={20} />
                                <span>Download</span>
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-3.5 hover:bg-destructive/5 text-neutral-ink hover:text-destructive rounded-xl transition-all "
                                title="Delete Resource"
                            >
                                <Trash2 size={24} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-8 md:p-12 bg-muted/20">
                    {resource.type === 'image' ? (
                        <div className="bg-card rounded-2xl p-6 flex justify-center border border-border ">
                            <img
                                src={resourceService.getDownloadUrl(resource.id)}
                                alt={resource.title}
                                className="max-w-full max-h-[700px] rounded-xl "
                            />
                        </div>
                    ) : (
                        <div className="bg-card rounded-2xl p-20 text-center border border-border  flex flex-col items-center">
                            <div className="bg-muted/50 p-10 rounded-2xl  mb-8 transform group- transition-transform duration-700">
                                <FileText size={80} className="text-neutral-ink" />
                            </div>
                            <h3 className="text-2xl font-black text-foreground mb-4 font-display">Document Preview</h3>
                            <p className="text-neutral-ink font-bold max-w-sm mx-auto mb-10 leading-relaxed text-sm">
                                This file type cannot be previewed directly in the browser yet.
                                Please download it to view its contents.
                            </p>
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-3 text-primary font-black uppercase tracking-widest text-xs font-display hover:opacity-80 transition-all"
                            >
                                <Download size={18} />
                                Download File ({formatFileSize(resource.fileSize)})
                            </button>
                        </div>
                    )}
                </div>

                {/* Tags & Metadata Footer */}
                {resource.tags && resource.tags.length > 0 && (
                    <div className="p-8 md:p-12 pt-4 border-t border-border/50">
                        <div className="flex items-start gap-4">
                            <Tag size={20} className="text-neutral-ink mt-1" />
                            <div className="flex flex-wrap gap-2.5">
                                {resource.tags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="px-4 py-1.5 bg-muted text-neutral-ink rounded-full text-[10px] font-black uppercase tracking-widest font-display "
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
