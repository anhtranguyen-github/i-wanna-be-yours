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
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden ">
            {/* Tabs */}
            <div className="flex p-1.5 bg-muted/30 border-b border-border/50">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all font-display ${activeTab === tab.id
                            ? 'bg-card text-primary  border border-border/50'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black ${activeTab === tab.id
                                ? 'bg-primary text-primary-foreground '
                                : 'bg-muted text-muted-foreground'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="p-8">
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
