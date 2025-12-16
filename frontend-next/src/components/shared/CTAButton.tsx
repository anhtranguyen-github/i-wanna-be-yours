"use client";

import React from 'react';
import Link from 'next/link';

export interface CTAButtonProps {
    variant?: 'primary' | 'secondary';
    href?: string;
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
    fullWidth?: boolean;
}

export function CTAButton({ 
    variant = 'primary', 
    href, 
    onClick, 
    children, 
    className = '',
    fullWidth = false
}: CTAButtonProps) {
    const baseStyles = `
        inline-flex items-center justify-center font-bold rounded-xl
        transition-all duration-200 active:translate-y-[1px]
        ${fullWidth ? 'w-full' : ''}
    `;

    const variantStyles = {
        primary: `
            px-8 py-4 bg-brand-green text-white text-lg
            hover:bg-brand-green/90 hover:scale-[1.02]
            shadow-lg shadow-brand-green/25
        `,
        secondary: `
            px-6 py-3 bg-transparent text-slate-600
            hover:text-brand-green hover:underline
        `
    };

    const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${className}`;

    if (href) {
        return (
            <Link href={href} className={combinedStyles}>
                {children}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={combinedStyles}>
            {children}
        </button>
    );
}
