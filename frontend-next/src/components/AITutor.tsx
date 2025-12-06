"use client";
import React, { useState, useEffect } from "react";
import { Conversation, Message, Resource } from "@/types/aiTutorTypes";
import { aiTutorService } from "@/services/aiTutorService";

// Components
import { ChatSidebar } from "./ai-tutor/ChatSidebar";
import { ResourcesSidebar } from "./ai-tutor/ResourcesSidebar";
import { ChatArea } from "./ai-tutor/ChatArea";

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

  // Initial Load
  // Initial Load handled by specific effects below

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

  // Handle mobile responsive layout defaults
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
        setResourcesOpen(false);
      } else {
        setSidebarOpen(true);
        setResourcesOpen(true);
      }
    };

    // Set initial state based on width
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Data Loading
  const loadConversations = React.useCallback(async () => {
    try {
      const data = await aiTutorService.getConversations(searchQuery, tagFilter);
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations", error);
    }
  }, [searchQuery, tagFilter]);

  const loadResources = React.useCallback(async () => {
    try {
      const data = await aiTutorService.getResources();
      setResources(data);
    } catch (error) {
      console.error("Failed to load resources", error);
    }
  }, []);

  // Initial Load & Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversations();
    }, 500);
    return () => clearTimeout(timer);
  }, [loadConversations]);

  // Initial Resource Load
  useEffect(() => {
    loadResources();
  }, [loadResources]);

  // Actions
  const handleNewConversation = async () => {
    // Check if there's already an empty conversation (local only/transient)
    const existingEmpty = conversations.find(c => (!c.messages || c.messages.length === 0));

    if (existingEmpty) {
      setActiveConvoId(existingEmpty._id);
      if (window.innerWidth < 1024) setSidebarOpen(false);
      return;
    }

    try {
      const newConvo = await aiTutorService.createConversation("New Conversation");
      setConversations([newConvo, ...conversations]);
      setActiveConvoId(newConvo._id);
      // Close sidebar on mobile after creating
      if (window.innerWidth < 1024) setSidebarOpen(false);
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
      // Construct context from selected resources
      let context = "";
      if (selectedResources.length > 0) {
        const attached = resources.filter(r => selectedResources.includes(r._id));
        context = "\n\n[Attached Resources]:\n" + attached.map(r => `- ${r.title} (${r.type}): ${r.content}`).join("\n");
        setSelectedResources([]); // Clear selection
      }
      const fullQuery = input + context;
      setInput("");

      // Create conversation with initial message
      const newConvo = await aiTutorService.createConversation("New Chat", fullQuery);
      setConversations([newConvo, ...conversations]);
      setActiveConvoId(newConvo._id);

      // Stream response
      try {
        await streamResponse(newConvo._id, fullQuery);
      } catch (error) {
        console.error("Error streaming response", error);
      }
    } else {
      await sendMessageToId(activeConvoId, input);
    }
  };

  const sendMessageToId = async (convoId: string, text: string) => {
    const userMsgText = text;
    setInput("");

    // Construct context from selected resources
    let context = "";
    if (selectedResources.length > 0) {
      const attached = resources.filter(r => selectedResources.includes(r._id));
      context = "\n\n[Attached Resources]:\n" + attached.map(r => `- ${r.title} (${r.type}): ${r.content}`).join("\n");
      setSelectedResources([]); // Clear selection
    }

    const fullQuery = userMsgText + context;

    // Optimistic update
    const tempUserMsg: Message = { id: Date.now().toString(), role: 'user', text: fullQuery };
    setMessages(prev => [...prev, tempUserMsg]);

    // Update conversations state
    setConversations(prev => prev.map(c =>
      c._id === convoId
        ? { ...c, messages: [...(c.messages || []), tempUserMsg], updated_at: Date.now() }
        : c
    ));

    try {
      // Save user message to backend
      await aiTutorService.addMessage(convoId, 'user', fullQuery);
      await streamResponse(convoId, fullQuery);
    } catch (error) {
      console.error("Error sending message", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: "Error: Failed to get response." }]);
    }
  };

  const streamResponse = async (convoId: string, query: string) => {
    try {
      setIsStreaming(true);
      const reader = await aiTutorService.streamChat(query, isThinking);

      let aiText = "";
      const aiMsgId = (Date.now() + 1).toString();

      // Add placeholder AI message
      const aiMsg: Message = { id: aiMsgId, role: 'ai', text: "" };
      setMessages(prev => [...prev, aiMsg]);

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
      const finalAiMsg = await aiTutorService.addMessage(convoId, 'ai', aiText);

      // Update conversations state with AI message
      setConversations(prev => prev.map(c =>
        c._id === convoId
          ? { ...c, messages: [...(c.messages || []), finalAiMsg], updated_at: Date.now() }
          : c
      ));

    } catch (error) {
      throw error;
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

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-brand-cream dark:bg-gray-900 overflow-hidden font-sans relative">

      {/* Left Sidebar - Fixed Width on Desktop */}
      <div className={`
        ${sidebarOpen ? 'w-72 lg:w-80' : 'w-0'}
        flex-shrink-0 transition-all duration-300 ease-in-out border-r-2 border-brand-dark bg-brand-cream
        lg:block absolute inset-y-0 left-0 z-30 lg:static
      `}>
        <ChatSidebar
          conversations={conversations}
          activeConvoId={activeConvoId}
          setActiveConvoId={setActiveConvoId}
          onNewChat={handleNewConversation}
          onDeleteChat={handleDeleteConversation}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          tagFilter={tagFilter}
          setTagFilter={setTagFilter}
          isOpen={true} // Always "open" visually inside the container, visibility controlled by parent width
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Chat Area - Flexible Width */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        <ChatArea
          activeConvo={conversations.find(c => c._id === activeConvoId)}
          messages={messages}
          input={input}
          setInput={setInput}
          isThinking={isThinking}
          setIsThinking={setIsThinking}
          isStreaming={isStreaming}
          resources={resources}
          selectedResources={selectedResources}
          setSelectedResources={setSelectedResources}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          resourcesOpen={resourcesOpen}
          setResourcesOpen={setResourcesOpen}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* Right Resources Panel - Toggleable */}
      <div className={`
        ${resourcesOpen ? 'w-80' : 'w-0'}
        flex-shrink-0 transition-all duration-300 ease-in-out border-l-2 border-brand-dark bg-brand-cream
        absolute inset-y-0 right-0 z-30 lg:static overflow-hidden
      `}>
        <ResourcesSidebar
          resources={resources}
          selectedResources={selectedResources}
          newResType={newResType}
          setNewResType={setNewResType}
          newResTitle={newResTitle}
          setNewResTitle={setNewResTitle}
          newResContent={newResContent}
          setNewResContent={setNewResContent}
          onCreateResource={handleCreateResource}
          onDeleteResource={handleDeleteResource}
          onToggleSelectResource={(id) => setSelectedResources(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
          onFileUpload={handleFileUpload}
          isOpen={true} // Controlled by parent width
          onClose={() => setResourcesOpen(false)}
        />
      </div>

      {/* Mobile Overlay for Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Overlay for Resources */}
      {resourcesOpen && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setResourcesOpen(false)}
        />
      )}

    </div>
  );
}
