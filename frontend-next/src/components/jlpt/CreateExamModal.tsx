"use client";

import React, { useState } from 'react';
import { X, Sparkles, Save, Loader2 } from 'lucide-react';
import { ExamConfigForm } from './ExamConfigForm';
import { ExamChatAssistant } from './ExamChatAssistant';
import { JLPTLevel, SkillType, TimerMode, Question, UserCreatedExam } from '@/types/practice';
import * as jlptService from '@/services/jlptService';
import { useUser } from '@/context/UserContext';

export interface CreateExamFormState {
    title: string;
    description: string;
    mode: 'QUIZ' | 'SINGLE_EXAM' | 'FULL_EXAM';
    level: JLPTLevel;
    skills: SkillType[];
    questionCount: number;
    timerMode: TimerMode;
    timeLimitMinutes: number | null;
    isPublic: boolean;
}

interface CreateExamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExamCreated: (examId: string) => void;
}

const initialFormState: CreateExamFormState = {
    title: '',
    description: '',
    mode: 'QUIZ',
    level: 'N3',
    skills: ['VOCABULARY'],
    questionCount: 10,
    timerMode: 'UNLIMITED',
    timeLimitMinutes: null,
    isPublic: false,
};

export function CreateExamModal({ isOpen, onClose, onExamCreated }: CreateExamModalProps) {
    const { user } = useUser();
    const [formState, setFormState] = useState<CreateExamFormState>(initialFormState);
    const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'config' | 'chat'>('config');
    const [error, setError] = useState<string | null>(null);

    const updateFormState = (updates: Partial<CreateExamFormState>) => {
        setFormState(prev => ({ ...prev, ...updates }));
    };

    const handleQuestionsGenerated = (questions: Question[]) => {
        setGeneratedQuestions(questions);
    };

    const validateForm = (): string | null => {
        if (!formState.title.trim()) return 'Please enter an exam title';
        if (formState.skills.length === 0) return 'Please select at least one skill';
        if (formState.questionCount < 1) return 'Question count must be at least 1';
        if (formState.timerMode === 'CUSTOM' && !formState.timeLimitMinutes) {
            return 'Please set a time limit for custom timer mode';
        }
        return null;
    };

    const handleSave = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const tempId = `user-exam-${Date.now()}`;
            let examId = '';

            const examPayload = {
                config: { ...formState, id: tempId },
                questions: generatedQuestions,
                origin: 'manual' as const,
                isPublic: formState.isPublic,
            };

            if (user) {
                // Save to API
                const response = await jlptService.createExam(examPayload);
                examId = response.id;
            } else {
                // Save to Local Storage for guests
                examId = tempId;
                const newExam: UserCreatedExam = {
                    id: examId,
                    userId: 'guest',
                    ...examPayload,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    timesAttempted: 0,
                };
                jlptService.saveLocalUserExam(newExam);
            }

            onExamCreated(examId);
            onClose();

            // Reset form
            setFormState(initialFormState);
            setGeneratedQuestions([]);
        } catch (err: any) {
            setError(err.message || 'Failed to create exam');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setFormState(initialFormState);
        setGeneratedQuestions([]);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Panel */}
            <div className="relative w-full max-w-4xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-brand-dark">Create New Exam</h2>
                            <p className="text-xs text-slate-500">Configure manually or use AI to generate</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green/90 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Exam
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </header>

                {/* Error Banner */}
                {error && (
                    <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-red-600 text-sm flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
                    </div>
                )}

                {/* Mobile Tab Switcher */}
                <div className="lg:hidden flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'config'
                            ? 'text-brand-green border-b-2 border-brand-green'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Configuration
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'chat'
                            ? 'text-brand-green border-b-2 border-brand-green'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        AI Assistant
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Configuration Form */}
                    <div className={`lg:w-1/2 lg:border-r border-slate-200 overflow-y-auto ${activeTab === 'config' ? 'block' : 'hidden lg:block'
                        }`}>
                        <ExamConfigForm
                            formState={formState}
                            onUpdate={updateFormState}
                            generatedQuestionsCount={generatedQuestions.length}
                        />
                    </div>

                    {/* Right: AI Chat */}
                    <div className={`lg:w-1/2 flex flex-col ${activeTab === 'chat' ? 'flex' : 'hidden lg:flex'
                        }`}>
                        <ExamChatAssistant
                            formState={formState}
                            onFormUpdate={updateFormState}
                            onQuestionsGenerated={handleQuestionsGenerated}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
