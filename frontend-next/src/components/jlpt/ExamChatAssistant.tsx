"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { CreateExamFormState } from './CreateExamModal';
import { Question, JLPTLevel, SkillType } from '@/types/practice';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ExamChatAssistantProps {
    formState: CreateExamFormState;
    onFormUpdate: (updates: Partial<CreateExamFormState>) => void;
    onQuestionsGenerated: (questions: Question[]) => void;
}

const QUICK_PROMPTS = [
    "Generate {count} {level} {skill} questions",
    "Create a mixed practice quiz",
    "Make harder questions for N2",
    "Add reading comprehension passages",
];

export function ExamChatAssistant({
    formState,
    onFormUpdate,
    onQuestionsGenerated
}: ExamChatAssistantProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: `Hi! I'm your exam creation assistant. I can help you:\n\n• Generate questions based on your configuration\n• Suggest exam settings\n• Create custom question content\n\nTry one of the quick prompts below, or tell me what kind of exam you'd like to create!`,
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const generateMockQuestions = (count: number, level: JLPTLevel, skills: SkillType[]): Question[] => {
        const questions: Question[] = [];

        for (let i = 0; i < count; i++) {
            const skill = skills[i % skills.length];
            const questionId = `gen-${Date.now()}-${i}`;

            questions.push({
                id: questionId,
                type: skill === 'LISTENING' ? 'LISTENING' : skill === 'READING' ? 'READING_PASSAGE' : 'MULTIPLE_CHOICE',
                content: getQuestionContent(skill, level, i),
                options: [
                    { id: `${questionId}-a`, text: 'Option A' },
                    { id: `${questionId}-b`, text: 'Option B' },
                    { id: `${questionId}-c`, text: 'Option C' },
                    { id: `${questionId}-d`, text: 'Option D' },
                ],
                correctOptionId: `${questionId}-a`,
                explanation: `This tests your understanding of ${skill.toLowerCase()} at the ${level} level.`,
                tags: {
                    level,
                    skills: [skill],
                    origin: 'ai',
                },
            });
        }

        return questions;
    };

    const getQuestionContent = (skill: SkillType, level: JLPTLevel, index: number): string => {
        const templates: Record<SkillType, string[]> = {
            VOCABULARY: [
                '「___」の読み方として正しいものはどれですか。',
                '「___」と同じ意味の言葉はどれですか。',
                '___に入る最も適切な言葉を選んでください。',
            ],
            GRAMMAR: [
                '___に入る正しい助詞はどれですか。',
                '次の文を正しく完成させてください。',
                'この文法形式の正しい使い方はどれですか。',
            ],
            READING: [
                '次の文章を読んで、質問に答えてください。',
                '筆者の意見に最も近いものはどれですか。',
                '下線部の意味として正しいものはどれですか。',
            ],
            LISTENING: [
                '会話を聞いて、質問に答えてください。',
                '話者が言いたいことは何ですか。',
                '次に何が起こると思いますか。',
            ],
        };

        const skillTemplates = templates[skill];
        return skillTemplates[index % skillTemplates.length];
    };

    const processUserMessage = async (userMessage: string): Promise<string> => {
        const lowerMessage = userMessage.toLowerCase();

        // Check for question generation requests
        if (lowerMessage.includes('generate') || lowerMessage.includes('create') || lowerMessage.includes('make')) {
            const count = formState.questionCount;
            const questions = generateMockQuestions(count, formState.level, formState.skills);
            onQuestionsGenerated(questions);

            return `I've generated ${count} questions for your ${formState.level} ${formState.skills.join(', ')} exam!\n\nThe questions are ready and will be included when you save the exam. You can adjust the count in the configuration panel if needed.\n\nWould you like me to:\n• Generate more questions with different settings?\n• Adjust the difficulty level?\n• Focus on specific topics?`;
        }

        // Check for level suggestions
        if (lowerMessage.includes('level') || lowerMessage.includes('n1') || lowerMessage.includes('n2') || lowerMessage.includes('n3') || lowerMessage.includes('n4') || lowerMessage.includes('n5')) {
            const levelMatch = lowerMessage.match(/n[1-5]/);
            if (levelMatch) {
                const newLevel = levelMatch[0].toUpperCase() as JLPTLevel;
                onFormUpdate({ level: newLevel });
                return `I've updated the exam level to ${newLevel}. The questions will be adjusted to match this difficulty level.\n\nWould you like me to generate questions for this level?`;
            }
        }

        // Check for skill changes
        const skillKeywords: Record<string, SkillType> = {
            'vocabulary': 'VOCABULARY',
            'vocab': 'VOCABULARY',
            'grammar': 'GRAMMAR',
            'reading': 'READING',
            'listening': 'LISTENING',
        };

        for (const [keyword, skill] of Object.entries(skillKeywords)) {
            if (lowerMessage.includes(keyword)) {
                if (!formState.skills.includes(skill)) {
                    onFormUpdate({ skills: [...formState.skills, skill] });
                    return `I've added ${skill.toLowerCase()} to your exam skills. Current skills: ${[...formState.skills, skill].join(', ')}.\n\nReady to generate questions?`;
                }
            }
        }

        // Default helpful response
        return `I can help you create your JLPT exam! Here's what I can do:\n\n• **Generate questions** - Say "generate questions" and I'll create them based on your current settings (${formState.level}, ${formState.skills.join(', ')})\n• **Change level** - Say "make it N2" or "change to N1"\n• **Add skills** - Say "add grammar" or "include listening"\n• **Adjust count** - Use the slider in the configuration panel\n\nWhat would you like to do?`;
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Simulate AI processing delay
            await new Promise(resolve => setTimeout(resolve, 800));

            const response = await processUserMessage(userMessage.content);

            const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickPrompt = (prompt: string) => {
        const filledPrompt = prompt
            .replace('{count}', String(formState.questionCount))
            .replace('{level}', formState.level)
            .replace('{skill}', formState.skills[0]?.toLowerCase() || 'vocabulary');
        setInput(filledPrompt);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.role === 'assistant'
                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
                            : 'bg-slate-200 text-slate-600'
                            }`}>
                            {message.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                        </div>
                        <div className={`max-w-[80%] p-4 rounded-2xl ${message.role === 'assistant'
                            ? 'bg-white border border-slate-200 text-slate-700'
                            : 'bg-brand-green text-white'
                            }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-4">
                            <Loader2 size={16} className="animate-spin text-neutral-ink" />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-4 py-2 border-t border-slate-200 bg-white">
                <div className="flex items-center gap-2 mb-2">
                    <Wand2 size={14} className="text-neutral-ink" />
                    <span className="text-xs text-neutral-ink">Quick prompts:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((prompt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleQuickPrompt(prompt)}
                            className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                        >
                            {prompt.replace('{count}', String(formState.questionCount))
                                .replace('{level}', formState.level)
                                .replace('{skill}', formState.skills[0]?.toLowerCase() || 'vocabulary')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me to generate questions, adjust settings..."
                        className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="px-4 py-3 bg-brand-green text-white rounded-xl hover:bg-brand-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
