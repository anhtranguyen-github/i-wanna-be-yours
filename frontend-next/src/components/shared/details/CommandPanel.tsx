import React from 'react';
import { LucideIcon, Lock } from 'lucide-react';

interface CommandAction {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    variant?: 'DEFAULT' | 'DANGER' | 'PRIMARY';
    disabled?: boolean;
    requireAuth?: boolean;
    authTooltip?: string;
}

interface CommandPanelProps {
    title?: string;
    actions: CommandAction[];
    className?: string;
}

export function CommandPanel({ title = "Operations", actions, className = '' }: CommandPanelProps) {
    return (
        <div className={`bg-neutral-white rounded-[2.5rem] p-8 border border-neutral-gray/20 ${className}`}>
            <h3 className="text-xs font-black text-neutral-ink/40 uppercase tracking-[0.2em] mb-6 font-display">
                {title}
            </h3>

            <div className="flex flex-col gap-3">
                {actions.map((action, i) => {
                    const isDisabled = action.disabled || action.requireAuth;
                    const baseClass = "h-14 px-6 rounded-2xl flex items-center justify-between font-bold text-xs uppercase tracking-widest transition-all active:scale-95 border border-transparent group/btn relative";

                    let variantClass = "bg-neutral-gray/5 text-neutral-ink hover:bg-neutral-gray/10";
                    if (action.variant === 'PRIMARY') variantClass = "bg-primary/10 text-primary-strong hover:bg-primary/20 hover:border-primary/30";
                    if (action.variant === 'DANGER') variantClass = "bg-red-50 text-red-600 hover:bg-red-100/80 hover:border-red-200";

                    if (isDisabled) {
                        variantClass = "opacity-60 bg-neutral-gray/5 text-neutral-ink/50 cursor-not-allowed";
                    }

                    return (
                        <div key={i} className="relative">
                            <button
                                onClick={action.requireAuth ? undefined : action.onClick}
                                disabled={isDisabled}
                                className={`${baseClass} ${variantClass}`}
                            >
                                <span className="flex items-center gap-3">
                                    <action.icon size={18} />
                                    {action.label}
                                </span>
                                {action.requireAuth && <Lock size={14} className="text-neutral-ink/30" />}
                            </button>

                            {action.requireAuth && (
                                <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                                    <div className="bg-neutral-ink text-white text-[9px] px-3 py-1.5 rounded-lg font-black uppercase tracking-tighter shadow-xl -translate-y-2">
                                        {action.authTooltip || "Login to Unlock"}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-gray/10 text-center">
                <p className="text-[10px] text-neutral-ink/30 font-medium italic">
                    Authorized Access Only
                </p>
            </div>
        </div>
    );
}
