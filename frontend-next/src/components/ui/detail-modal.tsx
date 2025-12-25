'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

export interface DetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

export function DetailModal({
    isOpen,
    onClose,
    title,
    subtitle,
    size = 'md',
    children,
    footer,
    className,
}: DetailModalProps) {
    const [mounted, setMounted] = React.useState(false);
    const [animating, setAnimating] = React.useState(false);
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        if (isOpen) {
            setAnimating(true);
            setVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            setVisible(false);
            const timer = setTimeout(() => {
                setAnimating(false);
                document.body.style.overflow = '';
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Handle escape key
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[95vw] md:max-w-[90vw]',
    };

    if (!mounted || !animating) return null;

    const modalContent = (
        <div
            className={cn(
                'fixed inset-0 z-[100] flex items-center justify-center p-4',
                'transition-opacity duration-300',
                visible ? 'opacity-100' : 'opacity-0'
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* Backdrop */}
            <div
                className={cn(
                    'absolute inset-0 bg-black/50 backdrop-blur-sm',
                    'transition-opacity duration-300',
                    visible ? 'opacity-100' : 'opacity-0'
                )}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                className={cn(
                    'relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden',
                    'transform transition-all duration-300 ease-out',
                    visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4',
                    sizeClasses[size],
                    'max-h-[90vh] flex flex-col',
                    className
                )}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 id="modal-title" className="text-xl font-black text-neutral-ink">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-sm text-neutral-ink mt-1">{subtitle}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className={cn(
                            'p-2 rounded-xl text-neutral-ink',
                            'hover:text-slate-600 hover:bg-slate-100',
                            'transition-colors duration-200',
                            'focus:outline-none focus:ring-2 focus:ring-brand-salmon/20'
                        )}
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="border-t border-slate-100 p-4 bg-slate-50">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

export default DetailModal;
