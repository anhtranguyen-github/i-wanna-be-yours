"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useUser } from "@/context/UserContext";


function getMode(path: string) {
  if (path.endsWith("auto-task")) return "auto-task";
  if (path.endsWith("play-games")) return "play-games";
  return "ai-tutor";
}

export default function LearningWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mode = getMode(pathname || "");
  const router = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Nav and view logic
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-gray-100">
      {/* Top bar with back arrow and nav */}
      <header className="sticky top-0 z-40 bg-white/90 shadow flex items-center px-4 h-14 border-b border-gray-200">
        <button onClick={() => router.push("/")} aria-label="Back to site" className="mr-2 rounded-lg text-indigo-500 hover:bg-indigo-50 px-2 py-1 text-2xl font-bold">←</button>
        <nav className="flex gap-2 ml-1">
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors text-gray-700 hover:text-indigo-800 ${mode === 'ai-tutor' ? "bg-indigo-100 text-indigo-700" : ""}`}
            onClick={() => router.push("/learning-workspace")}
            aria-current={mode === 'ai-tutor' ? "page" : undefined}
          >AI Tutor</button>
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors text-gray-700 hover:text-indigo-800 ${mode === 'auto-task' ? "bg-indigo-100 text-indigo-700" : ""}`}
            onClick={() => router.push("/learning-workspace/auto-task")}
            aria-current={mode === 'auto-task' ? "page" : undefined}
          >Auto Task</button>
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors text-gray-700 hover:text-indigo-800 ${mode === 'play-games' ? "bg-indigo-100 text-indigo-700" : ""}`}
            onClick={() => router.push("/learning-workspace/play-games")}
            aria-current={mode === 'play-games' ? "page" : undefined}
          >Play Games</button>
        </nav>
      </header>
      {/* Main flex layout: main content only */}
      <div className="flex flex-1 min-h-0">
        {/* Main view */}
        <main className="flex-1 px-0 md:px-6 py-6 md:py-10 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
