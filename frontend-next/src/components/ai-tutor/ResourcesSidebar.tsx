import React, { useRef } from 'react';
import { Resource } from '@/types/aiTutorTypes';
import { FileText, Link as LinkIcon, StickyNote, Trash2, X } from 'lucide-react';

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
            case 'note': return <StickyNote size={16} className="text-yellow-500" />;
            case 'link': return <LinkIcon size={16} className="text-blue-500" />;
            case 'document': return <FileText size={16} className="text-red-500" />;
            default: return <FileText size={16} />;
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 lg:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`
        fixed inset-y-0 right-0 z-30 flex flex-col
        transition-transform duration-300 ease-in-out
        w-[85vw] sm:w-80 lg:relative lg:translate-x-0 lg:w-80 lg:inset-auto
        bg-brand-cream dark:bg-gray-800 border-l-2 border-brand-dark
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}>
                <div className="p-4 border-b-2 border-brand-dark flex justify-between items-center bg-brand-green/10">
                    <h2 className="font-extrabold text-lg text-brand-dark dark:text-white flex items-center gap-2">RESOURCES <StickyNote size={18} /></h2>
                    <button onClick={onClose} className="hover:bg-brand-dark/10 p-1 rounded"><X size={24} className="text-brand-dark" /></button>
                </div>

                {/* Add Resource Form */}
                <div className="p-4 border-b-2 border-brand-dark bg-white">
                    <div className="flex gap-2 mb-3">
                        {(['note', 'link', 'document'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setNewResType(type)}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border-2 capitalize transition-all ${newResType === type
                                    ? 'bg-brand-dark text-white border-brand-dark shadow-hard-sm'
                                    : 'bg-white text-brand-dark border-brand-dark/30 hover:border-brand-dark'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <input
                        type="text"
                        placeholder="Title"
                        value={newResTitle}
                        onChange={(e) => setNewResTitle(e.target.value)}
                        className="w-full mb-2 px-3 py-2 text-sm border-2 border-brand-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
                    />

                    {newResType === 'document' ? (
                        <div className="mb-3">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={onFileUpload}
                                className="text-sm text-brand-dark file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-2 file:border-brand-dark file:text-xs file:font-bold file:bg-brand-cream file:text-brand-dark hover:file:bg-brand-blue/20"
                            />
                        </div>
                    ) : (
                        <textarea
                            placeholder={newResType === 'link' ? "https://..." : "Content..."}
                            value={newResContent}
                            onChange={(e) => setNewResContent(e.target.value)}
                            className="w-full mb-3 px-3 py-2 text-sm border-2 border-brand-dark rounded-lg h-24 resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
                        />
                    )}

                    <button
                        onClick={onCreateResource}
                        disabled={!newResTitle || !newResContent}
                        className="w-full py-2 bg-brand-blue text-brand-dark font-bold text-sm rounded-xl border-2 border-brand-dark shadow-hard-sm hover:translate-y-[1px] hover:shadow-sm active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        ADD RESOURCE
                    </button>
                </div>

                {/* Resource List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-brand-cream/30">
                    {resources.map(res => (
                        <div key={res._id} className="p-3 bg-white rounded-xl border-2 border-brand-dark shadow-hard-sm group transition-transform hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 rounded bg-brand-cream border border-brand-dark">
                                        {renderResourceIcon(res.type)}
                                    </div>
                                    <span className="font-bold text-sm text-brand-dark leading-tight" title={res.title}>{res.title}</span>
                                </div>
                                <button onClick={() => onDeleteResource(res._id)} className="lg:opacity-0 lg:group-hover:opacity-100 text-brand-dark/30 hover:text-red-500 transition-opacity">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="text-xs text-brand-dark/70 mb-3 truncate font-mono bg-gray-50 p-1 rounded" title={res.content}>
                                {res.type === 'link' ? (
                                    <a href={res.content} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{res.content}</a>
                                ) : (
                                    res.content
                                )}
                            </div>

                            <button
                                onClick={() => onToggleSelectResource(res._id)}
                                className={`w-full py-1.5 text-xs font-bold rounded-lg border-2 transition-all ${selectedResources.includes(res._id)
                                    ? "bg-brand-dark text-white border-brand-dark"
                                    : "bg-white text-brand-dark border-brand-dark hover:bg-brand-blue/20"
                                    }`}
                            >
                                {selectedResources.includes(res._id) ? "ATTACHED" : "ATTACH TO CHAT"}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
