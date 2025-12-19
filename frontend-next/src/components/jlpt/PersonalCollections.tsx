"use client";

import React, { useState } from 'react';
import { Trophy, FileEdit, History, BookOpen } from 'lucide-react';
import { MyResultsList } from './MyResultsList';
import { MyExamsList } from './MyExamsList';
import { ExamAttempt, UserCreatedExam } from '@/types/practice';

type CollectionTab = 'results' | 'exams';

interface PersonalCollectionsProps {
    attempts: ExamAttempt[];
    userExams: UserCreatedExam[];
    onRetakeExam: (examId: string) => void;
    onReviewAttempt: (attemptId: string) => void;
    onStartExam: (examId: string) => void;
    onEditExam: (examId: string) => void;
    onDeleteExam: (examId: string) => void;
    isLoading?: boolean;
}

export function PersonalCollections({
    attempts,
    userExams,
    onRetakeExam,
    onReviewAttempt,
    onStartExam,
    onEditExam,
    onDeleteExam,
    isLoading = false,
}: PersonalCollectionsProps) {
    const [activeTab, setActiveTab] = useState<CollectionTab>('results');

    const tabs: { id: CollectionTab; label: string; icon: React.ReactNode; count: number }[] = [
        { id: 'results', label: 'My Results', icon: <Trophy size={16} />, count: attempts.length },
        { id: 'exams', label: 'My Exams', icon: <FileEdit size={16} />, count: userExams.length },
    ];

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'text-brand-green border-b-2 border-brand-green bg-emerald-50/50'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id
                                    ? 'bg-brand-green text-white'
                                    : 'bg-slate-200 text-slate-600'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="p-4">
                {activeTab === 'results' && (
                    <MyResultsList
                        attempts={attempts}
                        onRetake={onRetakeExam}
                        onReview={onReviewAttempt}
                        isLoading={isLoading}
                    />
                )}
                {activeTab === 'exams' && (
                    <MyExamsList
                        exams={userExams}
                        onStart={onStartExam}
                        onEdit={onEditExam}
                        onDelete={onDeleteExam}
                        isLoading={isLoading}
                    />
                )}
            </div>
        </div>
    );
}
