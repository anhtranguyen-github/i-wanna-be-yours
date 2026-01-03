'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { debugService, AgentTrace } from '@/services/debugService'

interface ThoughtHUDProps {
    userId: string
    sessionId?: string
    isEnabled?: boolean
}

/**
 * ThoughtHUD - A collapsible sidebar that displays real-time agent reasoning.
 */
export default function ThoughtHUD({ userId, sessionId, isEnabled = true }: ThoughtHUDProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [traces, setTraces] = useState<AgentTrace[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchTraces = useCallback(async () => {
        if (!userId) return
        setIsLoading(true)
        try {
            const data = await debugService.getTraces(userId, 15)
            setTraces(data)
        } catch (e) {
            console.error('Failed to fetch traces:', e)
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    // Poll for new traces when open
    useEffect(() => {
        if (!isOpen || !isEnabled) return
        fetchTraces()
        const interval = setInterval(fetchTraces, 3000)
        return () => clearInterval(interval)
    }, [isOpen, isEnabled, fetchTraces])

    if (!isEnabled) return null

    const getEventIcon = (eventType: string) => {
        switch (eventType) {
            case 'intent_detection': return '🎯'
            case 'aperture_start': return '🛰️'
            case 'aperture_end': return '✅'
            case 'aperture_error': return '⚠️'
            case 'specialist_routing': return '🐝'
            case 'tool_start': return '🛠️'
            case 'tool_end': return '✅'
            case 'tool_error': return '❌'
            default: return '💭'
        }
    }

    const getEventColor = (eventType: string) => {
        if (eventType.includes('error')) return 'border-red-500'
        if (eventType.includes('start')) return 'border-blue-500'
        if (eventType.includes('end')) return 'border-green-500'
        if (eventType === 'specialist_routing') return 'border-amber-500'
        return 'border-gray-400'
    }

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed right-4 bottom-20 z-50 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-strong transition-colors"
                title="Toggle Thought HUD"
            >
                {isOpen ? '✕' : '🧠'}
            </button>

            {/* Sidebar Panel */}
            <div className={`fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 z-40 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="font-semibold text-lg">Agent Thought Stream</h2>
                    <button onClick={fetchTraces} disabled={isLoading} className="text-sm text-primary hover:underline">
                        {isLoading ? '...' : 'Refresh'}
                    </button>
                </div>

                <div className="p-4 h-[calc(100%-60px)] overflow-y-auto space-y-3">
                    {traces.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">
                            No traces yet. Interact with Hanachan to see her thinking process.
                        </p>
                    ) : (
                        traces.map((trace) => (
                            <div key={trace.id} className={`p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 ${getEventColor(trace.event_type)}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">{getEventIcon(trace.event_type)}</span>
                                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                                        {trace.event_type.replace(/_/g, ' ')}
                                    </span>
                                    <span className="ml-auto text-xs text-gray-400">
                                        {new Date(trace.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                {trace.data && Object.keys(trace.data).length > 0 && (
                                    <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-x-auto mt-1 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                        {JSON.stringify(trace.data, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    )
}
