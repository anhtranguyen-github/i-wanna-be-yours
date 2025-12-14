"use client";

import React from "react";
import Image from "next/image";

export const MindmapArtifact = ({ content }: { content: any }) => {

    // Recursive function to render nodes with improved connecting lines
    const renderNode = (node: any, depth = 0) => (
        <div key={node.id || Math.random()} className="relative pl-8">

            {/* Connection Line System */}
            {depth > 0 && (
                <>
                    {/* Horizontal Connector */}
                    <div className="absolute left-0 top-1/2 w-8 h-[2px] bg-gradient-to-r from-slate-200 to-brand-softBlue/0 -translate-y-1/2 pointer-events-none" />
                    {/* Vertical Connector Stem */}
                    <div className="absolute left-0 top-[-50%] bottom-1/2 w-[2px] bg-slate-200 pointer-events-none last:h-1/2" />
                    {/* Corner Curve (Visual trick) */}
                    <div className="absolute left-0 top-1/2 w-2 h-2 rounded-bl-lg border-l-2 border-b-2 border-slate-200 -translate-y-full -translate-x-[2px] pointer-events-none" />
                </>
            )}

            <div className="group relative">
                {/* Node Pill */}
                <div className={`
                    inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer
                    ${depth === 0
                        ? 'bg-brand-dark text-white shadow-lg scale-105 border-0'
                        : 'bg-white border border-slate-100 text-brand-dark shadow-sm hover:shadow-md hover:border-brand-softBlue hover:scale-[1.02]'}
                `}>
                    {/* Icon for Root Node */}
                    {depth === 0 && (
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">★</div>
                    )}

                    <span>{node.label || node.text}</span>

                    {/* Hover Detail */}
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-brand-dark text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        Expand
                    </div>
                </div>

                {/* Children Container with border line */}
                {node.children && node.children.length > 0 && (
                    <div className="border-l-2 border-slate-100/50 ml-6 pl-0 pt-4 pb-2">
                        {node.children.map((child: any) => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        </div>
    );

    const root = content.root || (content.nodes ? { children: content.nodes } : null);

    return (
        <div className="bg-slate-50/50 p-6 rounded-3xl h-full overflow-hidden flex flex-col border border-white/50 shadow-inner">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/60">
                <h3 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                    <span className="w-2 h-6 bg-brand-sky rounded-full" />
                    {content.title || "Mindmap"}
                </h3>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-slate-100">
                    Map View
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar p-2">
                <div className="min-w-fit pb-10">
                    {root ? renderNode(root) : <div className="text-center text-slate-400">Invalid Mindmap Data</div>}
                </div>
            </div>

            {/* Watermark/Asset decoration */}
            <div className="absolute bottom-4 right-4 opacity-[0.03] pointer-events-none w-32 h-32 rotate-12">
                <Image src="/img/grammer.png" alt="watermark" width={100} height={100} className="object-contain" />
            </div>
        </div>
    );
};
