export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/h-api';

// --- Interfaces ---

export interface Thread {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    role: 'user' | 'ai';
    content: string;
    id: string;
}

export interface McpServer {
    id: number;
    name: string;
    type: 'stdio' | 'websocket';
    enabled: boolean;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
    headers?: Record<string, string>;
    createdAt: string;
    updatedAt: string;
}

export interface CreateMcpServerData {
    name: string;
    type: 'stdio' | 'websocket';
    enabled?: boolean;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
    headers?: Record<string, string>;
}

export interface McpToolInputSchema {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
    [key: string]: any;
}

export interface McpTool {
    name: string;
    description?: string;
    inputSchema: McpToolInputSchema;
}

export interface McpToolsResponse {
    serverGroups: Record<string, McpTool[]>;
    totalCount: number;
}


// --- API Client Class or Functions ---

export const AgentAPI = {
    // General
    checkHealth: async (): Promise<boolean> => {
        try {
            const res = await fetch(`${API_BASE_URL}/health`);
            return res.ok;
        } catch (error) {
            console.warn('Health check failed:', error);
            return false;
        }
    },

    // Threads
    listThreads: async (): Promise<Thread[]> => {
        const res = await fetch(`${API_BASE_URL}/agent-api/threads`);
        if (!res.ok) throw new Error('Failed to list threads');
        return res.json();
    },

    createThread: async (title?: string): Promise<Thread> => {
        const res = await fetch(`${API_BASE_URL}/agent-api/threads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
        });
        if (!res.ok) throw new Error('Failed to create thread');
        return res.json();
    },

    // History
    getHistory: async (threadId: string): Promise<Message[]> => {
        const res = await fetch(`${API_BASE_URL}/agent-api/history/${threadId}`);
        if (!res.ok) throw new Error('Failed to get history');
        return res.json();
    },

    // Stream (Helper to construct URL for SSE)
    getStreamUrl: (content: string, threadId: string, model: string = 'gpt-4o'): string => {
        const params = new URLSearchParams({
            content,
            threadId,
            model,
        });
        return (`${API_BASE_URL}/agent-api/stream?${params.toString()}`);
    },

    // MCP Servers
    listMcpServers: async (): Promise<McpServer[]> => {
        const res = await fetch(`${API_BASE_URL}/agent-api/mcp-servers`);
        if (!res.ok) throw new Error('Failed to list MCP servers');
        return res.json();
    },

    createMcpServer: async (data: CreateMcpServerData): Promise<{ id: number }> => {
        const res = await fetch(`${API_BASE_URL}/agent-api/mcp-servers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create MCP server');
        return res.json();
    },

    updateMcpServer: async (id: number, enabled: boolean): Promise<{ success: boolean }> => {
        const res = await fetch(`${API_BASE_URL}/agent-api/mcp-servers`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, enabled }),
        });
        if (!res.ok) throw new Error('Failed to update MCP server');
        return res.json();
    },

    deleteMcpServer: async (id: number): Promise<{ success: boolean }> => {
        const res = await fetch(`${API_BASE_URL}/agent-api/mcp-servers?id=${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete MCP server');
        return res.json();
    },

    // MCP Tools
    listMcpTools: async (): Promise<McpToolsResponse> => {
        const res = await fetch(`${API_BASE_URL}/agent-api/mcp-tools`);
        if (!res.ok) throw new Error('Failed to list MCP tools');
        return res.json();
    },
};
