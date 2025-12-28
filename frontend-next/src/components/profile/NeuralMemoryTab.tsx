"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useUser } from '@/context/UserContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, History, Share2, ZoomIn, Loader2, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Dynamically import ForceGraph2D as it uses window/canvas
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => <div className="flex h-[500px] items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-brand-green" /></div>
});

interface GraphData {
    nodes: any[];
    links: any[];
}

interface MemoryItem {
    id: string;
    content: string;
    source: string;
    type: string;
    timestamp?: number;
}

export function NeuralMemoryTab() {
    const { user } = useUser();
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
    const [memories, setMemories] = useState<MemoryItem[]>([]);
    const [loadingGraph, setLoadingGraph] = useState(false);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const graphRef = useRef<any>();

    useEffect(() => {
        if (!user) return;

        const fetchGraph = async () => {
            setLoadingGraph(true);
            try {
                // Fetch from new Hanachan endpoint
                const res = await fetch(`${process.env.NEXT_PUBLIC_HANACHAN_URL || 'http://localhost:5400'}/memory/semantic?userId=${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setGraphData(data);
                }
            } catch (e) {
                console.error("Failed to fetch graph", e);
            } finally {
                setLoadingGraph(false);
            }
        };

        const fetchTimeline = async () => {
            setLoadingTimeline(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_HANACHAN_URL || 'http://localhost:5400'}/memory/episodic?userId=${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setMemories(data);
                }
            } catch (e) {
                console.error("Failed to fetch episodic memory", e);
            } finally {
                setLoadingTimeline(false);
            }
        };

        fetchGraph();
        fetchTimeline();
    }, [user]);

    const handleNodeClick = (node: any) => {
        if (graphRef.current) {
            graphRef.current.centerAt(node.x, node.y, 1000);
            graphRef.current.zoom(8, 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold font-display text-neutral-dark">Neural Memory Bank</h2>
                    <p className="text-neutral-ink">Visualize your synchronized knowledge graph and memory timeline.</p>
                </div>
                <div className="flex gap-2">
                    <span className="bg-brand-green/10 text-brand-green px-3 py-1 rounded-full text-xs font-bold font-mono">
                        NODES: {graphData.nodes.length}
                    </span>
                    <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold font-mono">
                        MEMORIES: {memories.length}
                    </span>
                </div>
            </div>

            <Tabs defaultValue="semantic" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="semantic" className="flex items-center gap-2">
                        <Share2 size={16} /> Semantic Graph
                    </TabsTrigger>
                    <TabsTrigger value="episodic" className="flex items-center gap-2">
                        <History size={16} /> Episodic Timeline
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="semantic">
                    <Card className="overflow-hidden border-slate-200">
                        <CardContent className="p-0 h-[600px] relative bg-slate-50">
                            {!loadingGraph && graphData.nodes.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                    <p className="text-neutral-ink">No semantic connections found yet.</p>
                                </div>
                            )}

                            <ForceGraph2D
                                ref={graphRef}
                                graphData={graphData}
                                nodeLabel="label"
                                nodeAutoColorBy="group"
                                linkDirectionalArrowLength={3.5}
                                linkDirectionalArrowRelPos={1}
                                onNodeClick={handleNodeClick}
                                backgroundColor="#f8fafc" // slate-50
                                nodeCanvasObject={(node: any, ctx, globalScale) => {
                                    const label = node.label;
                                    const fontSize = 12 / globalScale;
                                    ctx.font = `${fontSize}px Sans-Serif`;
                                    const textWidth = ctx.measureText(label).width;
                                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                                    ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

                                    ctx.textAlign = 'center';
                                    ctx.textBaseline = 'middle';
                                    ctx.fillStyle = node.color;
                                    ctx.fillText(label, node.x, node.y);

                                    node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="episodic">
                    <Card className="border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Interactions</CardTitle>
                            <CardDescription>Chronological log of your interactions and ingested knowledge.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingTimeline ? (
                                <div className="flex py-12 justify-center"><Loader2 className="animate-spin text-neutral-ink" /></div>
                            ) : memories.length === 0 ? (
                                <div className="text-center py-12 text-neutral-ink">No memories recorded yet.</div>
                            ) : (
                                <div className="space-y-6 relative border-l-2 border-slate-200 ml-4 pl-6 py-2">
                                    {memories.map((mem) => (
                                        <div key={mem.id} className="relative group">
                                            {/* Dot */}
                                            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-300 group-hover:border-brand-green transition-colors" />

                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs text-neutral-ink">
                                                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
                                                        {mem.type.toUpperCase()}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{mem.source}</span>
                                                    {mem.timestamp && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={10} />
                                                                {new Date(mem.timestamp * 1000).toLocaleString()}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    {mem.content.substring(0, 300)}
                                                    {mem.content.length > 300 && "..."}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
