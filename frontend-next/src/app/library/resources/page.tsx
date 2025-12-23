
"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { useUser } from '@/context/UserContext';
import { useGlobalAuth } from '@/context/GlobalAuthContext';
import { FileText, Image, Music, Search, Plus, Trash2, Download, Eye, Sparkles } from 'lucide-react';
import { ResourceUploader } from '@/components/resources/ResourceUploader';
import { resourceService } from '@/services/resourceService';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ResourcesListPage() {
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();
    const [showUploader, setShowUploader] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: response, mutate } = useSWR(
        user ? `/f-api/v1/resources?userId=${user.id}` : null,
        fetcher
    );

    const isGuest = !user;
    const resources = response?.resources || [];

    const filteredResources = resources.filter((r: any) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getIcon = (type: string) => {
        switch (type) {
            case 'image': return <Image size={24} className="text-kanji" />;
            case 'audio': return <Music size={24} className="text-accent" />;
            default: return <FileText size={24} className="text-primary" />;
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this resource?")) {
            await resourceService.delete(id);
            mutate();
        }
    };

    const handleDownload = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(resourceService.getDownloadUrl(id), '_blank');
    };

    const features = [
        {
            title: "AI Document Parser",
            description: "Turn any PDF or text file into interactive lessons. Get sentence-by-sentence breakdowns and instant flashcards.",
            icon: <FileText size={32} className="text-primary" />,
            color: "bg-primary/5",
            borderColor: "border-primary/20"
        },
        {
            title: "Audio Learning Engine",
            description: "Upload podcasts or music to generate transcripts and extract key vocabulary automatically.",
            icon: <Music size={32} className="text-accent" />,
            color: "bg-accent/5",
            borderColor: "border-accent/20"
        },
        {
            title: "Visual OCR Vault",
            description: "Store images of street signs or manga and let hanabira decipher them with advanced Japanese OCR.",
            icon: <Image size={32} className="text-kanji" />,
            color: "bg-kanji/5",
            borderColor: "border-kanji/20"
        }
    ];

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            {/* Header section with Sakura Zen styling */}
            <div className="max-w-7xl mx-auto mb-12">
                <div className="bg-card border border-border rounded-2xl p-8 md:p-12  flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-all duration-1000" />

                    <div className="relative z-10">
                        <h1 className="text-5xl font-black text-foreground tracking-tight mb-3 font-display">
                            Learning <span className="text-primary">Vault</span>
                        </h1>
                        <p className="text-muted-foreground font-bold max-w-lg leading-relaxed">
                            {isGuest
                                ? "Your personal AI-powered repository for Japanese study materials. Upload PDF, audio, or images to generate lessons."
                                : "Manage your uploaded documents and interative files."}
                        </p>
                    </div>

                    {!isGuest && (
                        <button
                            onClick={() => setShowUploader(true)}
                            className="relative z-10 flex items-center gap-3 px-10 py-5 bg-foreground text-background rounded-2xl hover:opacity-90 hover:scale-105  transition-all font-black font-display uppercase tracking-widest text-sm"
                        >
                            <Plus size={20} />
                            Upload Resource
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                {isGuest ? (
                    <div className="space-y-16">
                        {/* Benefits Showcase for Guests */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {features.map((feature, idx) => (
                                <div
                                    key={idx}
                                    className={`p-10 ${feature.color} border border-border rounded-2xl  hover: transition-all duration-500 group cursor-pointer`}
                                    onClick={() => openAuth('REGISTER', { flowType: 'LIBRARY', title: feature.title })}
                                >
                                    <div className="w-20 h-20 bg-card rounded-2xl flex items-center justify-center mb-8  group- transition-transform duration-500">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-2xl font-black text-foreground mb-4 tracking-tight font-display">{feature.title}</h3>
                                    <p className="text-muted-foreground font-bold leading-relaxed mb-8 text-sm">
                                        {feature.description}
                                    </p>
                                    <div className="flex items-center gap-2 text-foreground font-black text-xs uppercase tracking-widest font-display group-hover:gap-4 transition-all">
                                        Unlock this feature <Plus size={16} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Large Action CTA */}
                        <div className="relative px-8 py-20 md:py-32 bg-foreground rounded-2xl overflow-hidden text-center  group">
                            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-all duration-1000" />
                                <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-secondary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 group-hover:bg-secondary/20 transition-all duration-1000" />
                            </div>

                            <div className="relative z-10 max-w-3xl mx-auto">
                                <h2 className="text-5xl md:text-6xl font-black text-background mb-8 leading-tight font-display">
                                    Turn Any Content into <br />
                                    <span className="text-primary">Perfect Lessons</span>
                                </h2>
                                <p className="text-background/60 text-lg mb-12 leading-relaxed font-bold max-w-2xl mx-auto">
                                    Don&apos;t just store files—interact with them. Join hanabira to
                                    automatically generate personalized study plans from your own materials.
                                </p>
                                <button
                                    onClick={() => openAuth('REGISTER', { flowType: 'LIBRARY' })}
                                    className="px-12 py-6 bg-primary text-primary-foreground font-black rounded-2xl hover:opacity-90 hover:scale-105 transition-all  font-display uppercase tracking-[0.2em] text-sm"
                                >
                                    Get Started for Free
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Search and Grid for Logged-in Users */}
                        <div className="relative mb-12 group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={24} />
                            <input
                                type="text"
                                placeholder="Search your library..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-16 pr-6 py-6 bg-card border-none rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all  font-bold text-foreground placeholder:text-muted-foreground/30"
                            />
                        </div>

                        {filteredResources.length === 0 ? (
                            <div className="text-center py-32 bg-card rounded-2xl border-2 border-dashed border-border flex flex-col items-center">
                                <div className="w-24 h-24 bg-muted/50 rounded-2xl flex items-center justify-center mb-8 ">
                                    <Search className="text-muted-foreground/20" size={40} />
                                </div>
                                <h3 className="text-3xl font-black text-foreground mb-4 font-display">Build Your Vault</h3>
                                <p className="text-muted-foreground font-bold mb-10 max-w-sm leading-relaxed">Upload your first PDF, image, or audio file to begin your AI-powered learning journey.</p>
                                <button
                                    onClick={() => setShowUploader(true)}
                                    className="px-10 py-5 bg-foreground text-background font-black rounded-2xl  font-display uppercase tracking-widest text-sm hover:opacity-90 active:scale-95 transition-all"
                                >
                                    Upload First File
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {filteredResources.map((resource: any) => (
                                    <div
                                        key={resource.id}
                                        className="group relative bg-card rounded-2xl p-8  hover:  transition-all duration-300 border border-border hover:border-primary/20 cursor-pointer overflow-hidden"
                                        onClick={() => {
                                            window.location.href = `/library/resources/${resource.id}`;
                                        }}
                                    >
                                        <div className="flex flex-col h-full">
                                            <div className="p-5 bg-muted/50 rounded-xl group-hover:bg-primary/5 transition-colors w-fit mb-6 ">
                                                {getIcon(resource.type)}
                                            </div>

                                            <div className="flex-1">
                                                <h3 className="text-xl font-black text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1 font-display">
                                                    {resource.title}
                                                </h3>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-display">
                                                    {resource.type} • {new Date(resource.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest font-display">
                                                    <Eye size={16} />
                                                    <span>View</span>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => handleDownload(e, resource.id)}
                                                        className="p-2.5 text-muted-foreground/40 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                        title="Download"
                                                    >
                                                        <Download size={20} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(e, resource.id)}
                                                        className="p-2.5 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {showUploader && (
                <ResourceUploader
                    onClose={() => setShowUploader(false)}
                    onUploadComplete={() => { mutate(); setShowUploader(false); }}
                />
            )}
        </div>
    );
}
