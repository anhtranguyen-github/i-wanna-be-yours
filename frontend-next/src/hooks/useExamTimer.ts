"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseExamTimerOptions {
    examId: string;
    initialSeconds: number;
    timerMode: 'UNLIMITED' | 'JLPT_STANDARD' | 'CUSTOM';
    onTimeUp?: () => void;
    autoStart?: boolean;
}

interface UseExamTimerReturn {
    timeRemaining: number;
    isRunning: boolean;
    isTimeLow: boolean;
    isTimeUp: boolean;
    formattedTime: string;
    timerStyles: string;
    start: () => void;
    pause: () => void;
    reset: () => void;
    addTime: (seconds: number) => void;
}

const STORAGE_PREFIX = 'hanabira_exam_timer_';

/**
 * Custom hook for managing exam countdown timer with persistence
 */
export function useExamTimer({
    examId,
    initialSeconds,
    timerMode,
    onTimeUp,
    autoStart = false,
}: UseExamTimerOptions): UseExamTimerReturn {
    const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(false);
    const [isTimeUp, setIsTimeUp] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const onTimeUpRef = useRef(onTimeUp);

    const storageKey = `${STORAGE_PREFIX}${examId}`;

    // Keep onTimeUp ref updated
    useEffect(() => {
        onTimeUpRef.current = onTimeUp;
    }, [onTimeUp]);

    // Initialize timer - restore from storage or use initial value
    useEffect(() => {
        if (initialized || timerMode === 'UNLIMITED') {
            setInitialized(true);
            return;
        }

        try {
            const saved = sessionStorage.getItem(storageKey);
            if (saved) {
                const { remaining, savedAt, wasRunning } = JSON.parse(saved);
                const elapsed = wasRunning ? Math.floor((Date.now() - savedAt) / 1000) : 0;
                const restored = Math.max(0, remaining - elapsed);

                if (restored > 0) {
                    setTimeRemaining(restored);
                    if (autoStart && wasRunning) {
                        setIsRunning(true);
                    }
                    setInitialized(true);
                    return;
                } else {
                    // Timer expired while away
                    setTimeRemaining(0);
                    setIsTimeUp(true);
                    setInitialized(true);
                    return;
                }
            }
        } catch (e) {
            console.warn('Could not restore timer:', e);
        }

        // No saved state, use initial
        setTimeRemaining(initialSeconds);
        if (autoStart && initialSeconds > 0) {
            setIsRunning(true);
        }
        setInitialized(true);
    }, [examId, initialSeconds, timerMode, autoStart, storageKey, initialized]);

    // Persist timer state
    useEffect(() => {
        if (!initialized || timerMode === 'UNLIMITED') return;

        try {
            sessionStorage.setItem(storageKey, JSON.stringify({
                remaining: timeRemaining,
                savedAt: Date.now(),
                wasRunning: isRunning,
            }));
        } catch (e) {
            // Storage unavailable
        }
    }, [timeRemaining, isRunning, storageKey, timerMode, initialized]);

    // Format time display
    const formatTime = useCallback((seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }, []);

    // Timer countdown effect
    useEffect(() => {
        if (timerMode === 'UNLIMITED') return;

        if (!isRunning || timeRemaining <= 0) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    setIsRunning(false);
                    setIsTimeUp(true);
                    onTimeUpRef.current?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, timeRemaining, timerMode]);

    // Control functions
    const start = useCallback(() => {
        if (timerMode !== 'UNLIMITED' && timeRemaining > 0) {
            setIsRunning(true);
        }
    }, [timerMode, timeRemaining]);

    const pause = useCallback(() => {
        setIsRunning(false);
    }, []);

    const reset = useCallback(() => {
        setIsRunning(false);
        setIsTimeUp(false);
        setTimeRemaining(initialSeconds);
        try {
            sessionStorage.removeItem(storageKey);
        } catch (e) {
            // Ignore
        }
    }, [initialSeconds, storageKey]);

    const addTime = useCallback((seconds: number) => {
        setTimeRemaining((prev) => Math.max(0, prev + seconds));
    }, []);

    // Time warnings
    const isTimeLow = timeRemaining > 0 && timeRemaining <= 300; // 5 minutes

    // Get visual styles based on remaining time
    const getTimerStyles = (): string => {
        if (timerMode === 'UNLIMITED') return 'hidden';

        if (timeRemaining > 600) {
            return 'bg-slate-100 text-slate-700';
        }
        if (timeRemaining > 300) {
            return 'bg-amber-100 text-amber-700';
        }
        if (timeRemaining > 60) {
            return 'bg-orange-100 text-orange-700 animate-pulse';
        }
        return 'bg-red-100 text-red-600 animate-pulse';
    };

    return {
        timeRemaining,
        isRunning,
        isTimeLow,
        isTimeUp,
        formattedTime: formatTime(timeRemaining),
        timerStyles: getTimerStyles(),
        start,
        pause,
        reset,
        addTime,
    };
}

// Export helper functions for external use
export function formatTimeDisplay(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
