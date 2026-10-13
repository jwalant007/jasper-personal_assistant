import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, Plus, CheckCircle2, Circle, Sparkles, Trash2, Layers, CheckSquare, FileText, Calendar, Save } from 'lucide-react';
import { useJasperUser } from '../context/JasperUserContext';

export default function JasperNotesPlannerApp() {
  const { currentUser } = useJasperUser();
  const [activeTab, setActiveTab] = useState('notes'); // notes, kanban
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load user-specific notes & tasks from backend
  const loadData = useCallback(async () => {
    try {
      const [resNotes, resTasks] = await Promise.all([
        fetch('/api/db/notes'),
        fetch('/api/db/tasks')
      ]);

      if (resNotes.ok) {
        const d = await resNotes.json();
        const userNotes = Array.isArray(d.notes) ? d.notes : [];
        setNotes(userNotes);
        if (userNotes.length > 0) {
          setSelectedNote(userNotes[0]);
        } else {
          setSelectedNote(null);
        }
      }

      if (resTasks.ok) {
        const d = await resTasks.json();
        setTasks(Array.isArray(d.tasks) ? d.tasks : []);
      }
    } catch (err) {
      console.warn('[NotesPlanner] Error loading notes/tasks:', err.message);
    }
  }, []);

  useEffect(() => {
    loadData();
    const handleUserChanged = () => loadData();
    window.addEventListener('jasper_user_changed', handleUserChanged);
    return () => window.removeEventListener('jasper_user_changed', handleUserChanged);
  }, [loadData, currentUser?.userId]);

  // Persist notes to server
  const saveNotesToServer = async (newNotesList) => {
    setIsSaving(true);
    try {
      await fetch('/api/db/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: newNotesList })
      });
    } catch (err) {
      console.error('[NotesPlanner] Failed to save notes:', err);
    } finally {
      setTimeout(() => setIsSaving(false), 400);
    }
  };

  // Persist tasks to server
  const saveTasksToServer = async (newTasksList) => {
    try {
      await fetch('/api/db/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: newTasksList })
      });
    } catch (err) {
      console.error('[NotesPlanner] Failed to save tasks:', err);
    }
  };

  const handleCreateNote = () => {
    const newNote = {
      id: Date.now(),
      title: 'New Note',
      content: '',
      date: new Date().toLocaleDateString()
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    setSelectedNote(newNote);
    saveNotesToServer(updated);
  };

  const handleDeleteNote = (noteId) => {
    const updated = notes.filter(n => n.id !== noteId);
    setNotes(updated);
    if (selectedNote?.id === noteId) {
      setSelectedNote(updated.length > 0 ? updated[0] : null);
    }
    saveNotesToServer(updated);
  };

  const handleUpdateNote = (field, value) => {
    if (!selectedNote) return;
    const updatedNote = { ...selectedNote, [field]: value };
    setSelectedNote(updatedNote);
    const updatedList = notes.map(n => n.id === selectedNote.id ? updatedNote : n);
    setNotes(updatedList);
  };

  // Debounced auto-save for note editing
  const saveTimeoutRef = useRef(null);
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (notes.length > 0) {
        saveNotesToServer(notes);
      }
    }, 800);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [notes]);

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const newTask = { id: Date.now(), text: newTaskText.trim(), status: 'todo' };
    const updated = [...tasks, newTask];
    setTasks(updated);
    setNewTaskText('');
    saveTasksToServer(updated);
  };

  const toggleTaskStatus = (id) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'done' : 'todo';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    setTasks(updated);
    saveTasksToServer(updated);
  };

  const deleteTask = (e, id) => {
    e.stopPropagation();
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    saveTasksToServer(updated);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/90 text-slate-100 font-sans p-4 rounded-xl space-y-3">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between bg-cyan-950/50 border border-cyan-500/30 p-2.5 rounded-xl">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <div>
            <span className="font-orbitron font-extrabold text-xs text-cyan-200 uppercase tracking-wider">JASPER Notes & Task Planner</span>
            <span className="text-[10px] text-cyan-400/60 font-mono ml-2">@{currentUser?.userId || 'user'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-[10px] text-cyan-400 font-mono animate-pulse flex items-center gap-1">
              <Save size={12} /> Syncing...
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeTab === 'notes' ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 font-bold' : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              📝 Notes ({notes.length})
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
      </div>

      {/* Main Content Area */}
      {activeTab === 'notes' ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 min-h-0">
          {/* Notes Sidebar */}
          <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-3 flex flex-col space-y-2">
            <button
              onClick={handleCreateNote}
              className="w-full py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> New Note
            </button>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {notes.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 font-mono">
                  No notes yet. Click "+ New Note" to create one.
                </div>
              ) : (
                notes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={`w-full p-2.5 rounded-lg text-left text-xs font-mono transition-all border group cursor-pointer flex items-center justify-between ${
                      selectedNote?.id === note.id
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-100'
                        : 'bg-cyan-950/40 border-cyan-500/20 text-slate-300 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="truncate flex-1 pr-2">
                      <div className="font-semibold truncate">{note.title || 'Untitled Note'}</div>
                      <div className="text-[10px] text-cyan-400/60">{note.date}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                      title="Delete note"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Note Details Editor */}
          {selectedNote ? (
            <div className="md:col-span-2 bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-3 flex flex-col space-y-2">
              <input
                type="text"
                value={selectedNote.title || ''}
                onChange={(e) => handleUpdateNote('title', e.target.value)}
                placeholder="Note Title..."
                className="w-full bg-transparent border-b border-cyan-500/30 pb-1 text-sm font-mono font-bold text-cyan-200 focus:outline-none focus:border-cyan-400"
              />
              <textarea
                value={selectedNote.content || ''}
                onChange={(e) => handleUpdateNote('content', e.target.value)}
                placeholder="Write markdown note content here..."
                className="flex-1 w-full bg-transparent font-sans text-xs text-slate-200 focus:outline-none resize-none leading-relaxed custom-scrollbar p-1"
              />
            </div>
          ) : (
            <div className="md:col-span-2 bg-cyan-950/10 border border-cyan-500/20 rounded-xl p-8 flex items-center justify-center text-slate-500 font-mono text-xs">
              Select or create a note to begin editing.
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
              placeholder="Add new task or goal for this profile..."
              className="flex-1 bg-cyan-950/70 border border-cyan-500/40 rounded-lg px-3 py-1 text-xs font-mono text-cyan-200 focus:outline-none"
            />
            <button
              onClick={addTask}
              className="px-3 py-1 bg-cyan-500/30 border border-cyan-400 text-cyan-200 rounded-lg font-mono text-xs font-bold"
            >
              Add Task
            </button>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 overflow-y-auto">
            {['todo', 'in_progress', 'done'].map(status => (
              <div key={status} className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-3 flex flex-col space-y-2">
                <div className="text-xs font-mono font-bold uppercase text-cyan-300 border-b border-cyan-500/30 pb-1 flex justify-between items-center">
                  <span>{status === 'todo' ? '📌 To Do' : status === 'in_progress' ? '⚡ In Progress' : '✅ Completed'}</span>
                  <span className="text-[10px] text-cyan-400/60 font-mono">
                    {tasks.filter(t => t.status === status).length}
                  </span>
                </div>
                <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                  {tasks.filter(t => t.status === status).map(task => (
                    <div
                      key={task.id}
                      onClick={() => toggleTaskStatus(task.id)}
                      className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 text-xs font-mono cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <span className={status === 'done' ? 'line-through text-slate-400' : 'text-slate-200'}>{task.text}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => deleteTask(e, task.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-400 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                        <span className="text-[10px] text-cyan-400/60">→</span>
                      </div>
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
