"use client";
import React, { useState, useRef } from "react";

// Demo data for initial messages
const DEMO_CONVO = [
  { id: 1, role: "ai", text: "こんにちは！今日は何を学びたいですか？" },
  { id: 2, role: "user", text: "N3文法を学びたいです。おすすめを教えて！" },
  { id: 3, role: "ai", text: "N3必須文法では「〜なければならない」、「〜ようにする」などがあります。どれから始めたいですか？" },
];
const ALL_TAGS = ["Grammar", "Vocabulary", "JLPT N3", "JLPT N2", "Conversation"];

export default function AITutor() {
  const [messages, setMessages] = useState(DEMO_CONVO);
  const [input, setInput] = useState("");
  const [uploads, setUploads] = useState<any[]>([]); // [{name, id, type}]
  const [noteIds, setNoteIds] = useState<number[]>([3]);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string>("");

  // Demo file upload logic
  const inputRef = useRef<HTMLInputElement>(null);
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setUploads(u => [
      ...u,
      ...files.map((f, i) => ({
        id: Date.now() + i,
        name: f.name,
        type: f.type.split("/")[0] || "file"
      }))
    ]);
    // reset input
    if (inputRef.current) inputRef.current.value = "";
  }
  function removeUpload(id: number) {
    setUploads(u => u.filter(f => f.id !== id));
  }

  // Save to notes
  function toggleNote(id: number) {
    setNoteIds(n => n.includes(id) ? n.filter(x => x !== id) : [...n, id]);
  }

  // Filter/search logic (synthetic)
  const filtered = messages.filter(m =>
    (!query || m.text.toLowerCase().includes(query.toLowerCase())) &&
    (!tag || (tag === "JLPT N3" && m.text.includes("N3")) || (tag && m.text.includes(tag)))
  );

  // Animation (simple fade for uploads)

  return (
    <div className="max-w-xl mx-auto w-full flex flex-col gap-4">
      <h2 className="text-2xl font-bold mb-2">AI Tutor</h2>
      {/* Tag search/filter bar */}
      <div className="flex flex-wrap gap-2 mb-1">
        <input
          type="text"
          placeholder="Search conversation…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="px-2 py-1 border rounded"
        />
        <select
          className="border px-2 py-1 rounded"
          value={tag}
          onChange={e => setTag(e.target.value)}
        >
          <option value="">All Tags</option>
          {ALL_TAGS.map(t => <option value={t} key={t}>{t}</option>)}
        </select>
      </div>
      {/* Conversation area */}
      <div className="flex-1 overflow-auto bg-white/80 rounded border p-3 h-64 flex flex-col gap-2">
        {filtered.map(m => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`rounded-lg px-3 py-2 w-fit shadow transition-all flex items-center gap-2 ${m.role === "ai" ? "bg-indigo-100 text-gray-900 border-l-4 border-indigo-400" : "bg-indigo-500 text-white border-r-4 border-indigo-300"}`}>
              <span>{m.text}</span>
              <button
                className={`ml-1 text-xs ${noteIds.includes(m.id) ? "text-yellow-500" : "text-gray-400 hover:text-yellow-500"}`}
                aria-label="Save to notes"
                onClick={() => toggleNote(m.id)}
              >★</button>
            </div>
          </div>
        ))}
      </div>
      {/* Upload chips/cards */}
      {uploads.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center mt-2 mb-1 animate-fade-in">
          {uploads.map(f => (
            <span key={f.id} className="bg-gray-200 rounded-lg px-3 py-1 text-xs font-semibold flex items-center gap-1 animate-fade-in">
              <span>{f.type === "image" ? "🖼️" : f.type === "pdf" ? "📄" : "📎"} {f.name}</span>
              <button onClick={() => removeUpload(f.id)} className="ml-1 text-gray-700/60 hover:text-red-600 font-bold">×</button>
            </span>
          ))}
        </div>
      )}
      {/* Chat input and file upload */}
      <form className="w-full flex gap-2 items-center mt-1" onSubmit={e => { e.preventDefault(); if (!input) return; setMessages(m => [...m, { id: Date.now(), role: "user", text: input }]); setInput(""); }}>
        <button type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded px-3 py-2 bg-gray-200 hover:bg-indigo-100 text-lg transition"
          aria-label="Upload file"
        >+</button>
        <input
          ref={inputRef}
          multiple
          type="file"
          onChange={handleFile}
          className="hidden"
        />
        <input
          className="w-full border rounded px-2 py-2 shadow-sm"
          placeholder="Type a message…"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button type="submit" className="bg-indigo-500 text-white rounded px-4 py-1 font-semibold">Send</button>
      </form>
      {/* Notes area */}
      <div className="mt-2">
        <div className="font-semibold text-gray-800 mb-1">Personal Notes</div>
        <ul className="list-disc ml-6 text-gray-700">
          {messages.filter(m => noteIds.includes(m.id)).map(m => <li key={m.id}>{m.text}</li>)}
        </ul>
        {!noteIds.length && <div className="text-xs text-gray-400">(No notes saved yet. Click ★ on a chat message to save as a note.)</div>}
      </div>
    </div>
  );
}
