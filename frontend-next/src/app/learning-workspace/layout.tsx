"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

function getMode(path: string) {
  if (path.endsWith("auto-task")) return "auto-task";
  if (path.endsWith("play-games")) return "play-games";
  return "ai-tutor";
}

export default function LearningWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mode = getMode(pathname || "");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(mode === "ai-tutor");
  const router = useRouter();

  // Nav and view logic
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-gray-100">
      {/* Top bar with back arrow and nav */}
      <header className="sticky top-0 z-40 bg-white/90 shadow flex items-center px-4 h-14 border-b border-gray-200">
        <button onClick={()=>router.push("/")} aria-label="Back to site" className="mr-2 rounded-lg text-indigo-500 hover:bg-indigo-50 px-2 py-1 text-2xl font-bold">←</button>
        <nav className="flex gap-2 ml-1">
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors text-gray-700 hover:text-indigo-800 ${mode==='ai-tutor'?"bg-indigo-100 text-indigo-700":""}`}
            onClick={()=>router.push("/learning-workspace")}
            aria-current={mode==='ai-tutor'?"page":undefined}
          >AI Tutor</button>
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors text-gray-700 hover:text-indigo-800 ${mode==='auto-task'?"bg-indigo-100 text-indigo-700":""}`}
            onClick={()=>router.push("/learning-workspace/auto-task")}
            aria-current={mode==='auto-task'?"page":undefined}
          >Auto Task</button>
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors text-gray-700 hover:text-indigo-800 ${mode==='play-games'?"bg-indigo-100 text-indigo-700":""}`}
            onClick={()=>router.push("/learning-workspace/play-games")}
            aria-current={mode==='play-games'?"page":undefined}
          >Play Games</button>
        </nav>
      </header>
      {/* Main flex layout: sidebar - main - right notes */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -240, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -240, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="w-60 min-w-[190px] max-w-[220px] bg-white dark:bg-gray-50 border-r border-gray-200 h-[calc(100vh-3.5rem)] flex flex-col"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <span className="font-semibold">{mode==="ai-tutor"?"Conversations":mode==="auto-task"?"Tasks":null}</span>
                <button onClick={()=>setSidebarOpen(false)} aria-label="Collapse" className="text-gray-400 hover:text-indigo-400">❮</button>
              </div>
              <div className="flex-1 overflow-auto px-3 py-2 text-gray-600">
                {/* Sidebar stub content - will be replaced based on mode */}
                sidebar stub
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
        {!sidebarOpen && (
          <button className="w-6 min-w-[20px] flex flex-col items-center justify-center bg-white border-r border-gray-200 text-gray-300 hover:text-indigo-400" style={{height:"calc(100vh - 3.5rem)"}} onClick={()=>setSidebarOpen(true)}>❯</button>
        )}
        {/* Main view */}
        <main className="flex-1 px-0 md:px-6 py-6 md:py-10 flex flex-col">{children}</main>
        {/* Notes panel (right) only in AI Tutor mode */}
        <AnimatePresence initial={false}>
          {mode==="ai-tutor" && notesOpen && (
            <motion.aside
              initial={{ x: 280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 280, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="hidden md:flex w-72 max-w-[300px] bg-white dark:bg-gray-50 border-l border-gray-200 h-[calc(100vh-3.5rem)] flex-col z-20"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <span className="font-semibold">Notes</span>
                <button onClick={()=>setNotesOpen(false)} className="text-gray-400 hover:text-indigo-400">❯</button>
              </div>
              <div className="flex-1 overflow-auto px-3 py-2 text-gray-600">
                Notes stub
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
        {mode==="ai-tutor" && !notesOpen && (
          <button className="hidden md:flex w-6 min-w-[20px] flex-col items-center justify-center bg-white border-l border-gray-200 text-gray-300 hover:text-indigo-400" style={{height:"calc(100vh - 3.5rem)"}} onClick={()=>setNotesOpen(true)}>❮</button>
        )}
      </div>
    </div>
  );
}
