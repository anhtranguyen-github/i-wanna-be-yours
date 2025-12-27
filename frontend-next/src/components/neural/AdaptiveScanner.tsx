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
        <div className="relative overflow-hidden rounded-xl bg-neutral-900 shadow-2xl transition-all duration-500 border border-cyan-500/20">
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
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent z-40 shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                    />
                )}
            </AnimatePresence>

            {/* Telemetry Overlay */}
            {isScanning && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-neutral-900/60 backdrop-blur-sm pointer-events-none">
                    <div className="font-mono text-xs tracking-[0.3em] text-cyan-400 animate-pulse">
                        {telemetry}
                    </div>
                    <div className="mt-4 w-48 h-[2px] bg-neutral-800 overflow-hidden relative">
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: scanDuration, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-cyan-400"
                        />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className={`transition-all duration-1000 ${isScanning ? 'blur-md grayscale scale-95 opacity-50' : 'blur-0 grayscale-0 scale-100 opacity-100'}`}>
                {children}
            </div>

            {/* Aesthetic Accents */}
            <div className="absolute top-2 left-2 flex gap-1 pointer-events-none">
                <div className="w-1 h-1 rounded-full bg-cyan-500 animate-ping" />
                <div className="w-[40px] h-1 border-t border-cyan-500/30" />
            </div>
            <div className="absolute bottom-2 right-2 text-[8px] font-mono text-cyan-500/50 uppercase tracking-tighter pointer-events-none">
                Hanabira Neural Lab v1.0
            </div>
        </div>
    );
};
