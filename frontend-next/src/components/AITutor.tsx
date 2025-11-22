"use client";
import React, { useState, useEffect, useRef } from "react";
import { aiTutorService, Conversation, Resource, Message } from "@/services/aiTutorService";
import {
  MessageSquare,
  Search,
  Plus,
  Trash2,
  FileText,
  Link as LinkIcon,
  Paperclip,
  Send,
  Menu,
  X,
  MoreVertical,
  StickyNote,
  Brain,
  ChevronDown,
  ChevronRight
} from "lucide-react";

import { AIResponseDisplay } from "@/components/AIResponseDisplay";

export default function AITutor() {
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Resource Creation State
  const [newResType, setNewResType] = useState<'note' | 'link' | 'document'>('note');
  const [newResContent, setNewResContent] = useState("");
  const [newResTitle, setNewResTitle] = useState("");
  const [selectedResources, setSelectedResources] = useState<string[]>([]); // IDs of resources to attach

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Load
  useEffect(() => {
    loadConversations();
    loadResources();
  }, []);

  // Effect to load messages when active conversation changes
  useEffect(() => {
    if (activeConvoId) {
      const convo = conversations.find(c => c._id === activeConvoId);
      if (convo) {
        setMessages(convo.messages || []);
      } else {
        // Fetch if not in list (e.g. deep link)
        aiTutorService.getConversation(activeConvoId).then(c => {
          setMessages(c.messages || []);
        });
      }
    } else {
      setMessages([]);
    }
  }, [activeConvoId, conversations]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Data Loading
  const loadConversations = async () => {
    try {
      const data = await aiTutorService.getConversations(searchQuery, tagFilter);
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations", error);
    }
  };

  const loadResources = async () => {
    try {
      const data = await aiTutorService.getResources();
      setResources(data);
    } catch (error) {
      console.error("Failed to load resources", error);
    }
  };

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversations();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, tagFilter]);

  // Actions
  const handleNewConversation = async () => {
    try {
      const newConvo = await aiTutorService.createConversation("New Conversation");
      setConversations([newConvo, ...conversations]);
      setActiveConvoId(newConvo._id);
    } catch (error) {
      console.error("Failed to create conversation", error);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await aiTutorService.deleteConversation(id);
      setConversations(conversations.filter(c => c._id !== id));
      if (activeConvoId === id) setActiveConvoId(null);
    } catch (error) {
      console.error("Failed to delete conversation", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && selectedResources.length === 0) return;
    if (!activeConvoId) {
      // Create conversation if none exists
      const newConvo = await aiTutorService.createConversation(input.slice(0, 30) + "...");
      setConversations([newConvo, ...conversations]);
      setActiveConvoId(newConvo._id);
      // Wait a bit for state to settle? No, just proceed.
      // Actually, we need the ID.
      await sendMessageToId(newConvo._id, input);
    } else {
      await sendMessageToId(activeConvoId, input);
    }
  };

  const sendMessageToId = async (convoId: string, text: string) => {
    const userMsgText = text;
    setInput("");

    // Optimistic update
    const tempUserMsg: Message = { id: Date.now().toString(), role: 'user', text: userMsgText };
    setMessages(prev => [...prev, tempUserMsg]);

    // Construct context from selected resources
    let context = "";
    if (selectedResources.length > 0) {
      const attached = resources.filter(r => selectedResources.includes(r._id));
      context = "\n\n[Attached Resources]:\n" + attached.map(r => `- ${r.title} (${r.type}): ${r.content}`).join("\n");
      setSelectedResources([]); // Clear selection
    }

    const fullQuery = userMsgText + context;

    try {
      // Save user message to backend
      await aiTutorService.addMessage(convoId, 'user', fullQuery);

      // Stream AI response
      setIsStreaming(true);
      const reader = await aiTutorService.streamChat(fullQuery, isThinking);

      let aiText = "";
      const aiMsgId = (Date.now() + 1).toString();

      // Add placeholder AI message
      setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: "" }]);

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        aiText += chunk;

        setMessages(prev => prev.map(m =>
          m.id === aiMsgId ? { ...m, text: aiText } : m
        ));
      }

      // Save AI message to backend (persistence)
      await aiTutorService.addMessage(convoId, 'ai', aiText);

    } catch (error) {
      console.error("Error sending message", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: "Error: Failed to get response." }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCreateResource = async () => {
    if (!newResTitle || !newResContent) return;
    try {
      const res = await aiTutorService.createResource(newResType, newResContent, newResTitle);
      setResources([res, ...resources]);
      setNewResTitle("");
      setNewResContent("");
      // Keep type same
    } catch (error) {
      console.error("Failed to create resource", error);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Delete this resource?")) return;
    try {
      await aiTutorService.deleteResource(id);
      setResources(resources.filter(r => r._id !== id));
    } catch (error) {
      console.error("Failed to delete resource", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = e.target.files[0];
        const res = await aiTutorService.uploadFile(file);
        setNewResContent(res.url); // Use URL as content
        setNewResTitle(file.name);
        setNewResType('document');
      } catch (error) {
        console.error("Upload failed", error);
        alert("Upload failed");
      }
    }
  };

  // Render Helpers
  const renderResourceIcon = (type: string) => {
    switch (type) {
      case 'note': return <StickyNote size={16} className="text-yellow-500" />;
      case 'link': return <LinkIcon size={16} className="text-blue-500" />;
      case 'document': return <FileText size={16} className="text-red-500" />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 overflow-hidden">

      {/* --- Left Sidebar: History --- */}
      <div className={`${sidebarOpen ? "w-64" : "w-0"} transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-bold text-lg text-gray-800 dark:text-white truncate">History</h2>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X size={20} /></button>
        </div>

        <div className="p-2">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md transition-colors"
          >
            <Plus size={18} /> New Chat
          </button>
        </div>

        <div className="px-2 pb-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-8 pr-2 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="mt-2 flex gap-1 overflow-x-auto no-scrollbar pb-1">
            {['', 'Grammar', 'Vocab', 'JLPT N3', 'Conversation'].map(tag => (
              <button
                key={tag || 'all'}
                onClick={() => setTagFilter(tag)}
                className={`text-xs px-2 py-1 rounded-full whitespace-nowrap transition-colors ${tagFilter === tag
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                  }`}
              >
                {tag || 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map(convo => (
            <div
              key={convo._id}
              onClick={() => setActiveConvoId(convo._id)}
              className={`group flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${activeConvoId === convo._id ? "bg-indigo-50 dark:bg-indigo-900/20 border-r-4 border-indigo-500" : ""}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={18} className="text-gray-500 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{convo.title}</div>
                  <div className="text-xs text-gray-500 truncate">{new Date(convo.updated_at).toLocaleDateString()}</div>
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteConversation(e, convo._id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* --- Main Chat Area --- */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <div className="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                <Menu size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
            )}
            <h1 className="font-semibold text-gray-800 dark:text-white">
              {conversations.find(c => c._id === activeConvoId)?.title || "AI Tutor"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isThinking}
                onChange={(e) => setIsThinking(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              Thinking Mode
            </label>
            {!resourcesOpen && (
              <button onClick={() => setResourcesOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                <Paperclip size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p>Start a conversation with your AI Tutor</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 shadow-sm ${msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                  }`}>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.role === 'ai' ? (
                      <AIResponseDisplay text={msg.text} />
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          {selectedResources.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedResources.map(id => {
                const r = resources.find(res => res._id === id);
                if (!r) return null;
                return (
                  <span key={id} className="flex items-center gap-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full">
                    {renderResourceIcon(r.type)}
                    <span className="truncate max-w-[100px]">{r.title}</span>
                    <button onClick={() => setSelectedResources(prev => prev.filter(x => x !== id))} className="hover:text-red-500"><X size={12} /></button>
                  </span>
                );
              })}
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={(!input.trim() && selectedResources.length === 0) || isStreaming}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>

      {/* --- Right Sidebar: Resources --- */}
      <div className={`${resourcesOpen ? "w-80" : "w-0"} transition-all duration-300 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-bold text-lg text-gray-800 dark:text-white">Resources</h2>
          <button onClick={() => setResourcesOpen(false)}><X size={20} className="text-gray-500" /></button>
        </div>

        {/* Add Resource Form */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex gap-2 mb-2">
            <button onClick={() => setNewResType('note')} className={`flex-1 py-1 text-xs rounded ${newResType === 'note' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Note</button>
            <button onClick={() => setNewResType('link')} className={`flex-1 py-1 text-xs rounded ${newResType === 'link' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Link</button>
            <button onClick={() => setNewResType('document')} className={`flex-1 py-1 text-xs rounded ${newResType === 'document' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Doc</button>
          </div>

          <input
            type="text"
            placeholder="Title"
            value={newResTitle}
            onChange={(e) => setNewResTitle(e.target.value)}
            className="w-full mb-2 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />

          {newResType === 'document' ? (
            <div className="mb-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="text-sm text-gray-500 dark:text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          ) : (
            <textarea
              placeholder={newResType === 'link' ? "https://..." : "Content..."}
              value={newResContent}
              onChange={(e) => setNewResContent(e.target.value)}
              className="w-full mb-2 px-2 py-1 text-sm border rounded h-20 resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          )}

          <button
            onClick={handleCreateResource}
            disabled={!newResTitle || !newResContent}
            className="w-full py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            Add Resource
          </button>
        </div>

        {/* Resource List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {resources.map(res => (
            <div key={res._id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 group">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  {renderResourceIcon(res.type)}
                  <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{res.title}</span>
                </div>
                <button onClick={() => handleDeleteResource(res._id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                {res.type === 'link' ? (
                  <a href={res.content} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{res.content}</a>
                ) : (
                  res.content
                )}
              </div>

              <button
                onClick={() => setSelectedResources(prev => prev.includes(res._id) ? prev.filter(x => x !== res._id) : [...prev, res._id])}
                className={`w-full py-1 text-xs rounded border transition-colors ${selectedResources.includes(res._id)
                  ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-indigo-300"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
              >
                {selectedResources.includes(res._id) ? "Attached" : "Attach to Chat"}
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
