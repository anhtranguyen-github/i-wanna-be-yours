"use client";
import React, { useState, useRef } from "react";

const DEMO_TASKS = [
  { key: 1, name: "Summarize Text", tags: ["Grammar", "Summary"], description: "Summarize any Japanese passage into easy language." },
  { key: 2, name: "Vocabulary Builder", tags: ["Vocabulary", "List"], description: "Build a vocabulary list from your pasted text or files." },
  { key: 3, name: "Grammar Checker", tags: ["Grammar", "Error Checking"], description: "Check a sentence for grammar mistakes and explanations." },
];

const ALL_TAGS = ["Grammar","Vocabulary","Translation","JLPT","Summary"];

export default function AutoTask() {
  const [tasks, setTasks] = useState(DEMO_TASKS);
  const [modalTask, setModalTask] = useState<any>(null); // task being run
  const [runInput, setRunInput] = useState("");
  const [runUploads, setRunUploads] = useState<any[]>([]);
  const [runResult, setRunResult] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  // Add Task Modal
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addTags, setAddTags] = useState<string[]>([]);
  function addTask() {
    if (!addName) return;
    setTasks(ts => [...ts, { key: Date.now(), name: addName, tags: addTags, description: addDesc }]);
    setShowAdd(false); setAddName(""); setAddDesc(""); setAddTags([]);
  }
  function openTask(t: any) {
    setModalTask(t);
    setRunInput("");
    setRunUploads([]);
    setRunResult(null);
  }
  function closeTask() { setModalTask(null); }

  // Demo: Run a task (simulate output)
  function runTask() {
    setRunResult(`**Sample Result:**\n\n${modalTask.name} completed.\n\n- Tags: ${modalTask.tags.join(", ")}\n- Input: ${runInput}\n- Files: ${runUploads.map(f=>f.name).join(", ")}`)
  }
  // Upload logic
  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setRunUploads(u => [
      ...u,
      ...files.map((f,i) => ({ id: Date.now()+i, name: f.name, type: f.type.split("/")[0]||"file" }))
    ]);
    uploadInputRef.current && (uploadInputRef.current.value = "");
  }
  function removeUpload(id: number) {
    setRunUploads(u => u.filter(f => f.id !== id));
  }
  // Add Task tag toggles
  function toggleAddTag(t: string) {
    setAddTags(b => b.includes(t) ? b.filter(_=>_!==t) : [...b, t]);
  }

  return <div className="max-w-2xl mx-auto w-full">
    <h2 className="text-2xl font-bold mb-4">Auto Task</h2>
    <div className="flex flex-wrap gap-4 mb-6">
      {tasks.map(t => (
        <div key={t.key} className="shadow-lg bg-white rounded px-5 py-4 w-[270px] min-h-[130px] flex flex-col justify-between border border-indigo-100 hover:shadow-indigo-200 transition cursor-pointer" onClick={() => openTask(t)}>
          <div>
            <div className="font-semibold text-lg">{t.name}</div>
            <div className="text-gray-500 text-sm mb-2">{t.description}</div>
            <div className="flex gap-1 flex-wrap mt-1">{t.tags.map(tag => <span key={tag} className="bg-indigo-50 text-indigo-500 px-2 py-0.5 text-xs rounded">{tag}</span>)}</div>
          </div>
        </div>
      ))}
      {/* Add Task card */}
      <div className="border-dashed border-2 border-indigo-300 rounded flex flex-col justify-center items-center w-[160px] min-h-[90px] text-indigo-400 hover:bg-indigo-50 cursor-pointer transition" onClick={()=>setShowAdd(true)}>
        <span className="text-3xl">+</span>
        <span className="font-semibold">Add Task</span>
      </div>
    </div>
    {/* Task Modal */}
    {modalTask && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
        <div className="bg-white rounded shadow-lg max-w-lg w-full p-6 relative animate-fade-in">
          <button className="absolute right-3 top-3 text-gray-400 hover:text-red-500 text-xl font-bold" onClick={closeTask}>×</button>
          <div className="text-xl font-bold mb-2">{modalTask.name}</div>
          <div className="mb-1 text-gray-700 text-sm">{modalTask.description}</div>
          <div className="flex flex-col gap-3 mt-3">
            <textarea className="border px-2 py-1 rounded" rows={3} value={runInput} onChange={e=>setRunInput(e.target.value)} placeholder="Instructions, text, or notes…"/>
            {/* uploads */}
            <div>
              <button type="button" onClick={()=>uploadInputRef.current?.click()} className="px-3 py-1 bg-gray-100 rounded hover:bg-indigo-50 mr-2">Upload +</button>
              <input multiple type="file" ref={uploadInputRef} className="hidden" onChange={handleUpload}/>
              <div className="flex flex-wrap gap-2 mt-2">
                {runUploads.map(f => (
                  <span key={f.id} className="bg-gray-200 rounded-lg px-3 py-1 text-xs font-semibold flex items-center gap-1">
                    <span>{f.type === "image" ? "🖼️" : f.type === "pdf" ? "📄" : "📎"} {f.name}</span>
                    <button onClick={()=>removeUpload(f.id)} className="ml-1 text-gray-700/60 hover:text-red-600 font-bold">×</button>
                  </span>
                ))}
              </div>
            </div>
            <button onClick={runTask} className="px-5 py-2 rounded bg-indigo-500 text-white font-bold mt-2">Run Task</button>
            {runResult && <div className="bg-indigo-50 rounded border p-3 mt-2 whitespace-pre-line"><b>AI Output:</b><br/>{runResult}</div>}
          </div>
        </div>
      </div>
    )}
    {/* Add Task Modal */}
    {showAdd && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
        <div className="bg-white rounded shadow-lg max-w-md w-full p-6 relative animate-fade-in">
          <button className="absolute right-3 top-3 text-gray-400 hover:text-red-500 text-xl font-bold" onClick={()=>setShowAdd(false)}>×</button>
          <div className="text-lg font-bold mb-2">Add New Task</div>
          <input className="w-full border rounded px-2 py-1 my-2" value={addName} onChange={e=>setAddName(e.target.value)} placeholder="Task Name"/>
          <input className="w-full border rounded px-2 py-1 my-2" value={addDesc} onChange={e=>setAddDesc(e.target.value)} placeholder="Description"/>
          <div className="flex gap-2 flex-wrap mb-3">
            {ALL_TAGS.map(t => <button key={t} onClick={()=>toggleAddTag(t)} className={`px-2 py-0.5 rounded border text-xs ${addTags.includes(t)?"bg-indigo-500 text-white border-indigo-500":"bg-gray-100 text-gray-500 border-gray-300"}`}>{t}</button>)}
          </div>
          <button onClick={addTask} className="w-full py-2 rounded bg-indigo-500 text-white font-bold">Add Task</button>
        </div>
      </div>
    )}
  </div>
}
