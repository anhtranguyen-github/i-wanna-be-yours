"use client";

import React from 'react';
import { Star } from 'lucide-react';

interface TrustBadge {
    name: string;
    rating: number;
}

const badges: TrustBadge[] = [
    { name: 'App Store', rating: 4.9 },
    { name: 'Play Store', rating: 4.8 },
    { name: 'JLPT Community', rating: 5.0 }
];

export function TrustBadges() {
    return (
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 py-4">
            {badges.map((badge, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                    {/* Stars */}
                    <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                size={14}
                                className={i < Math.floor(badge.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}
                            />
                        ))}
                    </div>
                    {/* Label */}
                    <span className="text-xs text-slate-500 font-medium">{badge.name}</span>
                    <span className="text-xs text-brand-dark font-bold">{badge.rating}</span>
                </div>
            ))}
        </div>
    );
}
