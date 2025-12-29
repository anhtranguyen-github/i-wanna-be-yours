"use client";

import React, { Suspense } from "react";
import TextParserMain from "@/components-parser/TextParserMain";
import Link from "next/link";
import { Wrench, ArrowLeft, Type, Network, Languages, BrainCircuit, FileText } from "lucide-react";
import { GuestTeaser } from "@/components/neural/GuestTeaser";
import { useUser } from "@/context/UserContext";

export default function Home() {
  const { user, loading } = useUser();

  return (
    <div className="min-h-screen bg-neutral-beige/20">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Suspense fallback={<div className="p-10 text-center font-black text-primary animate-pulse">Initializing Hub...</div>}>
          <div className="relative">
            {!loading && !user && <GuestTeaser toolName="Text Parser" />}
            <div className={!user ? 'blur-xl grayscale' : ''}>
              <TextParserMain initialMode="text" />
            </div>
          </div>
        </Suspense>
      </div>
    </div>
  );
}
