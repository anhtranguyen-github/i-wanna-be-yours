"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./Chat.module.css";
import {
    Send, Paperclip, User as UserIcon, ChevronRight, ArrowRight, BrainCircuit, StickyNote, Sparkles, BookOpen
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import ChatNavigationPanel from "./ChatNavigationPanel";
import ArtifactsPanel, { PanelState } from "./ArtifactsPanel";
import { Message, Conversation, Resource, Artifact } from "@/types/chat";


// --- CONSTANTS ---
const BACKEND_URL = "/h-api";

const EXAMPLE_SUGGESTIONS = [
    { title: "Draft a plan", subtitle: "for a marketing campaign", icon: Sparkles },
    { title: "Explain Quantum", subtitle: "physics to a 5 year old", icon: BrainCircuit },
    { title: "Japanese Grammar", subtitle: "explain 'reba' conditional", icon: BookOpen, asset: "/img/grammer.png" }, // Custom asset
    { title: "Create Flashcards", subtitle: "for JLPT N5 vocab", icon: StickyNote },
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
    const [sessionArtifacts, setSessionArtifacts] = useState<Artifact[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const chatFeedRef = useRef<HTMLDivElement>(null);

    // --- Effects ---
    useEffect(() => {
        loadHistory();
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
        } catch {
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
        } catch {
            setMessages([
                { role: "user", content: "Hello! Can you help me study?" },
                { role: "ai", content: "Hi there! Of course. How can I help you learn Japanese today?" }
            ]);
        }
    };

    const startNewChat = () => {
        setSessionId(null);
        setMessages([]);
        setActiveArtifact(null);
        setSessionArtifacts([]);
    };

    const sendMessage = async () => {
        if (!inputValue.trim() && !isProcessing) return;

        const userMsg: Message = { role: "user", content: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsProcessing(true);

        setTimeout(() => {
            let newArtifact: Artifact | undefined;
            // Demo logic
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

            if (newArtifact) {
                setSessionArtifacts(prev => [...prev, newArtifact!]);
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
        if (!sessionArtifacts.find(a => a === artifact)) {
            setSessionArtifacts(prev => [...prev, artifact]);
        }
        setActiveArtifact(artifact);
        setRightPanelState('expanded');
    };

    const renderArtifactSummary = (artifact: Artifact) => {
        let Icon = BookOpen;
        let Label = "Artifact";
        let gradientClass = "from-brand-peach/20 to-brand-peach/5";
        let iconBg = "bg-brand-peach/20 text-brand-dark";

        if (artifact.type === 'flashcard') { Icon = BookOpen; Label = "Flashcard"; gradientClass = "from-brand-peach/20 to-brand-peach/5"; iconBg = "bg-brand-peach/20 text-brand-dark"; }
        if (artifact.type === 'mindmap') { Icon = BrainCircuit; Label = "Mind Map"; gradientClass = "from-brand-sky/20 to-brand-sky/5"; iconBg = "bg-brand-softBlue text-brand-dark"; }
        if (artifact.type === 'task') { Icon = StickyNote; Label = "Task"; gradientClass = "from-brand-green/20 to-brand-green/5"; iconBg = "bg-brand-green/20 text-brand-green"; }

        return (
            <div className={`flex bg-gradient-to-r ${gradientClass} backdrop-blur-sm p-4 rounded-2xl border border-white/50 mb-2 gap-4 items-center group hover:scale-[1.02] transition-all duration-300 w-full max-w-sm cursor-pointer shadow-sm hover:shadow-md`}>
                <div className={`p-3 rounded-xl ${iconBg} transition-colors`}>
                    <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-brand-dark truncate">{artifact.content.title || Label}</div>
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{Label}</div>
                </div>
                <button
                    onClick={() => openArtifact(artifact)}
                    className="p-2 rounded-xl hover:bg-white/80 text-slate-400 hover:text-brand-dark transition-all"
                    title="View details"
                >
                    <ArrowRight size={18} />
                </button>
            </div>
        );
    };


    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-softBlue/30 relative">
            {/* Left Navigation Panel */}
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

            {/* Left Panel Expand Trigger */}
            {!leftPanelOpen && (
                <button
                    onClick={() => setLeftPanelOpen(true)}
                    className="fixed left-28 top-1/2 -translate-y-1/2 ml-2 bg-white/90 backdrop-blur-md p-2.5 rounded-r-xl shadow-lg border border-white/50 text-brand-green hover:scale-110 hover:bg-white transition-all z-30"
                    title="Show Chat History"
                >
                    <ChevronRight size={20} />
                </button>
            )}

            {/* Main Layout Container */}
            <div className={`
                flex-1 flex min-w-0 transition-all duration-500 ease-out
                ${leftPanelOpen ? 'ml-[26rem]' : 'ml-[8rem]'}
            `}>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-full relative min-w-0 transition-all duration-300">

                    {/* Scrollable Feed */}
                    <div className="flex-1 overflow-y-auto p-8 pb-40" ref={chatFeedRef}>
                        {messages.length === 0 ? (
                            /* Zero State - Welcome Screen */
                            <div className="h-full flex flex-col items-center justify-center -mt-16">
                                {/* Animated Background Orb */}
                                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-r from-brand-green/10 via-brand-peach/10 to-brand-softBlue/20 rounded-full blur-3xl opacity-60 animate-pulse pointer-events-none" />

                                <div className="relative z-10 text-center">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-white/50 mb-6">
                                        <Sparkles size={16} className="text-brand-green" />
                                        <span className="text-sm font-semibold text-slate-600">Powered by AI</span>
                                    </div>

                                    <h1 className="text-4xl md:text-5xl font-black text-brand-dark mb-3 tracking-tight">
                                        How can I help you today?
                                    </h1>
                                    <p className="text-slate-500 mb-12 text-lg">
                                        I can help you prepare for JLPT or practice conversation.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
                                        {EXAMPLE_SUGGESTIONS.map((item, idx) => {
                                            const IconComp = item.icon;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => setInputValue(item.title + " ")}
                                                    className={`${styles.suggestionCard} p-5 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 hover:border-brand-green/30 text-left group`}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-2.5 rounded-xl bg-brand-green/10 text-brand-green group-hover:bg-brand-green group-hover:text-white transition-colors relative overflow-hidden">
                                                            {/* Custom Asset Override if present */}
                                                            {item.asset ? (
                                                                <Image
                                                                    src={item.asset}
                                                                    alt={item.title}
                                                                    width={24}
                                                                    height={24}
                                                                    className="object-contain relative z-10"
                                                                />
                                                            ) : (
                                                                <IconComp size={20} className="relative z-10" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-700 group-hover:text-brand-dark transition-colors">{item.title}</div>
                                                            <div className="text-sm text-slate-400 mt-1">{item.subtitle}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Message List */
                            <div className="max-w-4xl mx-auto flex flex-col gap-6">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`${styles.message} ${msg.role === 'user' ? styles.user : styles.ai}`}>
                                        {/* Avatar */}
                                        <div className={`${styles.messageAvatar} overflow-hidden`}>
                                            {msg.role === 'user' ? (
                                                <Image
                                                    src="/img/user.png"
                                                    alt="User"
                                                    width={40}
                                                    height={40}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                // Check if AI assets exist, otherwise default to emoji/icon
                                                <span className="text-xl">🌸</span>
                                            )}
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

                                {/* Typing Indicator */}
                                {isProcessing && (
                                    <div className={`${styles.message} ${styles.ai}`}>
                                        <div className={styles.messageAvatar}>🌸</div>
                                        <div className={`${styles.messageContent} flex items-center gap-1.5 py-4`}>
                                            <span className={styles.typingDot} />
                                            <span className={styles.typingDot} />
                                            <span className={styles.typingDot} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Composer */}
                    <div className="absolute bottom-6 left-6 right-6 max-w-4xl mx-auto w-full z-10">
                        <div className={`${styles.composer} rounded-2xl p-2 flex items-end gap-2 relative`}>
                            <button className="p-3 text-slate-400 hover:text-brand-green hover:bg-brand-green/10 rounded-xl transition-all">
                                <Paperclip size={20} />
                            </button>
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Message Hanachan..."
                                className="flex-1 bg-transparent border-none outline-none py-3 px-2 text-brand-dark min-h-[50px] max-h-[150px] resize-none placeholder:text-slate-400"
                                rows={1}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!inputValue.trim() && !isProcessing}
                                className={`
                                    ${styles.sendButton} p-3 rounded-xl flex items-center justify-center
                                    ${inputValue.trim()
                                        ? 'bg-gradient-to-r from-brand-green to-emerald-500 text-white shadow-lg'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                                `}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                        <div className="text-center mt-3 text-xs text-slate-400">
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
            </div>
        </div>
    );
}
