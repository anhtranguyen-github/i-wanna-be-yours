'use client'

import React, { useEffect, useState } from 'react'
import { debugService, SemanticGraph, Artifact, AgentTrace } from '@/services/debugService'

// Import react-force-graph dynamically (client-side only)
import dynamic from 'next/dynamic'
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

/**
 * Memory Voyager - Visualizes the agent's internal memory state.
 * Displays Semantic Graph (Neo4j), Artifacts (MongoDB), and Thought Traces (Postgres).
 */
export default function MemoryVoyagerPage() {
    const [userId, setUserId] = useState<string>('sim-student-99')
    const [graph, setGraph] = useState<SemanticGraph>({ nodes: [], links: [] })
    const [artifacts, setArtifacts] = useState<Artifact[]>([])
    const [traces, setTraces] = useState<AgentTrace[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchData = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const [graphData, auditData, traceData] = await Promise.all([
                debugService.getSemanticGraph(userId),
                debugService.getArtifactAudit(userId),
                debugService.getTraces(userId)
            ])
            setGraph(graphData)
            setArtifacts(auditData.artifacts)
            setTraces(traceData)
        } catch (e) {
            setError(String(e))
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [userId])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Memory Voyager</h1>
                    <p className="text-sm text-gray-500">Internal state visualization for debugging</p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="User ID"
                        className="px-3 py-2 border rounded-md text-sm dark:bg-gray-800 dark:border-gray-700"
                    />
                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-strong disabled:opacity-50"
                    >
                        {isLoading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {error && <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>}

            {/* Three-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Semantic Graph */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                    <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <span className="text-xl">🧠</span> Semantic Memory (Neo4j)
                    </h2>
                    <div className="h-[400px] bg-gray-900 rounded-lg overflow-hidden">
                        {graph.nodes.length > 0 ? (
                            <ForceGraph2D
                                graphData={graph}
                                nodeLabel="label"
                                nodeAutoColorBy="group"
                                linkDirectionalArrowLength={3.5}
                                linkDirectionalArrowRelPos={1}
                                linkCurvature={0.25}
                                width={600}
                                height={400}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                {graph.error || 'No nodes found. Interact with the agent to build memory.'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Thought Traces */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 max-h-[500px] overflow-y-auto">
                    <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <span className="text-xl">💭</span> Thought Traces
                    </h2>
                    {traces.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                            {traces.map((trace) => (
                                <li key={trace.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                                    <div className="flex justify-between items-center">
                                        <span className="font-mono text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                                            {trace.event_type}
                                        </span>
                                        <span className="text-xs text-gray-400">{new Date(trace.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <pre className="mt-1 text-xs text-gray-600 dark:text-gray-300 overflow-x-auto">
                                        {JSON.stringify(trace.data, null, 2)}
                                    </pre>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400 text-sm">No traces found. Run a simulation to generate traces.</p>
                    )}
                </div>
            </div>

            {/* Artifacts Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <span className="text-xl">📦</span> Artifact Audit (MongoDB)
                    <span className="ml-auto text-sm font-normal text-gray-500">{artifacts.length} artifacts</span>
                </h2>
                {artifacts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-2 text-left">ID</th>
                                    <th className="px-4 py-2 text-left">Type</th>
                                    <th className="px-4 py-2 text-left">Title</th>
                                    <th className="px-4 py-2 text-left">Created</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {artifacts.map((art) => (
                                    <tr key={art._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-2 font-mono text-xs">{art._id.slice(-8)}</td>
                                        <td className="px-4 py-2">
                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-xs">{art.type}</span>
                                        </td>
                                        <td className="px-4 py-2">{art.title}</td>
                                        <td className="px-4 py-2 text-gray-500 text-xs">{new Date(art.createdAt).toLocaleString()}</td>
                                        <td className="px-4 py-2">
                                            {art.is_ghost ? (
                                                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded text-xs">Ghost</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs">Persisted</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm">No artifacts found for this user.</p>
                )}
            </div>
        </div>
    )
}
