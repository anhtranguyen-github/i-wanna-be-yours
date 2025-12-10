"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./Chat.module.css";
import {
    Send, Paperclip, Library, User as UserIcon, MessageCircle
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import ChatNavigationPanel from "./ChatNavigationPanel";
import { Message, Conversation, Resource, Artifact, Task, Suggestion } from "@/types/chat";

// --- Helper Components for Artifacts ---
// Keeping these local for now to preserve functionality
const TaskArtifact = ({ content }: { content: any }) => {
    const [checked, setChecked] = useState(false);
    return (
        <div className="flex bg-white p-3 rounded-xl shadow-sm border border-slate-100 mb-2 gap-3 items-start hover:shadow-md transition-all">
            <div
                className="cursor-pointer mt-1"
                onClick={() => setChecked(!checked)}
            >
                {checked ? (
                    <div className="w-5 h-5 rounded-full bg-brand-emerald text-white flex items-center justify-center font-bold text-xs">✓</div>
                ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
            </div>
            <div className="flex flex-col">
                <div className={`font-medium text-brand-dark ${checked ? 'line-through text-slate-400' : ''}`}>{content.title}</div>
                <div className="text-xs text-slate-500">{content.prompt || ''}</div>
            </div>
        </div>
    );
};

const MindmapArtifact = ({ content }: { content: any }) => {
    const renderNode = (node: any) => (
        <div key={node.id || Math.random()} style={{ marginLeft: '1rem' }}>
            <div className="inline-block bg-brand-sky/10 text-brand-dark px-2 py-1 rounded border border-brand-sky/20 mb-1 text-sm">{node.label || node.text}</div>
            {node.children && node.children.map(renderNode)}
        </div>
    );
    const root = content.root || (content.nodes ? { children: content.nodes } : null);
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 overflow-auto">
            <h3 className="text-sm font-bold mb-2 text-brand-dark uppercase tracking-wider">{content.title || "Mindmap"}</h3>
            {root ? renderNode(root) : <div>Invalid Mindmap Data</div>}
        </div>
    );
};

const FlashcardArtifact = ({ content }: { content: any }) => {
    const [flipped, setFlipped] = useState(false);
    return (
        <div className="flex flex-col items-center">
            <div className="cursor-pointer w-64 h-40 group perspective-1000" onClick={() => setFlipped(!flipped)}>
                <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
                    {/* Front */}
                    <div className="absolute w-full h-full bg-white rounded-xl shadow-clay flex flex-col items-center justify-center p-4 backface-hidden border-2 border-white group-hover:-translate-y-1 transition-transform">
                        <div className="text-center font-bold text-lg text-brand-dark">{content.front}</div>
                        <div className="absolute bottom-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Question</div>
                    </div>
                    {/* Back */}
                    <div className="absolute w-full h-full bg-brand-salmon rounded-xl shadow-clay flex flex-col items-center justify-center p-4 backface-hidden border-2 border-white rotate-y-180 text-white">
                        <div className="text-center font-bold text-lg">{content.back}</div>
                        <div className="absolute bottom-2 text-[10px] text-white/80 font-bold uppercase tracking-widest">Answer</div>
                    </div>
                </div>
            </div>
            <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-brand-sky/20 hover:text-brand-sky text-slate-500 rounded-full text-xs font-bold transition-all" onClick={(e) => { e.stopPropagation(); alert('Saved!'); }}>
                <Library size={14} />
                <span>Save to Library</span>
            </button>
        </div>
    );
};

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
    };

    const sendMessage = async () => {
        if (!inputValue.trim() && !isProcessing) return;

        const userMsg: Message = { role: "user", content: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsProcessing(true);

        // Simulate AI response for now (or connect to backend if available)
        setTimeout(() => {
            const aiMsg: Message = {
                role: "ai",
                content: "I'm a simplified AI mock for this generic chat UI redesign. I see you said: " + userMsg.content
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsProcessing(false);
        }, 1000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 relative">
            {/* 
                MERGED SIDEBAR NAV:
                Fixed at left-32 (8rem). 
                Layout.tsx has ml-32 content area.
                So this component render starts at 8rem.
                We place a fixed panel relative to viewport (left-32), 
                and push *our* content over.
            */}
            <ChatNavigationPanel
                history={history}
                resources={resources}
                activeSessionId={sessionId}
                onNewChat={startNewChat}
                onSelectConversation={loadConversation}
                onSelectResource={(r) => console.log(r)}
            />

            {/* Main Content Area */}
            {/* ml-[19rem] = 72 (Panel Width) + 4 (Gap) approx. Panel is w-72 (18rem). */}
            <div className="flex-1 flex flex-col h-full relative ml-[19rem] transition-all duration-300">

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

                                        {/* Artifacts */}
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="mt-4 flex flex-col gap-4">
                                                {msg.attachments.map((art, aIdx) => {
                                                    if (art.type === 'task') return <TaskArtifact key={aIdx} content={art.content} />;
                                                    if (art.type === 'mindmap') return <MindmapArtifact key={aIdx} content={art.content} />;
                                                    if (art.type === 'flashcard') return <FlashcardArtifact key={aIdx} content={art.content} />;
                                                    return null;
                                                })}
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
                <div className="absolute bottom-8 left-8 right-8 max-w-4xl mx-auto w-full">
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-clay border border-white p-2 flex items-end gap-2 relative">
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
        </div>
    );
}
