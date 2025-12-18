
"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { useUser } from '@/context/UserContext';
import { FileText, Image, Music, Search, Plus, Trash2, Download, Eye } from 'lucide-react';
import { ResourceUploader } from '@/components/resources/ResourceUploader';
import Link from 'next/link';
import { resourceService } from '@/services/resourceService';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ResourcesListPage() {
    const { user } = useUser();
    const [showUploader, setShowUploader] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const FLASK_API_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5100';
    const { data: response, mutate } = useSWR(
        user ? `${FLASK_API_URL}/f-api/v1/resources?userId=${user.id}` : null,
        fetcher
    );

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

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-brand-dark">My Resources</h1>
                    <p className="text-slate-500">Manage your uploaded documents and files</p>
                </div>
                <button
                    onClick={() => setShowUploader(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-green/90 transition-colors"
                >
                    <Plus size={20} />
                    Upload New
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                />
            </div>

            {/* Resources Grid */}
            {filteredResources.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <p>No resources found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredResources.map((resource: any) => (
                        <Link
                            key={resource.id}
                            href={`/library/resources/${resource.id}`}
                            className="group bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-transparent hover:border-brand-green/20"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-brand-green/5 transition-colors">
                                    {getIcon(resource.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-brand-dark truncate pr-2">
                                        {resource.title}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {resource.type} • {new Date(resource.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleDownload(e, resource.id)}
                                        className="p-1.5 text-slate-400 hover:text-brand-green hover:bg-brand-green/10 rounded-md"
                                        title="Download"
                                    >
                                        <Download size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, resource.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUploader && (
                <ResourceUploader
                    onClose={() => setShowUploader(false)}
                    onUploadComplete={() => { mutate(); setShowUploader(false); }}
                />
            )}
        </div>
    );
}
