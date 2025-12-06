import React, { useRef } from 'react';
import { Resource } from '@/types/aiTutorTypes';
import { FileText, Link as LinkIcon, StickyNote, Trash2, X, Plus } from 'lucide-react';

interface ResourcesSidebarProps {
    resources: Resource[];
    selectedResources: string[];

    // Creation State
    newResType: 'note' | 'link' | 'document';
    setNewResType: (t: 'note' | 'link' | 'document') => void;
    newResTitle: string;
    setNewResTitle: (t: string) => void;
    newResContent: string;
    setNewResContent: (c: string) => void;

    // Actions
    onCreateResource: () => void;
    onDeleteResource: (id: string) => void;
    onToggleSelectResource: (id: string) => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

    // Mobile responsiveness
    isOpen: boolean;
    onClose: () => void;
}

export const ResourcesSidebar: React.FC<ResourcesSidebarProps> = ({
    resources,
    selectedResources,
    newResType,
    setNewResType,
    newResTitle,
    setNewResTitle,
    newResContent,
    setNewResContent,
    onCreateResource,
    onDeleteResource,
    onToggleSelectResource,
    onFileUpload,
    isOpen,
    onClose
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const renderResourceIcon = (type: string) => {
        switch (type) {
            case 'note': return <StickyNote size={16} className="text-brand-dark" />;
            case 'link': return <LinkIcon size={16} className="text-brand-dark" />;
            case 'document': return <FileText size={16} className="text-brand-dark" />;
            default: return <FileText size={16} />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-brand-cream dark:bg-gray-800 relative">

            {/* Header */}
            <div className="p-4 border-b-2 border-brand-dark bg-white flex justify-between items-center">
                <h2 className="font-extrabold text-lg text-brand-dark dark:text-white flex items-center gap-2">
                    <StickyNote size={20} className="text-brand-blue" />
                    RESOURCES
                </h2>
                <button onClick={onClose} className="hover:bg-brand-dark/10 p-1.5 rounded-lg transition-colors lg:hidden"><X size={20} className="text-brand-dark" /></button>
            </div>

            {/* Add Resource Form */}
            <div className="p-4 border-b-2 border-brand-dark bg-brand-cream/30">
                <div className="flex bg-white rounded-xl border-2 border-brand-dark overflow-hidden p-1 gap-1 mb-3">
                    {(['note', 'link', 'document'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setNewResType(type)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${newResType === type
                                ? 'bg-brand-dark text-white shadow-sm'
                                : 'text-brand-dark/60 hover:bg-brand-dark/5'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div className="space-y-2">
                    <input
                        type="text"
                        placeholder="Title"
                        value={newResTitle}
                        onChange={(e) => setNewResTitle(e.target.value)}
                        className="w-full px-3 py-2 text-sm border-2 border-brand-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/50 bg-white placeholder-brand-dark/40 font-medium"
                    />

                    {newResType === 'document' ? (
                        <div
                            className="border-2 border-dashed border-brand-dark/40 rounded-xl p-4 text-center cursor-pointer hover:bg-brand-blue/5 hover:border-brand-blue/50 transition-all"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={onFileUpload}
                                className="hidden"
                            />
                            <div className="text-xs font-bold text-brand-dark/60">Upload Document</div>
                            <div className="text-[10px] text-brand-dark/40 mt-1">PDF, TXT, DOCX</div>
                        </div>
                    ) : (
                        <textarea
                            placeholder={newResType === 'link' ? "https://example.com" : "Content..."}
                            value={newResContent}
                            onChange={(e) => setNewResContent(e.target.value)}
                            className="w-full px-3 py-2 text-sm border-2 border-brand-dark rounded-xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/50 bg-white placeholder-brand-dark/40 font-medium font-mono text-xs"
                        />
                    )}

                    <button
                        onClick={onCreateResource}
                        disabled={!newResTitle || !newResContent}
                        className="w-full py-2.5 bg-brand-blue text-brand-dark font-extrabold text-sm rounded-xl border-2 border-brand-dark shadow-hard-sm hover:translate-y-[1px] hover:shadow-sm active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Plus size={16} strokeWidth={3} /> ADD RESOURCE
                    </button>
                </div>
            </div>

            {/* Resource List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {resources.length === 0 ? (
                    <div className="text-center py-10 opacity-40 font-bold text-brand-dark text-sm">No resources yet</div>
                ) : (
                    resources.map(res => (
                        <div key={res._id} className="p-3 bg-white rounded-2xl border-2 border-brand-dark shadow-sm group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="p-1.5 rounded-lg bg-brand-cream border-2 border-brand-dark text-brand-dark flex-shrink-0">
                                        {renderResourceIcon(res.type)}
                                    </div>
                                    <span className="font-bold text-sm text-brand-dark truncate" title={res.title}>{res.title}</span>
                                </div>
                                <button onClick={() => onDeleteResource(res._id)} className="text-brand-dark/30 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50">
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="text-xs text-brand-dark/70 mb-3 truncate font-medium pl-1" title={res.content}>
                                {res.type === 'link' ? (
                                    <a href={res.content} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                        <LinkIcon size={10} /> {res.content}
                                    </a>
                                ) : (
                                    res.content
                                )}
                            </div>

                            <button
                                onClick={() => onToggleSelectResource(res._id)}
                                className={`w-full py-1.5 text-xs font-bold rounded-xl border-2 transition-all ${selectedResources.includes(res._id)
                                    ? "bg-brand-dark text-white border-brand-dark shadow-inner"
                                    : "bg-white text-brand-dark border-brand-dark hover:bg-brand-blue/10"
                                    }`}
                            >
                                {selectedResources.includes(res._id) ? "ATTACHED" : "ATTACH TO CHAT"}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
