"use client";

import React, { useEffect, useState } from 'react';
import { fetchHistory } from '@/services/recordService';
import { History, Calendar, Trophy, Zap, Layers, ChevronRight } from 'lucide-react';

export function HistoryPanel() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await fetchHistory(5);
            setHistory(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;

    if (history.length === 0) {
        return (
            <div className="bg-neutral-white border border-neutral-gray/20 rounded-2xl p-6 text-center">
                <History className="mx-auto text-neutral-ink/30 mb-2" size={24} />
                <p className="text-xs font-bold text-neutral-ink/50">No recent activity</p>
            </div>
        );
    }

    return (
        <div className="bg-neutral-white border border-neutral-gray/20 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-neutral-gray/10 flex items-center justify-between">
                <h4 className="text-sm font-black text-neutral-ink font-display uppercase tracking-widest flex items-center gap-2">
                    <History size={14} className="text-primary-strong" />
                    Recent Activity
                </h4>
            </div>
            <div className="divide-y divide-neutral-gray/10">
                {history.map((record: any) => (
                    <div key={record._id} className="p-4 flex items-center gap-4 hover:bg-neutral-beige/20 transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.itemType === 'QUOOT' ? 'bg-secondary/10 text-secondary' :
                                record.itemType === 'FLASHCARD' ? 'bg-primary/10 text-primary-strong' :
                                    'bg-neutral-ink/10 text-neutral-ink'
                            }`}>
                            {record.itemType === 'QUOOT' ? <Zap size={18} /> :
                                record.itemType === 'FLASHCARD' ? <Layers size={18} /> :
                                    <Trophy size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-black text-neutral-ink truncate">{record.itemTitle || record.itemType}</h5>
                            <div className="flex items-center gap-2 text-[10px] text-neutral-ink/50 font-bold mt-0.5">
                                <Calendar size={10} />
                                {new Date(record.timestamp).toLocaleDateString()}
                            </div>
                        </div>
                        {record.score !== undefined && (
                            <div className="text-right">
                                <div className="text-sm font-black text-neutral-ink font-display">{record.score}%</div>
                                <div className="text-[9px] font-bold text-neutral-ink/40 uppercase">Score</div>
                            </div>
                        )}
                        <ChevronRight size={14} className="text-neutral-ink/20" />
                    </div>
                ))}
            </div>
        </div>
    );
}
