"use client";

import React, { useEffect, useCallback } from 'react';
import { X, ChevronRight, Github, Twitter, Mail } from 'lucide-react';
import { CTAButton } from '../shared/CTAButton';
import { FeatureIconGrid, defaultFeatures } from '../shared/FeatureIconGrid';
import { SocialProofRow } from './SocialProofRow';
import { TrustBadges } from './TrustBadges';
import {
    DocumentChartBarIcon,
    InboxIcon,
    ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";

interface HybridLandingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HybridLandingModal({ isOpen, onClose }: HybridLandingModalProps) {
    // Handle ESC key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-end justify-center"
            onClick={handleBackdropClick}
        >
            {/* Backdrop - dark with blur, app visible at edges */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal Container - wider, anchored to bottom */}
            <div
                className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col animate-slideUp"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button - Fixed position */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-slate-700 transition-colors shadow-lg border border-slate-200"
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1">
                    {/* ===== OFFER BANNER ===== */}
                    <div className="sticky top-0 z-10 bg-gradient-to-r from-red-500 via-red-600 to-red-500 text-white py-3 px-4 text-center">
                        <p className="text-sm sm:text-base font-bold tracking-wide">
                            🔥 JLPT N1-N5 FULL ACCESS — <span className="text-yellow-300">50% OFF</span> — THIS WEEK ONLY
                        </p>
                    </div>

                    {/* ===== HERO SECTION ===== */}
                    <div className="bg-gradient-to-br from-white to-brand-softBlue/10 px-6 sm:px-12 py-10">
                        <div className="max-w-3xl mx-auto text-center">
                            {/* Version Badge */}
                            <div className="inline-flex items-center gap-3 mb-6">
                                <span className="rounded-full bg-brand-green/10 px-3 py-1 text-sm font-semibold text-brand-green border border-brand-green">
                                    New
                                </span>
                                <span className="text-sm font-bold text-brand-green flex items-center gap-1">
                                    Public Alpha v0.3.8 <ChevronRight className="h-4 w-4" />
                                </span>
                            </div>

                            {/* Headline */}
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-brand-dark leading-tight">
                                Your path to <span className="text-brand-green">Japanese</span> & <span className="text-brand-peach">Korean</span> fluency
                            </h1>

                            {/* Sub-headlines */}
                            <div className="mt-4 space-y-1">
                                <p className="text-lg sm:text-xl font-bold text-gray-400">日本語理解への道</p>
                                <p className="text-lg sm:text-xl font-bold text-gray-400">한국어 이해를 위한 길입니다</p>
                            </div>

                            {/* Description */}
                            <p className="mt-5 text-lg text-gray-600 font-medium max-w-xl mx-auto">
                                Prepare for JLPT/TOPIK with hanabira.org. Free, Open-Source, and Self-Hostable.
                            </p>

                            {/* Social Proof & Trust */}
                            <SocialProofRow />
                            <TrustBadges />

                            {/* CTAs */}
                            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                                <CTAButton variant="primary" href="/pricing">
                                    Get Lifetime Premium Access
                                </CTAButton>
                                <CTAButton variant="secondary" onClick={onClose}>
                                    Continue to Free Version →
                                </CTAButton>
                            </div>
                        </div>
                    </div>

                    {/* ===== FEATURES SECTION ===== */}
                    <div className="px-6 sm:px-12 py-10 bg-white border-t border-slate-100">
                        <div className="max-w-3xl mx-auto">
                            <h3 className="font-bold text-brand-dark text-xl mb-6 text-center flex items-center justify-center gap-2">
                                <span className="bg-brand-green w-8 h-8 rounded-full flex items-center justify-center text-white">✨</span>
                                Key Features
                            </h3>
                            <FeatureIconGrid features={defaultFeatures} maxItems={6} />
                        </div>
                    </div>

                    {/* ===== DEEP DIVE TOOLS ===== */}
                    <div className="px-6 sm:px-12 py-10 bg-slate-50 border-t border-slate-100">
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-2xl font-display font-bold text-brand-dark mb-2 text-center">
                                Deep Dive into Learning
                            </h2>
                            <p className="text-gray-600 text-center mb-8">
                                Explore our advanced tools for effective immersion.
                            </p>

                            {/* Tool Cards */}
                            <div className="space-y-4">
                                {/* Text Parser */}
                                <div className="bg-white p-5 rounded-xl border border-slate-100 flex items-center gap-4 hover:border-brand-green/30 transition-colors">
                                    <div className="flex-shrink-0 p-3 rounded-xl bg-brand-green">
                                        <DocumentChartBarIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-brand-dark">Master Japanese Texts</h3>
                                        <p className="text-sm text-gray-500 truncate">Instant tokenization & dictionary lookups</p>
                                    </div>
                                    <CTAButton variant="primary" href="/tools/text-parser" className="!py-2 !px-4 !text-sm flex-shrink-0">
                                        Try
                                    </CTAButton>
                                </div>

                                {/* YouTube */}
                                <div className="bg-white p-5 rounded-xl border border-slate-100 flex items-center gap-4 hover:border-brand-peach/30 transition-colors">
                                    <div className="flex-shrink-0 p-3 rounded-xl bg-brand-peach">
                                        <InboxIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-brand-dark">YouTube Immersion</h3>
                                        <p className="text-sm text-gray-500 truncate">Parse subtitles & save words</p>
                                    </div>
                                    <CTAButton variant="primary" href="/tools/text-parser/youtube" className="!py-2 !px-4 !text-sm flex-shrink-0">
                                        Try
                                    </CTAButton>
                                </div>

                                {/* Grammar */}
                                <div className="bg-white p-5 rounded-xl border border-slate-100 flex items-center gap-4 hover:border-brand-blue/30 transition-colors">
                                    <div className="flex-shrink-0 p-3 rounded-xl bg-brand-blue">
                                        <ArrowUturnLeftIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-brand-dark">Visual Grammar Graphs</h3>
                                        <p className="text-sm text-gray-500 truncate">AI-powered sentence visualization</p>
                                    </div>
                                    <CTAButton variant="primary" href="/tools/grammar-graph" className="!py-2 !px-4 !text-sm flex-shrink-0">
                                        Try
                                    </CTAButton>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ===== DOCKER SELF-HOST ===== */}
                    <div className="px-6 sm:px-12 py-8 bg-brand-dark text-white">
                        <div className="max-w-3xl mx-auto text-center">
                            <p className="font-bold text-lg mb-3">🐳 Self-Host with Docker</p>
                            <pre className="bg-black/30 p-3 rounded-lg overflow-x-auto inline-block text-left text-sm">
                                <code className="font-mono text-brand-green">
                                    docker-compose up
                                </code>
                            </pre>
                        </div>
                    </div>

                    {/* ===== FINAL CTA ===== */}
                    <div className="px-6 sm:px-12 py-8 bg-gradient-to-r from-brand-green to-brand-green/90">
                        <div className="max-w-2xl mx-auto text-center text-white">
                            <h3 className="text-xl sm:text-2xl font-bold mb-3">Ready to Start Learning?</h3>
                            <p className="opacity-90 mb-5">Join thousands mastering Japanese with Hanabira.</p>
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-white text-brand-green font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-lg"
                            >
                                Start Learning Free →
                            </button>
                        </div>
                    </div>

                    {/* ===== FOOTER ===== */}
                    <footer className="px-6 sm:px-12 py-6 bg-slate-900 text-white">
                        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🌸</span>
                                <span className="font-display font-bold">Hanabira.org</span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-400">
                                <a href="https://github.com/tristcoil/hanabira.org" className="hover:text-white transition-colors">
                                    <Github size={20} />
                                </a>
                                <a href="#" className="hover:text-white transition-colors">
                                    <Twitter size={20} />
                                </a>
                                <a href="#" className="hover:text-white transition-colors">
                                    <Mail size={20} />
                                </a>
                            </div>
                            <p className="text-sm text-slate-500">
                                © 2024 Hanabira. Free & Open Source.
                            </p>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}
