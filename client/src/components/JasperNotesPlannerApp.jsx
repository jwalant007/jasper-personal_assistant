import React, { useState } from 'react';
import { BookOpen, Plus, CheckCircle2, Circle, Sparkles, Trash2, Layers, CheckSquare, FileText, Calendar } from 'lucide-react';
import geminiClient from '../utils/geminiClient';

export default function JasperNotesPlannerApp() {
  const [activeTab, setActiveTab] = useState('notes'); // notes, kanban
  const [notes, setNotes] = useState([
    { id: 1, title: 'JASPER OS Architecture Strategy', content: 'Dual-Boot bootloader launcher, 23 Native OS Apps, and standalone Node.js AI backend.', date: '2026-08-28' },
    { id: 2, title: 'AI Swarm Agent Targets', content: 'Autonomous browser navigation, local face biometrics, and multi-node mesh networking.', date: '2026-08-28' }
  ]);
  const [selectedNote, setSelectedNote] = useState(notes[0]);

  const [tasks, setTasks] = useState([
    { id: 101, text: 'Deploy JASPER OS 23 Native Apps', status: 'done' },
    { id: 102, text: 'Configure Dual Boot menu choice on Laptop 1', status: 'done' },
    { id: 103, text: 'Test AI Search Engine App & WebGL fallbacks', status: 'in_progress' }
  ]);
  const [newTaskText, setNewTaskText] = useState('');

  const addTask = () => {
    if (!newTaskText.trim()) return;
    setTasks(prev => [...prev, { id: Date.now(), text: newTaskText.trim(), status: 'todo' }]);
    setNewTaskText('');
  };

  const toggleTaskStatus = (id) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'done' : 'todo';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/90 text-slate-100 font-sans p-4 rounded-xl space-y-3">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between bg-cyan-950/50 border border-cyan-500/30 p-2.5 rounded-xl">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <span className="font-orbitron font-extrabold text-xs text-cyan-200 uppercase tracking-wider">JASPER Notes & Task Planner</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTab === 'notes' ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 font-bold' : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            📝 Notes Editor
          </button>
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTab === 'kanban' ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 font-bold' : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            📋 Kanban Tasks ({tasks.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'notes' ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 min-h-0">
          {/* Notes Sidebar */}
          <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-3 flex flex-col space-y-2">
            <button
              onClick={() => {
                const newN = { id: Date.now(), title: 'New Note', content: '', date: new Date().toLocaleDateString() };
                setNotes([newN, ...notes]);
                setSelectedNote(newN);
              }}
              className="w-full py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> New Note
            </button>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {notes.map(note => (
                <button
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`w-full p-2.5 rounded-lg text-left text-xs font-mono transition-all border ${
                    selectedNote?.id === note.id
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-100'
                      : 'bg-cyan-950/40 border-cyan-500/20 text-slate-300 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="font-semibold truncate">{note.title || 'Untitled Note'}</div>
                  <div className="text-[10px] text-cyan-400/60">{note.date}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Note Details Editor */}
          {selectedNote && (
            <div className="md:col-span-2 bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-3 flex flex-col space-y-2">
              <input
                type="text"
                value={selectedNote.title}
                onChange={(e) => {
                  const updatedTitle = e.target.value;
                  setSelectedNote(prev => ({ ...prev, title: updatedTitle }));
                  setNotes(prev => prev.map(n => n.id === selectedNote.id ? { ...n, title: updatedTitle } : n));
                }}
                placeholder="Note Title..."
                className="w-full bg-transparent border-b border-cyan-500/30 pb-1 text-sm font-mono font-bold text-cyan-200 focus:outline-none focus:border-cyan-400"
              />
              <textarea
                value={selectedNote.content}
                onChange={(e) => {
                  const updatedContent = e.target.value;
                  setSelectedNote(prev => ({ ...prev, content: updatedContent }));
                  setNotes(prev => prev.map(n => n.id === selectedNote.id ? { ...n, content: updatedContent } : n));
                }}
                placeholder="Write markdown note content here..."
                className="flex-1 w-full bg-transparent font-sans text-xs text-slate-200 focus:outline-none resize-none leading-relaxed custom-scrollbar p-1"
              />
            </div>
          )}
        </div>
      ) : (
        /* Kanban Task Board */
        <div className="flex-1 flex flex-col space-y-3 min-h-0">
          <div className="flex items-center gap-2 bg-cyan-950/30 p-2 rounded-xl border border-cyan-500/30">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add new task or goal..."
              className="flex-1 bg-cyan-950/70 border border-cyan-500/40 rounded-lg px-3 py-1 text-xs font-mono text-cyan-200 focus:outline-none"
            />
            <button
              onClick={addTask}
              className="px-3 py-1 bg-cyan-500/30 border border-cyan-400 text-cyan-200 rounded-lg font-mono text-xs font-bold"
            >
              Add Task
            </button>
          </div>

          <div className="flex-1 grid grid-cols-3 gap-3 overflow-y-auto">
            {['todo', 'in_progress', 'done'].map(status => (
              <div key={status} className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-3 flex flex-col space-y-2">
                <div className="text-xs font-mono font-bold uppercase text-cyan-300 border-b border-cyan-500/30 pb-1">
                  {status === 'todo' ? '📌 To Do' : status === 'in_progress' ? '⚡ In Progress' : '✅ Completed'}
                </div>
                <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                  {tasks.filter(t => t.status === status).map(task => (
                    <div
                      key={task.id}
                      onClick={() => toggleTaskStatus(task.id)}
                      className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 text-xs font-mono cursor-pointer transition-all flex items-center justify-between"
                    >
                      <span className={status === 'done' ? 'line-through text-slate-400' : 'text-slate-200'}>{task.text}</span>
                      <span className="text-[10px] text-cyan-400/60">→</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
