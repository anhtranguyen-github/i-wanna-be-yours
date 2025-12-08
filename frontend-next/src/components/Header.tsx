"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import LoginButton from "@/components/LoginButton";
import UserDisplay from "@/components/UserDisplay";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export default function Header() {
    const { user, logout } = useUser();
    const loggedIn = !!user;
    const [active, setActive] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [darkMode]);

    const showMenu = () => {
        setActive(!active);
    };

    const menuItems = {
        tools: [
            { label: "Text Parser", href: "/text-parser" },
            { label: "YouTube Immersion", href: "/text-parser?type=youtube" },
            { label: "Grammar Graph", href: "/grammar-graph" },
            { label: "Translator", href: "/translate" },
            { label: "Word Relations", href: "/word-relations" },
        ],
        workspace: [
            { label: "AI Tutor", href: "/learning-workspace" },
            { label: "Auto Task", href: "/learning-workspace/auto-task" },
            { label: "Play Games", href: "/learning-workspace/play-games" },
        ],
        library: [
            { label: "YouTube Library", href: "/podcasts" },
            { label: "My YouTube Library", href: "/my-podcasts" },
            { label: "My Articles", href: "/custom-text" },
            { label: "My Vocabulary", href: "/my-vocabulary" },
        ],
        content: [
            { label: "JLPT Grammar", href: "/content/grammarlist" },
            { label: "Essential Verbs", href: "/content/vocabulary_selection/essential_verbs" },
            { label: "JLPT N3 Vocab", href: "/content/vocabulary_selection/JLPT_N3" },
            { label: "Kanji", href: "/content/kanji" },
            { label: "Radicals", href: "/content/radicals" },
        ],
        japanese: [
            { label: "Mnemonics", href: "/japanese/kanji-mnemonics" },
            { label: "SRS Flashcards", href: "/japanese/flashcards" },
            { label: "Kana", href: "/japanese/kana" },
            { label: "Quick Kanji", href: "/japanese/quick_kanji" },
            { label: "Quick JLPT Vocab", href: "/japanese/quick_vocab" },
        ],
        experimental: [
            { label: "Songify Vocabulary", href: "/songify-vocabulary" },
        ],
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b-2 border-brand-dark bg-brand-cream dark:bg-gray-900 bg-opacity-95 backdrop-blur">
            <div className="container mx-auto px-4 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-4">
                {/* Left: Logo */}
                <div className="flex justify-start">
                    <Link href="/" className="flex items-center space-x-2">
                        <h1 className="text-2xl font-extrabold text-brand-dark dark:text-brand-light">
                            Hanabira
                        </h1>
                        <span className="hidden lg:inline-block text-xs font-bold text-brand-dark/70 dark:text-brand-light/70 uppercase tracking-wider">
                            v0.3.8
                        </span>
                    </Link>
                </div>

                {/* Center: Desktop Navigation */}
                <div className="flex justify-center">
                    <nav className="hidden xl:flex items-center space-x-1 font-semibold text-sm">
                        <Link href="/" className="px-3 py-2 text-brand-dark hover:text-brand-blue hover:bg-brand-blue/10 rounded-md transition-colors">
                            Home
                        </Link>

                        <Dropdown label="Content" items={menuItems.content} />
                        <Dropdown label="Workspace" items={menuItems.workspace} />
                        <Dropdown label="Tools" items={menuItems.tools} />
                        <Dropdown label="Library" items={menuItems.library} />
                        <Dropdown label="Japanese" items={menuItems.japanese} />
                        <Dropdown label="Experimental" items={menuItems.experimental} />

                        <Link href={loggedIn ? "/user-dashboard" : "/login"} className="px-3 py-2 text-brand-dark hover:text-brand-blue hover:bg-brand-blue/10 rounded-md transition-colors">
                            Dashboard
                        </Link>
                    </nav>
                </div>

                {/* Right: Actions */}
                <div className="flex justify-end items-center space-x-2">
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors hidden xl:block"
                    >
                        {darkMode ? <MoonIcon /> : <SunIcon />}
                    </button>

                    <div className="hidden xl:flex items-center space-x-3 ml-2">
                        {loggedIn ? (
                            <div className="flex items-center space-x-3">
                                <span className="text-xs font-bold text-brand-dark dark:text-brand-light truncate max-w-[150px]">
                                    {user?.email}
                                </span>
                                <button
                                    onClick={logout}
                                    className="px-3 py-1.5 text-xs font-bold text-white bg-brand-peach hover:bg-brand-peach/90 rounded-md transition-colors shadow-sm"
                                >
                                    Log out
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-brand-dark/60">not logged in</span>
                                <Link
                                    href="/login"
                                    className="px-4 py-1.5 text-xs font-bold text-brand-dark bg-brand-green hover:bg-brand-green/90 rounded-md transition-colors shadow-sm"
                                >
                                    Log in
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button - Show on smaller than xl */}
                    <button
                        onClick={showMenu}
                        className="xl:hidden p-2 font-bold text-brand-dark hover:text-brand-blue"
                    >
                        {active ? "CLOSE" : "MENU"}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {active && (
                <div className="xl:hidden absolute top-16 left-0 w-full bg-brand-cream dark:bg-gray-900 border-b-2 border-brand-dark shadow-xl overflow-y-auto max-h-[80vh] z-50">
                    <div className="p-4 flex flex-col space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-sm text-brand-dark/60">Menu</span>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="flex items-center space-x-2 px-3 py-1 rounded-full border border-brand-dark/20"
                            >
                                <span className="text-xs font-bold">{darkMode ? "Dark" : "Light"}</span>
                                {darkMode ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
                            </button>
                        </div>

                        <MobileLink href="/" onClick={showMenu}>Home</MobileLink>

                        <div className="border-t border-brand-dark/10 my-2"></div>
                        <p className="text-xs font-bold text-brand-dark/50 uppercase tracking-wider">Content</p>
                        {menuItems.content.map((item) => (
                            <MobileLink key={item.href} href={item.href} onClick={showMenu}>{item.label}</MobileLink>
                        ))}

                        <MobileLink href={loggedIn ? "/user-dashboard" : "/login"} onClick={showMenu}>User Dashboard</MobileLink>

                        <div className="border-t border-brand-dark/10 my-2"></div>
                        <p className="text-xs font-bold text-brand-dark/50 uppercase tracking-wider">Workspace</p>
                        {menuItems.workspace.map((item) => (
                            <MobileLink key={item.href} href={item.href} onClick={showMenu}>{item.label}</MobileLink>
                        ))}

                        <div className="border-t border-brand-dark/10 my-2"></div>
                        <p className="text-xs font-bold text-brand-dark/50 uppercase tracking-wider">Tools</p>
                        {menuItems.tools.map((item) => (
                            <MobileLink key={item.href} href={item.href} onClick={showMenu}>{item.label}</MobileLink>
                        ))}

                        <div className="border-t border-brand-dark/10 my-2"></div>
                        <p className="text-xs font-bold text-brand-dark/50 uppercase tracking-wider">Library</p>
                        {menuItems.library.map((item) => (
                            <MobileLink key={item.href} href={item.href} onClick={showMenu}>{item.label}</MobileLink>
                        ))}

                        <div className="border-t border-brand-dark/10 my-2"></div>
                        <p className="text-xs font-bold text-brand-dark/50 uppercase tracking-wider">Japanese</p>
                        {menuItems.japanese.map((item) => (
                            <MobileLink key={item.href} href={item.href} onClick={showMenu}>{item.label}</MobileLink>
                        ))}

                        <div className="border-t border-brand-dark/10 my-2"></div>
                        {loggedIn ? (
                            <div className="flex flex-col space-y-2">
                                <span className="text-sm font-bold text-brand-dark px-2">{user?.email}</span>
                                <button onClick={logout} className="text-left px-2 py-1 font-bold text-red-500 hover:bg-red-50 rounded">Logout</button>
                            </div>
                        ) : (
                            <LoginButton />
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

function Dropdown({ label, items }: { label: string; items: { label: string; href: string }[] }) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger className="font-bold text-brand-dark hover:text-brand-blue flex items-center space-x-1 outline-none">
                <span>{label}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content className="min-w-[200px] bg-white dark:bg-gray-800 border-2 border-brand-dark rounded-lg p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-2">
                    {items.map((item) => (
                        <DropdownMenu.Item key={item.href} className="outline-none">
                            <Link
                                href={item.href}
                                className="block px-3 py-2 text-sm font-medium text-brand-dark dark:text-gray-200 hover:bg-brand-blue/10 rounded transition-colors"
                            >
                                {item.label}
                            </Link>
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

function MobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <Link href={href} onClick={onClick} className="block py-1 text-sm font-medium text-brand-dark dark:text-gray-200 hover:text-brand-blue">
            {children}
        </Link>
    );
}


const SunIcon = ({ className = "w-6 h-6" }: { className?: string }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={className}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
            />
        </svg>
    );
};

const MoonIcon = ({ className = "w-6 h-6" }: { className?: string }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={className}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
            />
        </svg>
    );
};
