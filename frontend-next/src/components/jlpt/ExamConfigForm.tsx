"use client";

import React from 'react';
import {
    BookOpen, Brain, Headphones, FileText,
    Clock, GraduationCap, LayoutGrid, Users
} from 'lucide-react';
import { CreateExamFormState } from './CreateExamModal';
import { JLPTLevel, SkillType, TimerMode } from '@/types/practice';

interface ExamConfigFormProps {
    formState: CreateExamFormState;
    onUpdate: (updates: Partial<CreateExamFormState>) => void;
    generatedQuestionsCount: number;
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const SKILLS: { value: SkillType; label: string; icon: React.ReactNode }[] = [
    { value: 'VOCABULARY', label: 'Vocabulary', icon: <BookOpen size={16} /> },
    { value: 'GRAMMAR', label: 'Grammar', icon: <Brain size={16} /> },
    { value: 'READING', label: 'Reading', icon: <FileText size={16} /> },
    { value: 'LISTENING', label: 'Listening', icon: <Headphones size={16} /> },
];

const MODES: { value: 'QUIZ' | 'SINGLE_EXAM' | 'FULL_EXAM'; label: string; description: string }[] = [
    { value: 'QUIZ', label: 'Quick Quiz', description: 'Short practice session' },
    { value: 'SINGLE_EXAM', label: 'Single Skill', description: 'Focus on one skill area' },
    { value: 'FULL_EXAM', label: 'Full Exam', description: 'Complete JLPT simulation' },
];

const TIMER_MODES: { value: TimerMode; label: string }[] = [
    { value: 'UNLIMITED', label: 'No Time Limit' },
    { value: 'JLPT_STANDARD', label: 'JLPT Standard' },
    { value: 'CUSTOM', label: 'Custom Time' },
];

export function ExamConfigForm({ formState, onUpdate, generatedQuestionsCount }: ExamConfigFormProps) {
    const toggleSkill = (skill: SkillType) => {
        const newSkills = formState.skills.includes(skill)
            ? formState.skills.filter(s => s !== skill)
            : [...formState.skills, skill];
        onUpdate({ skills: newSkills.length > 0 ? newSkills : formState.skills });
    };

    return (
        <div className="p-6 space-y-6">
            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Exam Title *
                </label>
                <input
                    type="text"
                    value={formState.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    placeholder="My Custom JLPT Exam"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                </label>
                <textarea
                    value={formState.description}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    placeholder="Optional description for your exam..."
                    rows={2}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all resize-none"
                />
            </div>

            {/* Mode Selection */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                    <LayoutGrid size={14} className="inline mr-1" />
                    Exam Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {MODES.map((mode) => (
                        <button
                            key={mode.value}
                            onClick={() => onUpdate({ mode: mode.value })}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${formState.mode === mode.value
                                    ? 'border-brand-green bg-emerald-50'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <div className={`text-sm font-bold ${formState.mode === mode.value ? 'text-brand-green' : 'text-slate-700'}`}>
                                {mode.label}
                            </div>
                            <div className="text-xs text-neutral-ink mt-1">{mode.description}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* JLPT Level */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                    <GraduationCap size={14} className="inline mr-1" />
                    JLPT Level
                </label>
                <div className="flex gap-2">
                    {JLPT_LEVELS.map((level) => (
                        <button
                            key={level}
                            onClick={() => onUpdate({ level })}
                            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${formState.level === level
                                    ? 'bg-brand-green text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            {/* Skills */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                    Skills to Include *
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {SKILLS.map((skill) => (
                        <button
                            key={skill.value}
                            onClick={() => toggleSkill(skill.value)}
                            className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${formState.skills.includes(skill.value)
                                    ? 'border-brand-green bg-emerald-50 text-brand-green'
                                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                        >
                            {skill.icon}
                            <span className="font-medium text-sm">{skill.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Question Count */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Number of Questions
                </label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min={5}
                        max={50}
                        step={5}
                        value={formState.questionCount}
                        onChange={(e) => onUpdate({ questionCount: parseInt(e.target.value) })}
                        className="flex-1 accent-brand-green"
                    />
                    <div className="w-16 px-3 py-2 bg-slate-100 rounded-lg text-center font-bold text-brand-dark">
                        {formState.questionCount}
                    </div>
                </div>
                {generatedQuestionsCount > 0 && (
                    <p className="text-xs text-emerald-600 mt-2">
                        ✓ {generatedQuestionsCount} questions generated via AI
                    </p>
                )}
            </div>

            {/* Timer Mode */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                    <Clock size={14} className="inline mr-1" />
                    Timer Settings
                </label>
                <div className="space-y-3">
                    {TIMER_MODES.map((timer) => (
                        <label
                            key={timer.value}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${formState.timerMode === timer.value
                                    ? 'border-brand-green bg-emerald-50'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <input
                                type="radio"
                                name="timerMode"
                                value={timer.value}
                                checked={formState.timerMode === timer.value}
                                onChange={() => onUpdate({ timerMode: timer.value })}
                                className="accent-brand-green"
                            />
                            <span className="font-medium text-sm text-slate-700">{timer.label}</span>
                        </label>
                    ))}

                    {formState.timerMode === 'CUSTOM' && (
                        <div className="pl-7">
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={5}
                                    max={180}
                                    value={formState.timeLimitMinutes || ''}
                                    onChange={(e) => onUpdate({ timeLimitMinutes: parseInt(e.target.value) || null })}
                                    placeholder="30"
                                    className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-center"
                                />
                                <span className="text-sm text-neutral-ink">minutes</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Visibility */}
            <div>
                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                        type="checkbox"
                        checked={formState.isPublic}
                        onChange={(e) => onUpdate({ isPublic: e.target.checked })}
                        className="w-5 h-5 rounded accent-brand-green"
                    />
                    <div>
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                            <Users size={16} />
                            Make Public
                        </div>
                        <div className="text-xs text-neutral-ink">Allow others to take this exam</div>
                    </div>
                </label>
            </div>
        </div>
    );
}
