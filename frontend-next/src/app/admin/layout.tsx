import React from 'react';

export const metadata = {
    title: 'Admin Dashboard | hanachan',
    description: 'Administrative dashboard for hanachan.org',
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-neutral-ink dark:text-neutral-ink">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </div>
        </div>
    );
}
