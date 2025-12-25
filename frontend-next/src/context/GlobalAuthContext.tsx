'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AUTH_SESSION_EXPIRED_EVENT } from '@/lib/authFetch';

// Define the shape of the features/offer context we might pass when opening auth
export type AuthFlowType = 'CHAT' | 'PRACTICE' | 'STUDY_PLAN' | 'LIBRARY' | 'DICTIONARY' | 'FLASHCARDS' | 'GENERAL';

export interface AuthFeatureContext {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    flowType?: AuthFlowType;
}

interface GlobalAuthContextType {
    isOpen: boolean;
    initialMode: 'LOGIN' | 'REGISTER';
    featureContext: AuthFeatureContext | null;
    openAuth: (mode?: 'LOGIN' | 'REGISTER', context?: AuthFeatureContext) => void;
    closeAuth: () => void;
}

const GlobalAuthContext = createContext<GlobalAuthContextType | undefined>(undefined);

export function GlobalAuthProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [initialMode, setInitialMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [featureContext, setFeatureContext] = useState<AuthFeatureContext | null>(null);

    const openAuth = (mode: 'LOGIN' | 'REGISTER' = 'LOGIN', context?: AuthFeatureContext) => {
        setInitialMode(mode);
        if (context) {
            setFeatureContext(context);
        } else {
            // Reset to default generic welcome if no context provided
            setFeatureContext(null);
        }
        setIsOpen(true);
    };

    const closeAuth = () => {
        setIsOpen(false);
        // We delay clearing context slightly to avoid content jumping during close animation
        setTimeout(() => {
            setFeatureContext(null);
        }, 300);
    };

    // Listen for session expiry events and auto-open login modal
    useEffect(() => {
        const handleSessionExpired = (event: CustomEvent<{ reason: string }>) => {
            console.log('[GlobalAuth] Session expired, opening login modal');
            openAuth('LOGIN', {
                title: 'Session Expired',
                description: event.detail?.reason || 'Please log in again to continue.',
            });
        };

        window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired as EventListener);
        return () => {
            window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired as EventListener);
        };
    }, []);

    return (
        <GlobalAuthContext.Provider value={{ isOpen, initialMode, featureContext, openAuth, closeAuth }}>
            {children}
        </GlobalAuthContext.Provider>
    );
}

export const useGlobalAuth = () => {
    const context = useContext(GlobalAuthContext);
    if (context === undefined) {
        throw new Error('useGlobalAuth must be used within a GlobalAuthProvider');
    }
    return context;
};
