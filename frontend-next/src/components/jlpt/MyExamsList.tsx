"use client";

import React, { useState } from 'react';
import {
    Play, Edit3, Trash2, Share2, Lock, Globe,
    Loader2, FileEdit, Clock, Users, MoreVertical
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
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <FileEdit size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-600 mb-2">No Custom Exams</h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">
                    Create your own exam using the &quot;Create New Exam&quot; button above.
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
        <div className="space-y-3">
            {exams.map((exam) => (
                <div
                    key={exam.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-brand-dark">{exam.config.title}</h4>
                                {exam.isPublic ? (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs font-medium">
                                        <Globe size={10} />
                                        Public
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs font-medium">
                                        <Lock size={10} />
                                        Private
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span className="px-2 py-0.5 bg-slate-200 rounded font-medium">
                                    {exam.config.level}
                                </span>
                                <span>{exam.questions.length} questions</span>
                                <span className="text-slate-400">•</span>
                                <span>{formatDate(exam.createdAt)}</span>
                            </div>
                        </div>

                        {/* Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpenId(menuOpenId === exam.id ? null : exam.id)}
                                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                <MoreVertical size={16} className="text-slate-500" />
                            </button>

                            {menuOpenId === exam.id && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setMenuOpenId(null)}
                                    />
                                    <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                                        <button
                                            onClick={() => { onEdit(exam.id); setMenuOpenId(null); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            <Edit3 size={14} />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmId(exam.id)}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 size={14} />
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {exam.config.description && (
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                            {exam.config.description}
                        </p>
                    )}

                    {/* Skills Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                        {exam.config.skills.map((skill) => (
                            <span
                                key={skill}
                                className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium"
                            >
                                {skill.toLowerCase()}
                            </span>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                        {exam.config.timerMode !== 'UNLIMITED' && exam.config.timeLimitMinutes && (
                            <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {exam.config.timeLimitMinutes} min
                            </span>
                        )}
                        {exam.timesAttempted > 0 && (
                            <span className="flex items-center gap-1">
                                <Users size={12} />
                                {exam.timesAttempted} attempts
                            </span>
                        )}
                        {exam.averageScore !== undefined && exam.averageScore > 0 && (
                            <span className="text-emerald-600 font-medium">
                                Avg: {Math.round(exam.averageScore)}%
                            </span>
                        )}
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={() => onStart(exam.id)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-green text-white rounded-lg font-bold text-sm hover:bg-brand-green/90 transition-colors"
                    >
                        <Play size={16} />
                        Start Exam
                    </button>

                    {/* Delete Confirmation */}
                    {deleteConfirmId === exam.id && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700 mb-2">
                                Are you sure you want to delete this exam?
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 py-1.5 bg-white border border-slate-200 rounded text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(exam.id)}
                                    className="flex-1 py-1.5 bg-red-600 text-white rounded text-sm font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
