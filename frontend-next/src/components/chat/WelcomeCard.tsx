import { motion } from 'framer-motion';
import { Sparkles, MessageSquare, Zap, BookOpen } from 'lucide-react';

interface WelcomeCardProps {
    isGuest?: boolean;
    onSuggestionClick?: (suggestion: string) => void;
}

const SUGGESTIONS = [
    { text: "Master basic greetings", icon: MessageSquare, delay: 0 },
    { text: "Particles: は vs が", icon: Zap, delay: 0.1 },
    { text: "N5 Vocab Marathon", icon: BookOpen, delay: 0.2 },
    { text: "Verb Conjugation Pro", icon: Sparkles, delay: 0.3 },
];

export function WelcomeCard({ isGuest = false, onSuggestionClick }: WelcomeCardProps) {
    return (
        <div className="w-full max-w-2xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] blur-2xl animate-pulse" />
                    <div className="relative w-full h-full bg-white rounded-[2rem] border border-neutral-gray/10  flex items-center justify-center text-5xl">
                        🌸
                    </div>
                </div>

                <h1 className="text-5xl font-black text-neutral-ink font-display tracking-tight mb-4">
                    Neural Oracle <span className="text-primary-strong">Hanachan</span>
                </h1>
                <p className="text-xl font-bold text-neutral-ink max-w-md mx-auto leading-relaxed">
                    Synchronize with our AI-powered linguistic protocols and master Japanese with precision.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SUGGESTIONS.map((suggestion, idx) => (
                    <motion.button
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + suggestion.delay }}
                        onClick={() => onSuggestionClick?.(suggestion.text)}
                        className="p-6 text-left bg-neutral-white/50 backdrop-blur-md border border-neutral-gray/10 hover:border-primary-strong/30 rounded-[2rem] transition-all hover: hover:-translate-y-1 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors" />
                        <suggestion.icon size={20} className="text-primary-strong mb-4 group-hover:scale-110 transition-transform" />
                        <span className="block text-sm font-black text-neutral-ink leading-snug group-hover:text-primary-strong transition-colors">
                            {suggestion.text}
                        </span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
