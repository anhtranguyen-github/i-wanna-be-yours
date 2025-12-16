"use client";

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { ModalOfferBanner } from './ModalOfferBanner';
import { ModalHero } from './ModalHero';
import { SocialProofRow } from './SocialProofRow';
import { TrustBadges } from './TrustBadges';
import { CTAButton } from '../shared/CTAButton';
import { FeatureIconGrid, modalFeatures } from '../shared/FeatureIconGrid';

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
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
            onClick={handleBackdropClick}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal Container */}
            <div
                className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-700 transition-colors"
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1">
                    {/* Offer Banner */}
                    <ModalOfferBanner />

                    {/* Hero */}
                    <ModalHero />

                    {/* Social Proof */}
                    <SocialProofRow />

                    {/* Trust Badges */}
                    <TrustBadges />

                    {/* CTAs */}
                    <div className="px-6 sm:px-12 py-6 space-y-4">
                        <CTAButton
                            variant="primary"
                            href="/pricing"
                            fullWidth
                        >
                            Get Lifetime Premium Access
                        </CTAButton>

                        <div className="text-center">
                            <CTAButton
                                variant="secondary"
                                onClick={onClose}
                            >
                                Continue to Free Version →
                            </CTAButton>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-100 mx-6" />

                    {/* Feature Icons */}
                    <div className="px-6 sm:px-12 py-6">
                        <p className="text-center text-sm text-slate-500 mb-4 font-medium">
                            Everything you need to pass the JLPT
                        </p>
                        <FeatureIconGrid
                            features={modalFeatures}
                            layout="row"
                            showDescriptions={false}
                            size="sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
