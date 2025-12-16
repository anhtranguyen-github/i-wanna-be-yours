"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseExamTimerOptions {
    initialSeconds: number;
    onTimeUp?: () => void;
    autoStart?: boolean;
}

interface UseExamTimerReturn {
    timeRemaining: number;
    isRunning: boolean;
    isTimeLow: boolean;
    formattedTime: string;
    start: () => void;
    pause: () => void;
    reset: () => void;
    addTime: (seconds: number) => void;
}

/**
 * Custom hook for managing exam countdown timer
 */
export function useExamTimer({
    initialSeconds,
    onTimeUp,
    autoStart = false,
}: UseExamTimerOptions): UseExamTimerReturn {
    const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(autoStart);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const onTimeUpRef = useRef(onTimeUp);

    // Keep onTimeUp ref updated
    useEffect(() => {
        onTimeUpRef.current = onTimeUp;
    }, [onTimeUp]);

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
    }, [isRunning, timeRemaining]);

    // Control functions
    const start = useCallback(() => {
        if (timeRemaining > 0) {
            setIsRunning(true);
        }
    }, [timeRemaining]);

    const pause = useCallback(() => {
        setIsRunning(false);
    }, []);

    const reset = useCallback(() => {
        setIsRunning(false);
        setTimeRemaining(initialSeconds);
    }, [initialSeconds]);

    const addTime = useCallback((seconds: number) => {
        setTimeRemaining((prev) => Math.max(0, prev + seconds));
    }, []);

    // Time warnings
    const isTimeLow = timeRemaining > 0 && timeRemaining <= 300; // 5 minutes

    return {
        timeRemaining,
        isRunning,
        isTimeLow,
        formattedTime: formatTime(timeRemaining),
        start,
        pause,
        reset,
        addTime,
    };
}
