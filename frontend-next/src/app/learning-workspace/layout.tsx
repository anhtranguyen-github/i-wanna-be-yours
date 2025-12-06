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
    <div className="min-h-screen flex flex-col">
      {/* Main flex layout: main content only */}
      <div className="flex flex-1 min-h-0">
        {/* Main view */}
        <main className="flex-1 p-6 md:p-10 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
