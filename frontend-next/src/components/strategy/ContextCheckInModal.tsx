'use client';

import * as React from 'react';
import { X, Moon, Zap, Brain, Smile, Frown, Meh, Target, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DetailModal } from '@/components/ui/detail-modal';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { HELP_CONTENT } from '@/data/helpContent';
import { ContextSnapshot } from '@/mocks/strategyMockData';

export interface ContextCheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (context: ContextSnapshot) => void;
    initialContext?: ContextSnapshot;
}

export function ContextCheckInModal({
    isOpen,
    onClose,
    onSubmit,
    initialContext,
}: ContextCheckInModalProps) {
    const [sleepQuality, setSleepQuality] = React.useState<ContextSnapshot['sleep_quality']>(
        initialContext?.sleep_quality || 'good'
    );
    const [energyLevel, setEnergyLevel] = React.useState(initialContext?.energy_level || 7);
    const [mood, setMood] = React.useState<ContextSnapshot['mood']>(
        initialContext?.mood || 'focused'
    );
    const [stressLevel, setStressLevel] = React.useState<ContextSnapshot['stress_level']>(
        initialContext?.stress_level || 'low'
    );

    const handleSubmit = () => {
        onSubmit({
            timestamp: new Date().toISOString(),
            sleep_quality: sleepQuality,
            energy_level: energyLevel,
            mood,
            stress_level: stressLevel,
        });
        onClose();
    };

    const sleepOptions: { value: ContextSnapshot['sleep_quality']; label: string; emoji: string }[] = [
        { value: 'poor', label: 'Poor', emoji: '😴' },
        { value: 'fair', label: 'Fair', emoji: '😐' },
        { value: 'good', label: 'Good', emoji: '😊' },
        { value: 'excellent', label: 'Excellent', emoji: '🌟' },
    ];

    const moodOptions: { value: ContextSnapshot['mood']; label: string; emoji: string; color: string }[] = [
        { value: 'unmotivated', label: 'Unmotivated', emoji: '😔', color: 'border-red-300 bg-red-50' },
        { value: 'neutral', label: 'Neutral', emoji: '😐', color: 'border-slate-300 bg-slate-50' },
        { value: 'focused', label: 'Focused', emoji: '🎯', color: 'border-blue-300 bg-blue-50' },
        { value: 'energized', label: 'Energized', emoji: '⚡', color: 'border-amber-300 bg-amber-50' },
    ];

    const stressOptions: { value: ContextSnapshot['stress_level']; label: string; color: string }[] = [
        { value: 'low', label: 'Low', color: 'bg-emerald-500' },
        { value: 'medium', label: 'Medium', color: 'bg-amber-500' },
        { value: 'high', label: 'High', color: 'bg-red-500' },
    ];

    // Recommendation based on context
    const getRecommendation = (): string => {
        if (sleepQuality === 'poor' || energyLevel <= 3) {
            return '💤 Low energy detected. Consider a light 10-minute review session instead of learning new content.';
        }
        if (stressLevel === 'high') {
            return '🧘 High stress noted. Try a relaxed vocabulary review to maintain progress without pressure.';
        }
        if (mood === 'unmotivated') {
            return '🎮 Feeling unmotivated? Start with a quick quiz game to build momentum.';
        }
        if (energyLevel >= 8 && mood === 'energized') {
            return '🚀 Great energy! Perfect time to tackle challenging grammar or learn new vocabulary.';
        }
        return '✨ Balanced state. Proceed with your regular study plan!';
    };

    return (
        <DetailModal
            isOpen={isOpen}
            onClose={onClose}
            title="Daily Check-in"
            subtitle="How are you feeling today?"
            size="md"
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        Skip
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-brand-salmon text-white font-semibold rounded-xl hover:bg-brand-salmon/90 transition-colors"
                    >
                        Start Studying
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Sleep Quality */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Moon size={18} className="text-indigo-500" />
                        <label className="text-sm font-semibold text-slate-900">Sleep Quality</label>
                        <InfoTooltip
                            title={HELP_CONTENT.context_sleep.title}
                            content={HELP_CONTENT.context_sleep.content}
                            iconSize={12}
                        />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {sleepOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setSleepQuality(option.value)}
                                className={cn(
                                    'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200',
                                    sleepQuality === option.value
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-slate-100 hover:border-slate-200'
                                )}
                            >
                                <span className="text-2xl">{option.emoji}</span>
                                <span className="text-xs font-medium text-slate-700">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Energy Level */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Zap size={18} className="text-amber-500" />
                        <label className="text-sm font-semibold text-slate-900">Energy Level</label>
                        <InfoTooltip
                            title={HELP_CONTENT.context_energy.title}
                            content={HELP_CONTENT.context_energy.content}
                            iconSize={12}
                        />
                        <span className="ml-auto text-lg font-bold text-slate-900">{energyLevel}/10</span>
                    </div>
                    <div className="relative">
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={energyLevel}
                            onChange={(e) => setEnergyLevel(Number(e.target.value))}
                            className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-6
                [&::-webkit-slider-thumb]:h-6
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-amber-500
                [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-white"
                        />
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-slate-400">😴 Low</span>
                            <span className="text-[10px] text-slate-400">⚡ High</span>
                        </div>
                    </div>
                </div>

                {/* Mood */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Brain size={18} className="text-blue-500" />
                        <label className="text-sm font-semibold text-slate-900">Current Mood</label>
                        <InfoTooltip
                            title={HELP_CONTENT.context_mood.title}
                            content={HELP_CONTENT.context_mood.content}
                            iconSize={12}
                        />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {moodOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setMood(option.value)}
                                className={cn(
                                    'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200',
                                    mood === option.value
                                        ? `border-blue-500 ${option.color}`
                                        : 'border-slate-100 hover:border-slate-200'
                                )}
                            >
                                <span className="text-2xl">{option.emoji}</span>
                                <span className="text-xs font-medium text-slate-700">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stress Level */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Coffee size={18} className="text-rose-500" />
                        <label className="text-sm font-semibold text-slate-900">Stress Level</label>
                        <InfoTooltip
                            title={HELP_CONTENT.context_stress.title}
                            content={HELP_CONTENT.context_stress.content}
                            iconSize={12}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {stressOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setStressLevel(option.value)}
                                className={cn(
                                    'flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
                                    stressLevel === option.value
                                        ? 'border-rose-500 bg-rose-50'
                                        : 'border-slate-100 hover:border-slate-200'
                                )}
                            >
                                <div className={cn('w-3 h-3 rounded-full', option.color)} />
                                <span className="text-sm font-medium text-slate-700">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* AI Recommendation */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Target size={16} className="text-blue-600" />
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                            Hanachan&apos;s Suggestion
                        </span>
                    </div>
                    <p className="text-sm text-blue-800">{getRecommendation()}</p>
                </div>
            </div>
        </DetailModal>
    );
}

export default ContextCheckInModal;
