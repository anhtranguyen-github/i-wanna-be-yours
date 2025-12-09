"use client";

import React, { Suspense } from "react";
import TextParserMain from "@/components-parser/TextParserMain";

export default function Home() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-brand-dark">Loading...</div>}>
      <TextParserMain initialMode="text" />
    </Suspense>
  );
}
