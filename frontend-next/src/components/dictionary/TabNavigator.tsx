import React from 'react';
import { Book, Edit3, MessageCircle, GitBranch, LayoutGrid, Globe } from 'lucide-react';

export type DictionaryTab = 'vocab' | 'kanji' | 'sentences' | 'grammar' | 'j-j';

interface TabNavigatorProps {
    activeTab: DictionaryTab;
    onTabChange: (tab: DictionaryTab) => void;
}

const TABS: { id: DictionaryTab; icon: any; label: string }[] = [
    { id: 'vocab', icon: Book, label: 'Vocabulary' },
    { id: 'kanji', icon: Edit3, label: 'Kanji' },
    { id: 'sentences', icon: MessageCircle, label: 'Sentences' },
    { id: 'grammar', icon: GitBranch, label: 'Grammar' },
    { id: 'j-j', icon: Globe, label: 'J-J' },
];

export const TabNavigator = ({ activeTab, onTabChange }: TabNavigatorProps) => {
    return (
        <div className="flex items-center gap-3 py-2">
            {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            group flex items-center justify-center gap-2 px-6 py-2.5 rounded-full transition-all border-2
                            ${isActive
                                ? 'bg-white border-brand-blue/30 text-brand-blue shadow-sm ring-4 ring-brand-blue/5'
                                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
                        `}
                    >
                        <tab.icon size={18} className={isActive ? 'text-brand-blue' : 'text-slate-400 group-hover:text-slate-500'} strokeWidth={2.5} />
                        <span className={`text-sm tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
