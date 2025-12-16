"use client";

import React from 'react';

export function ModalHero() {
    return (
        <div className="text-center py-8 px-4">
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-brand-dark leading-tight">
                Master the <span className="text-brand-green">JLPT</span> with the{' '}
                <br className="hidden sm:block" />
                Ultimate Study Platform
            </h1>

            {/* Sub-headline */}
            <p className="mt-4 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
                Comprehensive practice tests, vocabulary flashcards, and grammar explanations for all levels.
            </p>
        </div>
    );
}
