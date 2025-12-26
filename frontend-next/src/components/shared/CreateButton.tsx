import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface CreateButtonProps {
    href?: string;
    label: string;
    className?: string;
    onClick?: () => void;
}

export function CreateButton({ href, label, className = "", onClick }: CreateButtonProps) {
    const commonClasses = `flex items-center gap-2 px-6 py-3 bg-neutral-ink text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-strong transition-all active:scale-95 ${className}`;

    if (onClick) {
        return (
            <button
                onClick={onClick}
                className={commonClasses}
            >
                <Plus size={16} />
                {label}
            </button>
        );
    }

    return (
        <Link
            href={href || "#"}
            className={commonClasses}
        >
            <Plus size={16} />
            {label}
        </Link>
    );
}
