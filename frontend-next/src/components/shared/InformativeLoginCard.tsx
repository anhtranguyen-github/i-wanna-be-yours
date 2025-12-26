import React from 'react';
import { LogIn, Sparkles, LucideIcon } from 'lucide-react';
import { useGlobalAuth } from '@/context/GlobalAuthContext';
import { motion } from 'framer-motion';

interface InformativeLoginCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    previewImage?: string;
    benefits: string[];
    flowType?: 'PRACTICE' | 'CHAT' | 'FLASHCARDS' | 'DICTIONARY' | 'QUOOT';
}

export function InformativeLoginCard({
    title,
    description,
    icon: Icon,
    previewImage,
    benefits,
    flowType = 'PRACTICE'
}: InformativeLoginCardProps) {
    const { openAuth } = useGlobalAuth();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto overflow-hidden rounded-[2rem] bg-neutral-white border border-neutral-gray/20"
        >
            <div className="flex flex-col md:flex-row">
                {/* Visual Preview Area */}
                <div className="md:w-5/12 bg-neutral-beige/50 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-secondary/5" />

                    {previewImage ? (
                        <div className="relative z-10 w-full h-full min-h-[200px] rounded-2xl overflow-hidden  border border-neutral-gray/10">
                            <img src={previewImage} alt="Feature Preview" className="w-full h-full object-cover blur-[2px] opacity-60" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Icon className="w-16 h-16 text-primary-strong/40" />
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10 w-32 h-32 rounded-3xl bg-neutral-white  flex items-center justify-center">
                            <Icon className="w-16 h-16 text-primary-strong" />
                            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white">
                                <Sparkles size={16} />
                            </div>
                        </div>
                    )}

                    <div className="mt-8 text-center relative z-10">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-ink">
                            Personal Nexus Preview
                        </div>
                    </div>
                </div>

                {/* Info Area */}
                <div className="md:w-7/12 p-10 flex flex-col">
                    <h3 className="text-3xl font-black text-neutral-ink font-display tracking-tight mb-4">
                        {title}
                    </h3>
                    <p className="text-neutral-ink font-bold mb-8 leading-relaxed">
                        {description}
                    </p>

                    <div className="space-y-4 mb-10">
                        {benefits.map((benefit, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Sparkles size={12} className="text-primary-strong" />
                                </div>
                                <span className="text-sm font-black text-neutral-ink">{benefit}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto space-y-4">
                        <button
                            onClick={() => openAuth('LOGIN', { flowType, title, description })}
                            className="w-full py-4 bg-neutral-ink text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-primary-strong transition-all   active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            <LogIn size={18} />
                            Initialize Account
                        </button>
                        <p className="text-center text-[9px] font-black text-neutral-ink uppercase tracking-widest">
                            Guests can continue browsing without restrictions
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
