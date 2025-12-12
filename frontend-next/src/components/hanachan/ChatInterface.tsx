"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./Chat.module.css";
import {
    Send, Paperclip, Library, User as UserIcon, Keyboard, ChevronLeft, ChevronRight, ArrowRight, BrainCircuit, StickyNote
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import ChatNavigationPanel from "./ChatNavigationPanel";
import ArtifactsPanel, { PanelState } from "./ArtifactsPanel";
import { Message, Conversation, Resource, Artifact } from "@/types/chat";


// --- CONSTANTS ---
const BACKEND_URL = "http://localhost:5400";

const EXAMPLE_SUGGESTIONS = [
    { title: "Draft a plan", subtitle: "for a marketing campaign" },
    { title: "Explain Quantum", subtitle: "physics to a 5 year old" },
    { title: "Japanese Grammar", subtitle: "explain 'reba' conditional" },
    { title: "Create Flashcards", subtitle: "for JLPT N5 vocab" },
];

export default function ChatInterface() {
    // --- State ---
    const [userId] = useState("user-default");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [history, setHistory] = useState<Conversation[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);

    // UI State
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelState, setRightPanelState] = useState<PanelState>('minimized');
    const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
    const [sessionArtifacts, setSessionArtifacts] = useState<Artifact[]>([]); // Track session artifacts
    const [inputValue, setInputValue] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const chatFeedRef = useRef<HTMLDivElement>(null);

    // --- Effects ---
    useEffect(() => {
        loadHistory();
        // Mock resources for now
        setResources([
            { id: "1", title: "JLPT N5 Grammar Guide", type: "pdf" },
            { id: "2", title: "Genki I Vocabulary List", type: "list" },
        ]);
    }, []);

    useEffect(() => {
        if (chatFeedRef.current) {
            chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
        }
    }, [messages]);

    // --- API Interactions ---
    const loadHistory = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/conversations/user/${userId}`);
            const data = await res.json();
            setHistory(data.reverse());
        } catch (err) {
            // console.error("Failed to load history", err);
            // Fallback mock
            setHistory([{ id: "mock-1", title: "Japanese Study Plan" }, { id: "mock-2", title: "Verb Conjugations" }]);
        }
    };

    const loadConversation = async (id: string) => {
        setSessionId(id);

        try {
            const res = await fetch(`${BACKEND_URL}/conversations/${id}`);
            const data = await res.json();
            const msgs: Message[] = data.history.map((m: any) => ({
                role: m.role,
                content: m.content,
                attachments: m.artifacts ? JSON.parse(m.artifacts) : []
            }));
            setMessages(msgs);
        } catch (err) {
            // console.error("Failed to load conversation", err);
            // Fallback for demo
            setMessages([
                { role: "user", content: "Hello! Can you help me study?" },
                { role: "ai", content: "Hi there! Of course. How can I help you learn Japanese today?" }
            ]);
        }
    };

    const startNewChat = () => {
        setSessionId(null);
        setMessages([]);
        setActiveArtifact(null); // Clear active artifact on new chat
        setSessionArtifacts([]); // Clear session artifacts
    };

    const sendMessage = async () => {
        if (!inputValue.trim() && !isProcessing) return;

        const userMsg: Message = { role: "user", content: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsProcessing(true);

        // Simulate AI response for now (or connect to backend if available)
        setTimeout(() => {
            // Demo artifact creation
            let newArtifact: Artifact | undefined;
            if (userMsg.content.toLowerCase().includes('flashcard')) {
                newArtifact = {
                    type: 'flashcard',
                    content: { title: "JLPT N5 Vocab", front: "猫 (Neko)", back: "Cat" }
                };
            } else if (userMsg.content.toLowerCase().includes('mindmap')) {
                newArtifact = {
                    type: 'mindmap',
                    content: {
                        title: "Japanese Writing Systems",
                        root: {
                            label: "Japanese",
                            children: [
                                { label: "Hiragana" },
                                { label: "Katakana" },
                                { label: "Kanji" }
                            ]
                        }
                    }
                };
            } else if (userMsg.content.toLowerCase().includes('task')) {
                newArtifact = {
                    type: 'task',
                    content: {
                        title: "Daily Review",
                        prompt: "Review 10 new words"
                    }
                };
            }

            const aiMsg: Message = {
                role: "ai",
                content: newArtifact
                    ? "I've generated that for you. Check the panel!"
                    : "I'm a simplified AI mock. Try asking for 'flashcards', 'mindmap', or 'task'.",
                attachments: newArtifact ? [newArtifact] : []
            };

            setMessages(prev => [...prev, aiMsg]);
            setIsProcessing(false);

            // Auto-open panel if artifact exists
            if (newArtifact) {
                setSessionArtifacts(prev => [...prev, newArtifact!]); // Add to session inventory
                setActiveArtifact(newArtifact);
                setRightPanelState('expanded');
            }
        }, 1000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const openArtifact = (artifact: Artifact) => {
        // Find if artifact is already in session, if not add it (prevent dupes ideally, but simplified here)
        if (!sessionArtifacts.find(a => a === artifact)) {
            setSessionArtifacts(prev => [...prev, artifact]);
        }
        setActiveArtifact(artifact);
        setRightPanelState('expanded');
    };

    // Helper to render inline summary
    const renderArtifactSummary = (artifact: Artifact) => {
        let Icon = Library;
        let Label = "Artifact";
        let Color = "text-brand-salmon";
        let Bg = "bg-brand-salmon/10";

        if (artifact.type === 'flashcard') { Icon = Library; Label = "Flashcard"; Color = "text-brand-peach"; Bg = "bg-brand-peach/10"; }
        if (artifact.type === 'mindmap') { Icon = BrainCircuit; Label = "Mind Map"; Color = "text-brand-sky"; Bg = "bg-brand-sky/10"; }
        if (artifact.type === 'task') { Icon = StickyNote; Label = "Task"; Color = "text-brand-emerald"; Bg = "bg-brand-emerald/10"; }

        return (
            <div className="flex bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-2 gap-4 items-center group hover:bg-slate-50 transition-colors w-full max-w-sm">
                <div className={`p-3 rounded-lg ${Bg} ${Color}`}>
                    <Icon size={24} />
                </div>
                <div className="flex-1">
                    <div className="font-bold text-brand-dark">{artifact.content.title || Label}</div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{Label}</div>
                </div>
                <button
                    onClick={() => openArtifact(artifact)}
                    className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-brand-dark transition-colors"
                    title="View details"
                >
                    <ArrowRight size={20} />
                </button>
            </div>
        );
    };


    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 relative">
            {/* 
                MERGED SIDEBAR NAV:
                Fixed at left-32 (8rem). 
            */}
            <ChatNavigationPanel
                history={history}
                resources={resources}
                activeSessionId={sessionId}
                onNewChat={startNewChat}
                onSelectConversation={loadConversation}
                onSelectResource={(r) => console.log(r)}
                isOpen={leftPanelOpen}
                onClose={() => setLeftPanelOpen(false)}
            />

            {/* Left Panel Expansion Trigger */}
            {!leftPanelOpen && (
                <button
                    onClick={() => setLeftPanelOpen(true)}
                    className="fixed left-28 top-1/2 -translate-y-1/2 ml-2 bg-white p-2 rounded-r-xl shadow-clay border-y border-r border-slate-200 text-brand-salmon hover:scale-110 transition-transform z-30"
                    title="Show Chat History"
                >
                    <ChevronRight size={20} />
                </button>
            )}

            {/* Layout Container: Shifts left based on left nav margin */}
            <div className={`
                flex-1 flex min-w-0 transition-all duration-300
                ${leftPanelOpen ? 'ml-[26rem]' : 'ml-[8rem]'}
            `}>

                {/* Main Content Area - Takes remaining space */}
                <div className="flex-1 flex flex-col h-full relative min-w-0 transition-all duration-300">

                    {/* Scrollable Feed */}
                    <div className="flex-1 overflow-y-auto p-8 pb-32" ref={chatFeedRef}>
                        {messages.length === 0 ? (
                            /* Zero State */
                            <div className="h-full flex flex-col items-center justify-center -mt-20">
                                <h1 className="text-4xl font-black text-brand-dark mb-2">How can I help you today?</h1>
                                <p className="text-slate-400 mb-12">I can help you prepare for JLPT or practice conversation.</p>

                                <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                                    {EXAMPLE_SUGGESTIONS.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setInputValue(item.title + " ")}
                                            className="p-6 bg-white rounded-2xl shadow-clay-sm border-2 border-transparent hover:border-brand-salmon/30 hover:shadow-clay transition-all text-left group"
                                        >
                                            <div className="font-bold text-slate-700 group-hover:text-brand-salmon transition-colors">{item.title}</div>
                                            <div className="text-sm text-slate-400">{item.subtitle}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Message List */
                            <div className="max-w-4xl mx-auto flex flex-col gap-6">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`${styles.message} ${msg.role === 'user' ? styles.user : styles.ai}`}>
                                        {/* Avatar */}
                                        <div className={styles.messageAvatar}>
                                            {msg.role === 'user' ? <UserIcon size={18} /> : <div>🌸</div>}
                                        </div>

                                        {/* Content */}
                                        <div className={styles.messageContent}>
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>

                                            {/* Artifacts Summary Cards */}
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mt-4 flex flex-col gap-2">
                                                    {msg.attachments.map((art, aIdx) => (
                                                        <div key={aIdx}>
                                                            {renderArtifactSummary(art)}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isProcessing && (
                                    <div className={`${styles.message} ${styles.ai}`}>
                                        <div className={styles.messageAvatar}>🌸</div>
                                        <div className={`${styles.messageContent} flex items-center gap-2`}>
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Composer */}
                    <div className="absolute bottom-8 left-8 right-8 max-w-4xl mx-auto w-full z-10">
                        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-clay border border-white p-2 flex items-end gap-2 relative">
                            <button className="p-3 text-slate-400 hover:text-brand-salmon hover:bg-slate-50 rounded-xl transition-colors">
                                <Paperclip size={20} />
                            </button>
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Message Hanachan..."
                                className="flex-1 bg-transparent border-none outline-none py-3 px-2 text-brand-dark min-h-[50px] max-h-[150px] resize-none"
                                rows={1}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!inputValue.trim() && !isProcessing}
                                className={`
                                    p-3 rounded-xl transition-all shadow-md flex items-center justify-center
                                    ${inputValue.trim()
                                        ? 'bg-brand-salmon text-white hover:scale-105 active:scale-95'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                                `}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                        <div className="text-center mt-2 text-xs text-slate-400">
                            AI can make mistakes. Please verify important information.
                        </div>
                    </div>
                </div>

                {/* Right Artifacts Panel */}
                <ArtifactsPanel
                    state={rightPanelState}
                    setState={setRightPanelState}
                    artifacts={sessionArtifacts}
                    activeArtifact={activeArtifact}
                    onArtifactSelect={(art) => { setActiveArtifact(art); setRightPanelState('expanded'); }}
                />

                {/* Collapsed State Toggle (if collapsed, show a trigger on the edge? Or rely on minimized state) */}
                {rightPanelState === 'collapsed' && (
                    <button
                        onClick={() => setRightPanelState('minimized')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-l-xl shadow-clay border-y border-l border-slate-200 text-brand-salmon hover:scale-110 transition-transform z-30"
                        title="Show Sidebar"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}
            </div>
        </div>
    );
}
