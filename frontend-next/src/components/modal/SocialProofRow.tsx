"use client";

import React from 'react';

export function SocialProofRow() {
    // Avatar placeholder colors
    const avatarColors = [
        'bg-brand-green',
        'bg-brand-blue',
        'bg-brand-peach',
        'bg-brand-indigo',
        'bg-brand-orange'
    ];

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-4">
            {/* Stacked Avatars */}
            <div className="flex -space-x-3">
                {avatarColors.map((color, idx) => (
                    <div
                        key={idx}
                        className={`w-10 h-10 rounded-full ${color} border-2 border-white flex items-center justify-center text-white text-sm font-bold`}
                    >
                        {['田', '山', '川', '木', '花'][idx]}
                    </div>
                ))}
            </div>

            {/* Text */}
            <p className="text-slate-600 font-medium">
                Join <span className="font-bold text-brand-dark">10,000+</span> students acing their JLPT exams daily
            </p>
        </div>
    );
}
