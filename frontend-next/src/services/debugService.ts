/**
 * Debug Service - Frontend API client for Sovereign HUD.
 * Fetches internal agent state from the backend for visualization.
 */

import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_HANACHAN_API_URL || 'http://localhost:5400/v1'

export interface AgentTrace {
    id: number
    session_id: string
    event_type: string
    data: Record<string, unknown>
    timestamp: string
}

export interface SemanticGraphNode {
    id: string
    group: string
    label: string
}

export interface SemanticGraphLink {
    source: string
    target: string
    type: string
}

export interface SemanticGraph {
    nodes: SemanticGraphNode[]
    links: SemanticGraphLink[]
    error?: string
}

export interface Artifact {
    _id: string
    type: string
    title: string
    description?: string
    createdAt: string
    is_ghost: boolean
}

export interface ArtifactAudit {
    count: number
    artifacts: Artifact[]
    error?: string
}

export interface EpisodicMemory {
    content: string
    metadata: Record<string, unknown>
}

class DebugServiceClient {
    /**
     * Fetches recent internal thought traces.
     */
    async getTraces(userId: string, limit: number = 20): Promise<AgentTrace[]> {
        try {
            const response = await axios.get(`${API_BASE}/debug/traces`, {
                params: { user_id: userId, limit }
            })
            return response.data.traces || []
        } catch (error) {
            console.error('Failed to fetch traces:', error)
            return []
        }
    }

    /**
     * Fetches the user's semantic knowledge graph.
     */
    async getSemanticGraph(userId: string): Promise<SemanticGraph> {
        try {
            const response = await axios.get(`${API_BASE}/debug/memory/semantic`, {
                params: { user_id: userId }
            })
            return response.data
        } catch (error) {
            console.error('Failed to fetch semantic graph:', error)
            return { nodes: [], links: [], error: String(error) }
        }
    }

    /**
     * Fetches artifact audit data.
     */
    async getArtifactAudit(userId: string, limit: number = 50): Promise<ArtifactAudit> {
        try {
            const response = await axios.get(`${API_BASE}/debug/memory/artifacts`, {
                params: { user_id: userId, limit }
            })
            return response.data
        } catch (error) {
            console.error('Failed to fetch artifact audit:', error)
            return { count: 0, artifacts: [], error: String(error) }
        }
    }

    /**
     * Fetches episodic memory search results.
     */
    async getEpisodicMemory(userId: string, query: string = 'recent', limit: number = 10): Promise<EpisodicMemory[]> {
        try {
            const response = await axios.get(`${API_BASE}/debug/memory/episodic`, {
                params: { user_id: userId, query, limit }
            })
            return response.data.memories || []
        } catch (error) {
            console.error('Failed to fetch episodic memory:', error)
            return []
        }
    }
}

export const debugService = new DebugServiceClient()
