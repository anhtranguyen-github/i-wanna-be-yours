import React from 'react';

interface DetailLayoutProps {
    children: React.ReactNode;
    className?: string;
}

export function DetailLayout({ children, className = '' }: DetailLayoutProps) {
    return (
        <div className={`min-h-screen bg-neutral-beige/30 text-neutral-ink pb-20 ${className}`}>
            <div className="max-w-[1920px] mx-auto">
                {children}
            </div>
        </div>
    );
}

export function DetailGrid({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 px-6 lg:px-12 py-8 ${className}`}>
            {children}
        </div>
    );
}

export function DetailMain({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <main className={`lg:col-span-8 flex flex-col gap-8 ${className}`}>
            {children}
        </main>
    );
}

export function DetailSidebar({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <aside className={`lg:col-span-4 flex flex-col gap-6 ${className}`}>
            <div className="sticky top-24 flex flex-col gap-6">
                {children}
            </div>
        </aside>
    );
}
