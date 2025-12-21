
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
            case 'image': return <Image size={24} className="text-blue-500" />;
            case 'audio': return <Music size={24} className="text-purple-500" />;
            default: return <FileText size={24} className="text-brand-green" />;
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
            icon: <FileText size={32} className="text-brand-green" />,
            color: "from-emerald-50 to-green-50",
            borderColor: "border-green-100"
        },
        {
            title: "Audio Learning Engine",
            description: "Upload podcasts or music to generate transcripts and extract key vocabulary automatically.",
            icon: <Music size={32} className="text-purple-500" />,
            color: "from-purple-50 to-indigo-50",
            borderColor: "border-purple-100"
        },
        {
            title: "Visual OCR Vault",
            description: "Store images of street signs or manga and let Hanachan decipher them with advanced Japanese OCR.",
            icon: <Image size={32} className="text-blue-500" />,
            color: "from-blue-50 to-sky-50",
            borderColor: "border-blue-100"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-cream/30 p-4 md:p-8">
            {/* Header section with glassmorphism */}
            <div className="max-w-7xl mx-auto mb-10">
                <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-6 md:p-10 shadow-xl shadow-brand-softBlue/5 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-softBlue/10 rounded-full blur-3xl group-hover:bg-brand-softBlue/20 transition-all duration-700" />

                    <div className="relative z-10">
                        <h1 className="text-4xl font-black text-brand-dark tracking-tight mb-2">
                            Learning <span className="text-brand-softBlue">Vault</span>
                        </h1>
                        <p className="text-slate-500 font-medium max-w-lg">
                            {isGuest
                                ? "Your personal AI-powered repository for Japanese study materials."
                                : "Manage your uploaded documents and files."}
                        </p>
                    </div>

                    {!isGuest && (
                        <button
                            onClick={() => setShowUploader(true)}
                            className="relative z-10 flex items-center gap-3 px-8 py-4 bg-brand-dark text-white rounded-2xl hover:bg-black hover:scale-105 hover:shadow-2xl hover:shadow-brand-softBlue/20 transition-all font-bold"
                        >
                            <Plus size={20} />
                            Upload Resource
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                {isGuest ? (
                    <div className="space-y-12">
                        {/* Benefits Showcase for Guests */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {features.map((feature, idx) => (
                                <div
                                    key={idx}
                                    className={`p-8 bg-gradient-to-br ${feature.color} border-2 ${feature.borderColor} rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500 group cursor-pointer`}
                                    onClick={() => openAuth('REGISTER', { flowType: 'LIBRARY', title: feature.title })}
                                >
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-black text-brand-dark mb-3 tracking-tight">{feature.title}</h3>
                                    <p className="text-slate-600 font-medium leading-relaxed mb-6">
                                        {feature.description}
                                    </p>
                                    <div className="flex items-center gap-2 text-brand-dark font-black text-sm group-hover:gap-3 transition-all">
                                        Unlock this feature <Plus size={16} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Large Action CTA */}
                        <div className="relative px-6 py-16 md:py-24 bg-brand-dark rounded-[3rem] overflow-hidden text-center shadow-2xl shadow-brand-dark/20 group">
                            <div className="absolute top-0 left-0 w-full h-full">
                                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-brand-softBlue/20 rounded-full blur-[100px] group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-brand-peach/10 rounded-full blur-[100px] group-hover:scale-110 transition-transform duration-1000 delay-150" />
                            </div>

                            <div className="relative z-10 max-w-2xl mx-auto">
                                <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                                    Turn Any Content into <br />
                                    <span className="text-brand-softBlue decoration-brand-softBlue">Perfect Lessons</span>
                                </h2>
                                <p className="text-white/60 text-lg mb-10 leading-relaxed font-medium">
                                    Don&apos;t just store files—interact with them. Join Hanabira to
                                    automatically generate personalized study plans from your own materials.
                                </p>
                                <button
                                    onClick={() => openAuth('REGISTER', { flowType: 'LIBRARY' })}
                                    className="px-10 py-5 bg-brand-softBlue text-brand-dark font-black rounded-2xl hover:bg-white hover:scale-105 transition-all shadow-xl shadow-brand-softBlue/20"
                                >
                                    Get Started for Free
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Search and Grid for Logged-in Users */}
                        <div className="relative mb-10 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-softBlue transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search your library..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-brand-softBlue/30 focus:ring-4 focus:ring-brand-softBlue/5 transition-all shadow-sm font-medium"
                            />
                        </div>

                        {filteredResources.length === 0 ? (
                            <div className="text-center py-24 bg-white/50 backdrop-blur rounded-3xl border-2 border-dashed border-slate-200">
                                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Search className="text-slate-300" size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-brand-dark mb-2">Build Your Vault</h3>
                                <p className="text-slate-500 mb-8">Upload your first PDF, image, or audio file to get started.</p>
                                <button
                                    onClick={() => setShowUploader(true)}
                                    className="px-8 py-3 bg-brand-dark text-white font-bold rounded-xl"
                                >
                                    Upload First File
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredResources.map((resource: any) => (
                                    <div
                                        key={resource.id}
                                        className="group relative bg-white rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:shadow-brand-softBlue/10 transition-all border border-slate-100 hover:border-brand-softBlue/30 cursor-pointer overflow-hidden animate-fadeIn"
                                        onClick={() => {
                                            window.location.href = `/library/resources/${resource.id}`;
                                        }}
                                    >
                                        <div className="flex flex-col h-full">
                                            <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-brand-softBlue/10 transition-colors w-fit mb-4">
                                                {getIcon(resource.type)}
                                            </div>

                                            <div className="flex-1">
                                                <h3 className="font-bold text-brand-dark mb-1 group-hover:text-brand-softBlue transition-colors line-clamp-1">
                                                    {resource.title}
                                                </h3>
                                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                                                    {resource.type} • {new Date(resource.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                <div className="flex items-center gap-1 text-brand-softBlue font-bold text-sm">
                                                    <Eye size={14} />
                                                    <span>View</span>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => handleDownload(e, resource.id)}
                                                        className="p-2 text-slate-400 hover:text-brand-softBlue hover:bg-brand-softBlue/10 rounded-xl transition-all"
                                                        title="Download"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(e, resource.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
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
