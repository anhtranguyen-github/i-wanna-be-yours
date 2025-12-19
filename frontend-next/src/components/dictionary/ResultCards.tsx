import React from 'react';
import { DictionaryEntry, ExampleSentence } from '@/services/dictionaryService';
import { Volume2, BookOpen, MessageSquare, PenTool } from 'lucide-react';

interface VocabCardProps {
    data: DictionaryEntry;
}

export const VocabCard = ({ data }: VocabCardProps) => {
    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-3xl font-bold font-jp text-slate-800">{data.head}</h3>
                    {data.reading && <p className="text-lg text-brand-blue font-jp font-medium">{data.reading}</p>}
                </div>
                <div className="flex gap-2">
                    {data.audio || true && (
                        <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-brand-green hover:bg-brand-green/10 rounded-full transition-colors">
                            <Volume2 size={20} />
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 text-amber-700 text-sm italic">
                    {data.grammarNote || "Commonly used word in diverse contexts."}
                </div>

                <div>
                    <p className="text-xl text-slate-700 font-bold leading-tight">{data.meaning}</p>
                    {data.tags && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {data.tags.map(tag => (
                                <span key={tag} className="text-[11px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface KanjiCardProps {
    data: DictionaryEntry;
}

export const KanjiCard = ({ data }: KanjiCardProps) => {
    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex gap-6">
                <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
                    <span className="text-5xl font-jp font-bold text-brand-dark">{data.head}</span>
                </div>
                <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-[80px,1fr] gap-2 items-start">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-1">Onyomi</span>
                        <span className="text-red-500 font-bold text-lg font-jp">{data.onyomi || "---"}</span>
                    </div>
                    <div className="grid grid-cols-[80px,1fr] gap-2 items-start">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-1">Kunyomi</span>
                        <span className="text-brand-blue font-bold text-lg font-jp">{data.kunyomi || "---"}</span>
                    </div>
                    <div className="grid grid-cols-[80px,1fr] gap-2 items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Strokes</span>
                        <span className="text-slate-700 font-bold">{data.strokes || "--"}</span>
                    </div>
                </div>
            </div>
            <div className="mt-6 pt-5 border-t border-slate-50">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Meaning</h4>
                <p className="text-xl text-slate-800 font-bold">{data.meaning}</p>
            </div>
        </div>
    );
};

interface GrammarCardProps {
    data: DictionaryEntry;
}

export const GrammarCard = ({ data }: GrammarCardProps) => {
    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:border-brand-green/30 transition-all">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-brand-green/10 text-brand-green rounded-xl">
                    <BookOpen size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">{data.head}</h3>
            </div>
            <p className="text-lg text-slate-700 font-medium mb-4">{data.meaning}</p>
            {data.example && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 border-l-4 border-l-brand-green">
                    <p className="text-slate-700 font-jp text-lg mb-2">{data.example.split('(')[0]}</p>
                    <p className="text-slate-500 text-sm italic">{data.example.split('(')[1]?.replace(')', '')}</p>
                </div>
            )}
        </div>
    );
};

interface SentenceCardProps {
    data: ExampleSentence;
}

export const SentenceCard = ({ data }: SentenceCardProps) => {
    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
            <div className="flex gap-4">
                <div className="mt-1 flex-shrink-0">
                    <MessageSquare size={18} className="text-slate-300 group-hover:text-brand-green transition-colors" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <p className="font-jp text-xl text-slate-800 leading-snug group-hover:text-brand-green transition-colors">
                            {data.ja}
                        </p>
                        <Volume2 size={16} className="text-slate-300 cursor-pointer hover:text-brand-dark" />
                    </div>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        {data.en}
                    </p>
                </div>
            </div>
        </div>
    );
};
