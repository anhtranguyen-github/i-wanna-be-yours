"use client";

import React from "react";

export const MindmapArtifact = ({ content }: { content: any }) => {
    const renderNode = (node: any) => (
        <div key={node.id || Math.random()} style={{ marginLeft: '1.5rem', position: 'relative' }}>
            {/* Simple connector line visual */}
            <div className="absolute -left-3 top-1/2 w-3 h-[1px] bg-slate-200"></div>

            <div className="inline-block bg-white text-brand-dark px-3 py-2 rounded-lg border border-slate-200 mb-2 text-sm shadow-sm hover:border-brand-sky hover:shadow-md transition-all cursor-pointer">
                {node.label || node.text}
            </div>
            <div className="border-l border-slate-200 ml-[0.8rem] pl-2">
                {node.children && node.children.map(renderNode)}
            </div>
        </div>
    );
    const root = content.root || (content.nodes ? { children: content.nodes } : null);

    return (
        <div className="bg-slate-50 p-6 rounded-2xl h-full overflow-auto">
            <h3 className="text-lg font-bold mb-6 text-brand-dark uppercase tracking-wider border-b border-brand-dark/10 pb-2">{content.title || "Mindmap"}</h3>
            <div className="min-w-fit">
                {root ? renderNode(root) : <div>Invalid Mindmap Data</div>}
            </div>
        </div>
    );
};
