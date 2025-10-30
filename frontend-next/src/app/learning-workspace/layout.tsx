"use client";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/learning-workspace", label: "AI Tutor" },
  { href: "/learning-workspace/auto-task", label: "Auto Task" },
  { href: "/learning-workspace/play-games", label: "Play Games" }
];

export default function LearningWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-gray-100">
      {/* Dedicated top nav for workspace */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur shadow-sm flex items-center px-6 py-4">
        <div className="text-2xl font-bold tracking-tight text-indigo-600">Learning Workspace</div>
        <nav className="ml-auto flex gap-2">
          {NAV.map(({ href, label }) => (
            <button
              key={href}
              className={`px-4 py-2 rounded font-semibold transition-colors text-gray-700 hover:text-indigo-800 ${pathname === href ? "bg-indigo-100 text-indigo-700" : ""}`}
              onClick={() => router.push(href)}
              aria-current={pathname === href ? "page" : undefined}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>
      <main className="flex flex-col w-full max-w-3xl mx-auto flex-1 px-2 md:px-6 py-6 md:py-10">{children}</main>
    </div>
  );
}
