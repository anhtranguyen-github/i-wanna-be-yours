"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdaptiveScannerProps {
    isScanning: boolean;
    mode?: 'fast' | 'deep';
    children: React.ReactNode;
}

export const AdaptiveScanner: React.FC<AdaptiveScannerProps> = ({
    isScanning,
    mode = 'fast',
    children
}) => {
    const [telemetry, setTelemetry] = useState<string>('IDLE');

    const scanDuration = mode === 'deep' ? 2.5 : 0.8;
    const telemetryMessages = mode === 'deep'
        ? ['ANATOMIZING...', 'MAPPING SYNTAX...', 'NEURAL DECODING...', 'SYNCHRONIZING...', 'READY']
        : ['SCANNING...', 'TRANSLATING...', 'READY'];

    useEffect(() => {
        if (isScanning) {
            let i = 0;
            const interval = setInterval(() => {
                setTelemetry(telemetryMessages[i % (telemetryMessages.length - 1)]);
                i++;
            }, (scanDuration * 1000) / telemetryMessages.length);
            return () => clearInterval(interval);
        } else {
            setTelemetry('READY');
        }
    }, [isScanning, mode]);

    return (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-transparent transition-all duration-500">
            {/* Laser Sweep Beam */}
            <AnimatePresence>
                {isScanning && (
                    <motion.div
                        initial={{ top: '-10%' }}
                        animate={{ top: '110%' }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: scanDuration,
                            repeat: mode === 'deep' ? 0 : Infinity,
                            ease: "linear"
                        }}
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent z-40 shadow-[0_0_15px_rgba(244,114,182,0.5)]"
                    />
                )}
            </AnimatePresence>

            {/* Telemetry Overlay */}
            {isScanning && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm pointer-events-none rounded-[2.5rem]">
                    <div className="font-mono text-xs tracking-[0.3em] text-primary-strong animate-pulse font-bold">
                        {telemetry}
                    </div>
                    <div className="mt-4 w-48 h-[2px] bg-neutral-200 overflow-hidden relative rounded-full">
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: scanDuration, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-primary"
                        />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className={`transition-all duration-1000 ${isScanning ? 'blur-sm scale-[0.99] opacity-80' : 'blur-0 scale-100 opacity-100'}`}>
                {children}
            </div>

            {/* Aesthetic Accents - Only show when scanning for cleaner look in light mode */}
            {isScanning && (
                <>
                    <div className="absolute top-4 left-4 flex gap-1 pointer-events-none">
                        <div className="w-1 h-1 rounded-full bg-primary animate-ping" />
                        <div className="w-[40px] h-1 border-t border-primary/30" />
                    </div>
                </>
            )}
        </div>
    );
};
