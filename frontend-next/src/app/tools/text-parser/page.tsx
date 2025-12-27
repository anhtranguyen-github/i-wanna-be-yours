"use client";

import React, { Suspense } from "react";
import TextParserMain from "@/components-parser/TextParserMain";
import { NeuralLabLayout } from "@/components/neural/NeuralLabLayout";
import { GuestTeaser } from "@/components/neural/GuestTeaser";
import { useUser } from "@/context/UserContext";

export default function Home() {
  const { user, loading } = useUser();

  return (
    <NeuralLabLayout
      title="Text Parser"
      subtitle="Comprehensive Linguistic Intelligence Hub. Analyze Japanese text, extract YouTube transcripts, and deconstruct kanji in real-time."
    >
      <Suspense fallback={<div className="p-10 text-center font-black text-cyan-500 animate-pulse">Initializing Hub...</div>}>
        <div className="relative">
          {!loading && !user && <GuestTeaser toolName="Text Parser" />}
          <div className={!user ? 'blur-xl grayscale' : ''}>
            <TextParserMain initialMode="text" />
          </div>
        </div>
      </Suspense>
    </NeuralLabLayout>
  );
}
