"use client";

import React, { useState } from 'react';
import {
    Play, Edit3, Trash2, Share2, Lock, Globe,
    Loader2, FileEdit, Clock, Users, MoreVertical, Trophy
} from 'lucide-react';
import { UserCreatedExam } from '@/types/practice';

interface MyExamsListProps {
    exams: UserCreatedExam[];
    onStart: (examId: string) => void;
    onEdit: (examId: string) => void;
    onDelete: (examId: string) => void;
    isLoading?: boolean;
}

export function MyExamsList({
    exams,
    onStart,
    onEdit,
    onDelete,
    isLoading = false
}: MyExamsListProps) {
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (exams.length === 0) {
        return (
            <div className="text-center py-20 px-8 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                <div className="w-20 h-20 mx-auto mb-6 bg-card rounded-2xl flex items-center justify-center  text-muted-foreground/30">
                    <FileEdit size={40} />
                </div>
                <h3 className="text-xl font-black text-foreground mb-3 font-display tracking-tight">No Custom Exams</h3>
                <p className="text-sm font-bold text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Create your own challenges to test your limits.
                </p>
            </div>
        );
    }

    const formatDate = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const handleDelete = (examId: string) => {
        onDelete(examId);
        setDeleteConfirmId(null);
        setMenuOpenId(null);
    };

    return (
        <div className="grid grid-cols-1 gap-6">
            {exams.map((exam) => (
                <div
                    key={exam.id}
                    className="group p-6 bg-card rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-500  hover: "
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <h4 className="text-lg font-black text-foreground font-display tracking-tight group-hover:text-primary transition-colors">{exam.config.title}</h4>
                                {exam.isPublic ? (
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary/5 text-secondary border border-secondary/20 rounded-full text-[9px] font-black font-display uppercase tracking-widest ">
                                        <Globe size={10} />
                                        Public
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-muted text-muted-foreground border border-border/50 rounded-full text-[9px] font-black font-display uppercase tracking-widest ">
                                        <Lock size={10} />
                                        Private
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 font-display">
                                <span className="px-2.5 py-1 bg-muted rounded  text-foreground/70">
                                    {exam.config.level}
                                </span>
                                <span className="flex items-center gap-1.5 opacity-60">
                                    <Clock size={12} />
                                    {exam.questions.length} questions
                                </span>
                                <span className="flex items-center gap-1.5 opacity-60">
                                    <Clock size={12} />
                                    {formatDate(exam.createdAt)}
                                </span>
                            </div>
                        </div>

                        {/* Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpenId(menuOpenId === exam.id ? null : exam.id)}
                                className="p-3 hover:bg-muted rounded-xl transition-all  bg-card border border-border/50 text-muted-foreground hover:text-foreground active:scale-90"
                            >
                                <MoreVertical size={16} />
                            </button>

                            {menuOpenId === exam.id && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setMenuOpenId(null)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-[1.5rem]  border border-border/50 py-2 z-20 animate-in zoom-in-95 duration-200">
                                        <button
                                            onClick={() => { onEdit(exam.id); setMenuOpenId(null); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black font-display uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-muted/30 transition-all border-b border-border/10"
                                        >
                                            <Edit3 size={14} />
                                            Modify Exam
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmId(exam.id)}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black font-display uppercase tracking-widest text-destructive hover:bg-destructive/5 transition-all"
                                        >
                                            <Trash2 size={14} />
                                            Purge Challenge
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {exam.config.description && (
                        <p className="text-sm font-bold text-muted-foreground mb-6 line-clamp-2 leading-relaxed">
                            {exam.config.description}
                        </p>
                    )}

                    {/* Skills Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {exam.config.skills.map((skill) => (
                            <span
                                key={skill}
                                className="px-3 py-1.5 bg-primary/5 text-primary border border-primary/20 rounded-full text-[9px] font-black font-display uppercase tracking-widest "
                            >
                                {skill.toLowerCase()}
                            </span>
                        ))}
                    </div>

                    {/* Meta Stats */}
                    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 font-display mb-8">
                        {exam.config.timerMode !== 'UNLIMITED' && exam.config.timeLimitMinutes && (
                            <span className="flex items-center gap-2">
                                <Clock size={14} />
                                <span className="text-foreground/80">{exam.config.timeLimitMinutes}</span> MINS
                            </span>
                        )}
                        {exam.timesAttempted > 0 && (
                            <span className="flex items-center gap-2">
                                <Users size={14} />
                                <span className="text-foreground/80">{exam.timesAttempted}</span> ATTEMPTS
                            </span>
                        )}
                        {exam.averageScore !== undefined && exam.averageScore > 0 && (
                            <span className="flex items-center gap-2 text-primary">
                                <Trophy size={14} />
                                AVG: <span className="text-primary">{Math.round(exam.averageScore)}%</span>
                            </span>
                        )}
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={() => onStart(exam.id)}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-foreground text-background rounded-xl font-black font-display text-[10px] uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition-all  group/btn"
                    >
                        <Play size={16} className="fill-current group-hover/btn:scale-125 transition-transform" />
                        Engage Challenge
                    </button>

                    {/* Delete Confirmation Overlay */}
                    {deleteConfirmId === exam.id && (
                        <div className="absolute inset-0 z-30 bg-background/95  rounded-2xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                            <p className="text-sm font-black font-display uppercase tracking-widest text-destructive mb-6">
                                Irreversible purification action?
                            </p>
                            <div className="flex gap-4 w-full max-w-xs">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 py-3 bg-card border border-border/50 rounded-xl text-[10px] font-black font-display uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all "
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(exam.id)}
                                    className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-xl text-[10px] font-black font-display uppercase tracking-widest hover:opacity-90 transition-all "
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
