"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./Chat.module.css";
import {
    MessageCircle, Wrench, Gamepad2, Library, Lightbulb, LogOut, User as UserIcon,
    Plus, ChevronRight, ChevronDown, CheckCircle, Search, FileText, Send,
    Paperclip, Menu, ArrowRight, Info, X,
    PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen
} from "lucide-react";
import ReactMarkdown from "react-markdown";

// --- Types ---
interface Artifact {
    id?: string;
    type: "mindmap" | "flashcard" | "vocabulary" | "analysis" | "document" | "image" | "file" | "task";
    content: any; // Content structure varies by type
    title?: string;
}

interface Task {
    id?: string;
    title: string;
    description: string;
    status?: "pending" | "completed";
}

interface Suggestion {
    text: string;
}

interface Message {
    role: "user" | "ai" | "assistant";
    content: string;
    attachments?: Artifact[];
    tasks?: Task[];
    suggestions?: Suggestion[];
}

interface Conversation {
    id: string;
    title: string;
}

interface Resource {
    id: string;
    title: string;
    type?: string;
    content?: string;
}



const BACKEND_URL = "http://localhost:5400";

// --- Helper Components for Artifacts ---

const TaskArtifact = ({ content }: { content: any }) => {
    const [checked, setChecked] = useState(false);
    return (
        <div className={styles.rsTaskItem}>
            <div
                className={styles.rsTaskCheck}
                onClick={() => setChecked(!checked)}
                style={{ display: 'flex', alignItems: 'center' }}
            >
                {checked ? <CheckCircle size={20} color="#10b981" /> : <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid gray' }} />}
            </div>
            <div className="flex flex-col ml-2">
                <div style={{ fontWeight: 500 }}>{content.title}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{content.prompt || ''}</div>
            </div>
        </div>
    );
};

const MindmapArtifact = ({ content }: { content: any }) => {
    // Basic recursion to render nodes
    const renderNode = (node: any) => (
        <div key={node.id || Math.random()} style={{ marginLeft: '1rem' }}>
            <div className={styles.mindmapNode}>{node.label || node.text}</div>
            {node.children && node.children.map(renderNode)}
        </div>
    );
    // Handle both direct node list or root node structure from backend
    const root = content.root || (content.nodes ? { children: content.nodes } : null);

    return (
        <div className={styles.mindmapContainer}>
            <h3 className="text-lg font-bold mb-2">{content.title || "Mindmap"}</h3>
            {root ? renderNode(root) : <div>Invalid Mindmap Data</div>}
        </div>
    );
};

const FlashcardArtifact = ({ content }: { content: any }) => {
    const [flipped, setFlipped] = useState(false);
    return (
        <div className="flex flex-col items-center">
            <div className={styles.flashcardContainer} onClick={() => setFlipped(!flipped)}>
                <div className={`${styles.flashcard} ${flipped ? styles.flipped : ''}`}>
                    <div className={styles.flashcardContent}>
                        {flipped ? content.back : content.front}
                    </div>
                    <div className={styles.flashcardLabel}>
                        {flipped ? "Answer" : "Question"}
                        <span style={{ fontSize: '0.6em', marginLeft: '8px' }}>(Click to flip)</span>
                    </div>
                </div>
            </div>
            <div className={styles.artifactActions}>
                <button className={styles.btnAction} onClick={() => alert("Saved to Library!")}>
                    <Library size={16} />
                    <span>Save to Library</span>
                </button>
            </div>
        </div>
    );
};

const VocabularyArtifact = ({ content }: { content: any }) => (
    <div className="flex flex-col">
        <h3 className="text-lg font-bold mb-2">{content.title || "Vocabulary"}</h3>
        <div className="flex flex-col gap-2">
            {content.items && content.items.map((item: any, idx: number) => (
                <div key={idx} className={styles.vocabItem}>
                    <span className={styles.vocabWord}>{item.word}</span>
                    <span className={styles.vocabDef}>{item.definition}</span>
                    {item.example && <span className={styles.vocabEx}>&quot;{item.example}&quot;</span>}
                </div>
            ))}
        </div>
        <div className={styles.artifactActions}>
            <button className={styles.btnAction} onClick={() => alert("Saved Vocabulary!")}>
                <Library size={16} />
                <span>Save Vocabulary</span>
            </button>
        </div>
    </div>
);

const AnalysisArtifact = ({ content }: { content: any }) => (
    <div className="prose prose-invert prose-sm max-w-none p-2 bg-white/5 rounded">
        <ReactMarkdown>{typeof content === 'string' ? content : JSON.stringify(content)}</ReactMarkdown>
    </div>
);


export default function ChatInterface() {
    // --- State ---
    const [userId] = useState("user-default");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [history, setHistory] = useState<Conversation[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);

    const [inputValue, setInputValue] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Sidebar States
    const [showHistory, setShowHistory] = useState(true);
    const [showResources, setShowResources] = useState(false);
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

    // Resource Tray (Pending Uploads)
    interface TrayResource extends Resource { isNew?: boolean; content?: any; }
    const [trayResources, setTrayResources] = useState<TrayResource[]>([]);

    // Artifact View State
    const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

    const chatFeedRef = useRef<HTMLDivElement>(null);



    // --- API Interactions ---
    const loadHistory = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/conversations/user/${userId}`);
            const data = await res.json();
            setHistory(data.reverse());
        } catch (err) {
            console.error("Failed to load history", err);
        }
    };

    const loadConversation = async (id: string) => {
        setSessionId(id);
        setMessages([]);
        setArtifacts([]);
        setSelectedArtifact(null);
        setRightSidebarOpen(false);

        try {
            const res = await fetch(`${BACKEND_URL}/conversations/${id}`);
            const data = await res.json();

            const msgs: Message[] = data.history.map((m: any) => ({
                role: m.role,
                content: m.content,
                attachments: m.artifacts // Historical artifacts attached to message
            }));
            setMessages(msgs);

            // Collect all artifacts from history
            const allArtifacts: Artifact[] = [];
            data.history.forEach((m: any) => {
                if (m.artifacts && Array.isArray(m.artifacts)) {
                    allArtifacts.push(...m.artifacts);
                }
            });
            setArtifacts(allArtifacts);

        } catch (err) {
            console.error("Failed to load conversation", err);
        }
    };

    const searchResources = async (query: string) => {
        try {
            const res = await fetch(`${BACKEND_URL}/resources/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setResources(data);
        } catch (err) {
            console.error("Failed search resources", err);
        }
    };

    // --- Effects ---
    useEffect(() => {
        loadHistory();
        searchResources("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (chatFeedRef.current) {
            chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (overrideContent?: string) => {
        const content = overrideContent || inputValue.trim();
        if (!content || isProcessing) return;

        setInputValue("");
        setIsProcessing(true);

        // Optimistic User Message
        const newMsg: Message = { role: "user", content, attachments: trayResources as any[] };
        setMessages(prev => [...prev, newMsg]);

        const currentTray = [...trayResources];
        setTrayResources([]); // Clear tray

        try {
            // 1. Upload Pending Resources
            const validResourceIds: string[] = [];
            for (const res of currentTray) {
                if (res.isNew) {
                    const uploadRes = await fetch(`${BACKEND_URL}/resources/`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            title: res.title,
                            type: res.type,
                            content: res.content
                        })
                    });
                    const data = await uploadRes.json();
                    validResourceIds.push(data.id);
                } else {
                    validResourceIds.push(res.id);
                }
            }

            // 2. Ensure Session
            let currentSessionId = sessionId;
            if (!currentSessionId) {
                const sessionRes = await fetch(`${BACKEND_URL}/conversations/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: userId,
                        title: content.substring(0, 30)
                    })
                });
                const sessionData = await sessionRes.json();
                currentSessionId = sessionData.id;
                setSessionId(currentSessionId);
                loadHistory();
            }

            // 3. Post User Message
            await fetch(`${BACKEND_URL}/conversations/${currentSessionId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: 'user',
                    content: content,
                    attachmentIds: validResourceIds
                })
            });

            // 4. Invoke Agent
            const invokeRes = await fetch(`${BACKEND_URL}/agent/invoke`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: `sess-${currentSessionId}`,
                    user_id: userId,
                    prompt: content,
                    context_config: {
                        resource_ids: validResourceIds
                    }
                })
            });
            const invokeData = await invokeRes.json();

            // 5. Parse Response
            let aiText = "";
            let newArtifacts: Artifact[] = [];

            if (invokeData.responses) {
                invokeData.responses.forEach((resp: any) => {
                    if (resp.type === 'text') {
                        aiText += (typeof resp.content === 'string' ? resp.content : JSON.stringify(resp.content)) + "\n\n";
                    } else {
                        // It's an artifact
                        newArtifacts.push(resp);
                    }
                });
            }

            // Fallback text
            if (!aiText && newArtifacts.length === 0) {
                aiText = "I'm sorry, I couldn't process that request.";
            }

            // Update Artifacts State
            if (newArtifacts.length > 0) {
                setArtifacts(prev => [...prev, ...newArtifacts]);
                // Automatically open the first new artifact if sidebar is open or closed?
                // Good UX: notification in chat only, user clicks to view.
            }

            // Add AI Message with extracted tasks and suggestions
            const aiMsg: Message = {
                role: "ai",
                content: aiText,
                attachments: newArtifacts,
                tasks: invokeData.proposedTasks || [],
                suggestions: invokeData.suggestions || []
            };
            setMessages(prev => [...prev, aiMsg]);

        } catch (err) {
            console.error("Error sending message", err);
            setMessages(prev => [...prev, { role: "ai", content: "Error processing request." }]);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- handlers ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        for (const file of files) {
            let content;
            let type = 'document';
            if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
                content = await file.text();
            } else {
                content = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });
                type = file.type.startsWith('image/') ? 'image' : 'file';
            }
            setTrayResources(prev => [...prev, {
                id: `temp-${Date.now()}-${Math.random()}`,
                isNew: true,
                title: file.name,
                type,
                content
            }]);
        }
    };

    const handleViewArtifact = (art: Artifact) => {
        setSelectedArtifact(art);
        setRightSidebarOpen(true);
    };

    const handleViewSummary = async (r: Resource, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await fetch(`${BACKEND_URL}/resources/${r.id}/summary`);
            const data = await res.json();
            alert(`Summary for ${r.title}:\n\n${data.summary || "No summary available."}`);
        } catch (err) {
            alert("Failed to fetch summary.");
        }
    };

    // --- Renderers ---

    // Renders the details of an artifact in the Right Sidebar
    const renderArtifactDetail = (art: Artifact) => {
        switch (art.type) {
            case 'mindmap': return <MindmapArtifact content={art.content} />;
            case 'flashcard': return <FlashcardArtifact content={art.content} />;
            case 'vocabulary': return <VocabularyArtifact content={art.content} />;
            case 'analysis': return <AnalysisArtifact content={art.content} />;
            case 'task': return <TaskArtifact content={art.content} />;
            default:
                return (
                    <div className="p-4 bg-white/5 rounded">
                        <pre className="text-xs overflow-auto">{JSON.stringify(art.content, null, 2)}</pre>
                    </div>
                );
        }
    };


    return (
        <div className={styles.root}>
            <div className={styles.appContainer}>
                {/* Left Sidebar */}
                <aside className={`${styles.sidebar} ${!leftSidebarOpen ? styles.collapsed : ''}`}>
                    <div className={styles.sidebarHeader}>
                        <button className={styles.btnPrimaryIcon} onClick={() => { setSessionId(null); setMessages([]); setArtifacts([]); setSelectedArtifact(null); }}>
                            <Plus size={18} />
                            <span>New Chat</span>
                        </button>
                    </div>

                    <div className={styles.sidebarContent}>
                        {/* History */}
                        <div className={`${styles.accordionItem} ${showHistory ? styles.active : ''}`}>
                            <div className={styles.accordionHeader} onClick={() => setShowHistory(!showHistory)}>
                                <span>Chat History</span>
                                {showHistory ? <ChevronDown /> : <ChevronRight />}
                            </div>
                            <div className={styles.accordionBody}>
                                <div style={{ padding: '0 0.5rem 0.5rem 0.5rem' }}>
                                    <input type="text" placeholder="Search..." className={styles.searchInput} />
                                </div>
                                <div className={styles.historyContainer}>
                                    <div className={styles.groupLabel}>Today</div>
                                    {history.map(h => (
                                        <div
                                            key={h.id}
                                            className={`${styles.historyItem} ${sessionId === h.id ? styles.active : ''}`}
                                            onClick={() => loadConversation(h.id)}
                                        >
                                            {h.title || "New Conversation"}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Resources */}
                        <div className={`${styles.accordionItem} ${showResources ? styles.active : ''}`}>
                            <div className={styles.accordionHeader} onClick={() => setShowResources(!showResources)}>
                                <span>Resources</span>
                                {showResources ? <ChevronDown /> : <ChevronRight />}
                            </div>
                            <div className={styles.accordionBody}>
                                <div style={{ padding: '0 0.5rem 0.5rem 0.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className={styles.searchInput}
                                        onChange={(e) => searchResources(e.target.value)}
                                    />
                                </div>
                                <div className={styles.resourcesListContainer}>
                                    {resources.length === 0 && <div className={styles.emptyResources}>No resources found</div>}
                                    {resources.map(r => (
                                        <div key={r.id} className={styles.rsListItem} onClick={() => setTrayResources(prev => [...prev, r])}>
                                            <div className={styles.rsListInfo}>
                                                <div className={styles.rsListTitle}>{r.title}</div>
                                                <div className={styles.rsListType}>{r.type || 'Doc'}</div>
                                            </div>
                                            <Info size={14} className="text-gray-400 hover:text-white mr-2" onClick={(e) => handleViewSummary(r, e)} />
                                            <Plus size={14} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={styles.mainContent}>
                    {/* Toggles */}
                    {/* Toggles */}
                    <button
                        className={`${styles.sidebarToggleBtn} ${styles.left}`}
                        onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                        title={leftSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                    >
                        {leftSidebarOpen ? <PanelLeftClose size={24} /> : <PanelLeftOpen size={24} />}
                    </button>
                    <button
                        className={`${styles.sidebarToggleBtn} ${styles.right}`}
                        onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                        title={rightSidebarOpen ? "Collapse Artifacts" : "Expand Artifacts"}
                    >
                        {rightSidebarOpen ? <PanelRightClose size={24} /> : <PanelRightOpen size={24} />}
                    </button>

                    <div className={styles.chatFeed} ref={chatFeedRef}>
                        {messages.length === 0 ? (
                            <div className={styles.emptyState}>
                                <h1>How can I help you today?</h1>
                                <div className={styles.capabilities}>
                                    <div className={styles.capabilityCard} onClick={() => setInputValue('Draft a technical implementation plan')}>
                                        <span>Draft a plan</span>
                                    </div>
                                    <div className={styles.capabilityCard} onClick={() => setInputValue('Explain quantum computing')}>
                                        <span>Explain Quantum</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div key={idx} className={`${styles.message} ${msg.role === 'user' ? styles.user : styles.ai}`}>
                                    <div className={styles.messageAvatar}>
                                        {msg.role === 'user' ? <UserIcon size={18} /> : <MessageCircle size={18} />}
                                    </div>
                                    <div className={styles.messageContent}>
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>

                                        {/* Inline Attachments/Artifact Buttons */}
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {msg.attachments.map((att, i) => (
                                                    <button key={i} className={styles.suggestionBtn} onClick={() => handleViewArtifact(att)}>
                                                        View {att.type}: {att.title || 'Untitled'}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Rich Content: Tasks */}
                                        {msg.tasks && msg.tasks.length > 0 && (
                                            <div className={styles.richContent}>
                                                <div className={styles.taskGroup}>
                                                    <h4>Proposed Tasks</h4>
                                                    {msg.tasks.map((task, tIdx) => (
                                                        <div key={tIdx} className={styles.taskCard}>
                                                            <div className={styles.taskHeader}>
                                                                <CheckCircle size={16} className="text-amber-500" />
                                                                <span className="font-medium">{task.title}</span>
                                                            </div>
                                                            <div className={styles.taskDesc}>{task.description}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Rich Content: Suggestions */}
                                        {msg.suggestions && msg.suggestions.length > 0 && (
                                            <div className={styles.suggestionGroup}>
                                                {msg.suggestions.map((s, sIdx) => (
                                                    <button key={sIdx} className={styles.suggestionBtn} onClick={() => handleSend(s.text)}>
                                                        {s.text}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Resource Tray */}
                    {trayResources.length > 0 && (
                        <div className={styles.resourceTray}>
                            {trayResources.map((res, idx) => (
                                <div key={idx} className={styles.resourceChip}>
                                    <FileText size={14} />
                                    <span>{res.title}</span>
                                    <span style={{ cursor: 'pointer' }} onClick={() => setTrayResources(prev => prev.filter((_, i) => i !== idx))}>x</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Composer */}
                    <div className={styles.composerArea}>
                        <div className={styles.composerContainer}>
                            <div className={styles.composerTools}>
                                <button className={styles.toolBtn} onClick={() => document.getElementById('file-upload-input')?.click()}>
                                    <Paperclip size={20} />
                                </button>
                                <input id="file-upload-input" type="file" multiple hidden onChange={handleFileUpload} />
                            </div>
                            <textarea
                                className={styles.messageInput}
                                placeholder="Message AI..."
                                rows={1}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                            />
                            <button className={styles.sendBtn} disabled={!inputValue.trim() || isProcessing} onClick={() => handleSend()}>
                                <Send size={18} />
                            </button>
                        </div>
                        <div className={styles.footerText}>
                            AI can make mistakes. Please verify important information.
                        </div>
                    </div>
                </main>

                {/* Right Sidebar (Artifacts) */}
                <aside className={`${styles.rightSidebar} ${!rightSidebarOpen ? styles.hidden : ''}`}>
                    <div className={styles.rsHeader}>
                        <div className="flex items-center gap-2">
                            {selectedArtifact && (
                                <button className={styles.rsCloseBtn} onClick={() => setSelectedArtifact(null)}>
                                    <ArrowRight className="rotate-180" size={18} />
                                </button>
                            )}
                            <span className={styles.rsTitle}>{selectedArtifact ? selectedArtifact.type.toUpperCase() : "Artifacts"}</span>
                        </div>
                        <button className={styles.rsCloseBtn} onClick={() => setRightSidebarOpen(false)}>
                            <X size={18} />
                        </button>
                    </div>

                    <div className={styles.rsContent}>
                        {selectedArtifact ? (
                            // Detail View
                            <div className="flex flex-col h-full">
                                <h3 className="text-lg font-bold mb-4">{selectedArtifact.title || "Untitled Artifact"}</h3>
                                {renderArtifactDetail(selectedArtifact)}
                            </div>
                        ) : (
                            // List View
                            <div className="flex flex-col gap-2">
                                {artifacts.length === 0 && (
                                    <div className={styles.emptyResources}>No artifacts generated yet.</div>
                                )}
                                {artifacts.map((art, idx) => (
                                    <div key={idx} className={styles.rsListItem} onClick={() => handleViewArtifact(art)}>
                                        <div className={styles.rsListInfo}>
                                            <div className={styles.rsListTitle}>{art.title || "Untitled"}</div>
                                            <div className={styles.rsListType}>{art.type}</div>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-500" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}

