'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { ChevronLeft, Plus, Trash2, Save, Loader2, AlertCircle, Check, ArrowLeft, Zap } from 'lucide-react';
import Link from 'next/link';
import { createQuiz } from '@/services/quizService';
import { useGlobalAuth } from "@/context/GlobalAuthContext";

const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1', 'mixed'];
const CATEGORIES = ['vocabulary', 'grammar', 'kanji', 'reading', 'mixed'];
const QUESTION_TYPES = [
    { value: 'vocab_reading', label: 'Vocabulary Reading', category: 'vocabulary' },
    { value: 'vocab_synonym', label: 'Synonym Match', category: 'vocabulary' },
    { value: 'kanji_reading', label: 'Kanji Reading', category: 'kanji' },
    { value: 'kanji_meaning', label: 'Kanji Meaning', category: 'kanji' },
    { value: 'grammar_fill_blank', label: 'Fill in the Blank', category: 'grammar' },
    { value: 'reading_comprehension', label: 'Reading Comprehension', category: 'reading' },
];

interface QuizQuestion {
    id: string;
    question_type: string;
    prompt: string;
    options: string[];
    correct_answer: string;
    points: number;
}

export default function CreateQuizPage() {
    const router = useRouter();
    const { user, loading: userLoading } = useUser();
    const { openAuth } = useGlobalAuth();
    const isGuest = !user;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [jlptLevel, setJlptLevel] = useState('N5');
    const [category, setCategory] = useState('vocabulary');
    const [timeLimit, setTimeLimit] = useState<number | null>(null);
    const [isPublic, setIsPublic] = useState(false);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const addQuestion = () => {
        const newQuestion: QuizQuestion = {
            id: `q-${Date.now()}`,
            question_type: 'vocab_reading',
            prompt: '',
            options: ['', '', '', ''],
            correct_answer: '',
            points: 1,
        };
        setQuestions([...questions, newQuestion]);
        setActiveQuestionIndex(questions.length);
    };

    const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], ...updates };
        setQuestions(updated);
    };

    const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
        const updated = [...questions];
        updated[questionIndex].options[optionIndex] = value;
        setQuestions(updated);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
        if (activeQuestionIndex === index) setActiveQuestionIndex(null);
        else if (activeQuestionIndex && activeQuestionIndex > index) setActiveQuestionIndex(activeQuestionIndex - 1);
    };

    const handleSave = async () => {
        if (isGuest) {
            openAuth('REGISTER', { title: 'Create Account', description: 'Sign up to save your quiz.' });
            return;
        }
        if (!title.trim()) { setError('Title is required.'); return; }
        if (questions.length === 0) { setError('Add at least one question.'); return; }

        setSaving(true);
        setError('');

        try {
            const quizData = {
                author_id: String(user.id),
                title,
                description,
                origin: 'manual' as const,
                jlpt_level: jlptLevel,
                category,
                time_limit_seconds: timeLimit || undefined,
                is_public: isPublic,
                questions: questions.map(q => ({
                    question_type: q.question_type,
                    content: { prompt: q.prompt, options: q.options, correct_answer: q.correct_answer, scoring_rule: 'binary' },
                    points: q.points,
                    learning_points: [],
                })),
            };
            const result = await createQuiz(quizData);
            setSuccess('Quiz created successfully!');
            setTimeout(() => router.push(`/practice/session/${result.id}`), 1000);
        } catch (err: any) {
            setError(err.message || 'Failed to create quiz.');
        } finally {
            setSaving(false);
        }
    };

    if (userLoading) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="bg-card border-b border-border sticky top-0 z-50 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Link href="/practice" className="w-10 h-10 bg-muted hover:bg-muted/80 rounded-xl flex items-center justify-center transition-colors">
                            <ArrowLeft size={20} className="text-muted-foreground" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-foreground font-display">Create Quiz</h1>
                            <p className="text-xs text-muted-foreground">Design your own practice quiz</p>
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-colors disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                        Save Quiz
                    </button>
                </div>
            </header>

            {/* Guest Banner */}
            {isGuest && (
                <div className="max-w-6xl mx-auto px-6 mt-6">
                    <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3 text-primary">
                            <Zap size={18} />
                            <p className="text-sm font-bold">Sign up to save your quizzes</p>
                        </div>
                        <button onClick={() => openAuth('REGISTER')} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">Sign Up</button>
                    </div>
                </div>
            )}

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Alerts */}
                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive">
                        <AlertCircle size={18} />
                        <span className="text-sm font-bold">{error}</span>
                        <button onClick={() => setError('')} className="ml-auto text-destructive/60 hover:text-destructive">×</button>
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3 text-primary">
                        <Check size={18} />
                        <span className="text-sm font-bold">{success}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Settings Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-card rounded-2xl border border-border p-6">
                            <h2 className="text-sm font-bold text-muted-foreground mb-6">Quiz Settings</h2>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Title</label>
                                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter quiz title..." className="w-full px-4 py-3 bg-muted rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Description</label>
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..." rows={3} className="w-full px-4 py-3 bg-muted rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground mb-1.5 block">JLPT Level</label>
                                        <select value={jlptLevel} onChange={(e) => setJlptLevel(e.target.value)} className="w-full px-4 py-3 bg-muted rounded-xl border-none focus:outline-none">
                                            {JLPT_LEVELS.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Category</label>
                                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 bg-muted rounded-xl border-none focus:outline-none">
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Time Limit (minutes)</label>
                                    <input type="number" value={timeLimit || ''} onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : null)} placeholder="No limit" className="w-full px-4 py-3 bg-muted rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                    <span className="text-sm font-bold text-foreground">Public Quiz</span>
                                    <button onClick={() => setIsPublic(!isPublic)} className={`w-12 h-7 rounded-full transition-colors ${isPublic ? 'bg-primary' : 'bg-border'}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Question Editor */}
                    <div className="lg:col-span-8">
                        <div className="bg-card rounded-2xl border border-border p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm font-bold text-muted-foreground">Questions ({questions.length})</h2>
                                <button onClick={addQuestion} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors">
                                    <Plus size={16} /> Add Question
                                </button>
                            </div>

                            {questions.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Plus size={28} className="text-muted-foreground" />
                                    </div>
                                    <h3 className="font-bold text-foreground mb-2">No questions yet</h3>
                                    <p className="text-sm text-muted-foreground mb-6">Add your first question to get started</p>
                                    <button onClick={addQuestion} className="px-6 py-3 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-colors">Add Question</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {questions.map((q, index) => (
                                        <div key={q.id} className={`rounded-xl border p-5 transition-colors ${activeQuestionIndex === index ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                                            <div className="flex items-start justify-between mb-4">
                                                <button onClick={() => setActiveQuestionIndex(activeQuestionIndex === index ? null : index)} className="flex items-center gap-3">
                                                    <span className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center font-bold text-sm">{index + 1}</span>
                                                    <span className="font-bold text-foreground">{q.prompt || 'Untitled Question'}</span>
                                                </button>
                                                <button onClick={() => removeQuestion(index)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {activeQuestionIndex === index && (
                                                <div className="space-y-4 pt-4 border-t border-border">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Question Type</label>
                                                            <select value={q.question_type} onChange={(e) => updateQuestion(index, { question_type: e.target.value })} className="w-full px-3 py-2.5 bg-muted rounded-lg border-none text-sm focus:outline-none">
                                                                {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Points</label>
                                                            <input type="number" value={q.points} onChange={(e) => updateQuestion(index, { points: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2.5 bg-muted rounded-lg border-none text-sm focus:outline-none" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Question</label>
                                                        <input type="text" value={q.prompt} onChange={(e) => updateQuestion(index, { prompt: e.target.value })} placeholder="Enter your question..." className="w-full px-3 py-2.5 bg-muted rounded-lg border-none text-sm focus:outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Options</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {q.options.map((opt, optIdx) => (
                                                                <div key={optIdx} className="relative">
                                                                    <input type="text" value={opt} onChange={(e) => updateOption(index, optIdx, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + optIdx)}`} className={`w-full px-3 py-2.5 rounded-lg border-none text-sm focus:outline-none ${q.correct_answer === opt && opt ? 'bg-primary/10 ring-2 ring-primary/30' : 'bg-muted'}`} />
                                                                    {opt && (
                                                                        <button onClick={() => updateQuestion(index, { correct_answer: opt })} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded ${q.correct_answer === opt ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                                                                            <Check size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-2">Click ✓ to mark the correct answer</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
