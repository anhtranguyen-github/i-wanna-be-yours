"use client";

import React, { useState } from 'react';
import { X, Sparkles, Save, Loader2 } from 'lucide-react';
import { ExamConfigForm } from './ExamConfigForm';
import { ExamChatAssistant } from './ExamChatAssistant';
import { ExamPreview } from './ExamPreview';
import { JLPTLevel, SkillType, TimerMode, Question, UserCreatedExam, ExamConfig } from '@/types/practice';
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

            const nodeConfig: ExamConfig = {
                id: tempId,
                title: formState.title,
                description: formState.description,
                mode: formState.mode,
                tags: {
                    level: formState.level,
                    skills: formState.skills,
                    origin: 'manual',
                    timerMode: formState.timerMode,
                },
                stats: {
                    questionCount: formState.questionCount,
                    timeLimitMinutes: formState.timeLimitMinutes || undefined,
                }
            };

            const examPayload = {
                config: nodeConfig,
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
                className="absolute inset-0 bg-background/80  animate-in fade-in duration-500"
                onClick={handleClose}
            />

            {/* Panel */}
            <div className="relative w-full max-w-4xl bg-background  flex flex-col animate-in slide-in-from-right duration-500 border-l border-border">
                {/* Header */}
                <header className="flex items-center justify-between px-8 py-6 border-b border-border bg-card">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center  border border-secondary/20">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-foreground font-display tracking-tight">Create New Exam</h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Manual Setup & AI Synthesis</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground font-black rounded-2xl hover:opacity-90 transition-all disabled:opacity-50  font-display text-[10px] uppercase tracking-widest"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Save Exam
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleClose}
                            className="p-3 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-foreground active:scale-95  bg-card border border-border/50"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </header>

                {/* Error Banner */}
                {error && (
                    <div className="px-8 py-4 bg-destructive/5 border-b border-destructive/10 text-destructive text-xs font-black uppercase tracking-widest font-display flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="p-1 hover:bg-destructive/10 rounded-lg">×</button>
                    </div>
                )}

                {/* Mobile Tab Switcher */}
                <div className="lg:hidden flex border-b border-border bg-card/50">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest font-display transition-all ${activeTab === 'config'
                            ? 'text-primary border-b-2 border-primary bg-primary/5'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Configuration
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest font-display transition-all ${activeTab === 'chat'
                            ? 'text-primary border-b-2 border-primary bg-primary/5'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        AI Assistant
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Configuration Form */}
                    <div className={`lg:w-1/2 lg:border-r border-border overflow-y-auto custom-scrollbar ${activeTab === 'config' ? 'block' : 'hidden lg:block'
                        }`}>
                        <ExamConfigForm
                            formState={formState}
                            onUpdate={updateFormState}
                            generatedQuestionsCount={generatedQuestions.length}
                        />

                        {generatedQuestions.length > 0 && (
                            <div className="p-8 border-t border-border bg-muted/20">
                                <ExamPreview questions={generatedQuestions} />
                            </div>
                        )}
                    </div>

                    {/* Right: AI Chat */}
                    <div className={`lg:w-1/2 flex flex-col bg-muted/5 ${activeTab === 'chat' ? 'flex' : 'hidden lg:flex'
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
