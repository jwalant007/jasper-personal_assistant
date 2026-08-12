import React, { useState, useEffect } from 'react';
import { Calendar, CheckSquare, Bell, Flame, Sun, Plus, Trash2, Volume2, XCircle, CheckCircle2 } from 'lucide-react';

export default function PersonalAssistantWidget({ onClose, onSpeakBriefing }) {
  const [activeTab, setActiveTab] = useState('briefing'); // briefing, calendar, todo, reminders, habits

  // Persistent States
  const [events, setEvents] = useState(() => {
    const s = localStorage.getItem('jasper_events');
    return s ? JSON.parse(s) : [
      { id: 1, title: 'Team Sync Meeting', time: '10:00 AM', date: 'Today' },
      { id: 2, title: 'Project Demo Review', time: '03:30 PM', date: 'Today' }
    ];
  });

  const [todos, setTodos] = useState(() => {
    const s = localStorage.getItem('jasper_todos');
    return s ? JSON.parse(s) : [
      { id: 1, text: 'Review security audit logs', completed: false, priority: 'high' },
      { id: 2, text: 'Backup smart home configurations', completed: true, priority: 'medium' }
    ];
  });

  const [reminders, setReminders] = useState(() => {
    const s = localStorage.getItem('jasper_reminders');
    return s ? JSON.parse(s) : [
      { id: 1, title: 'Take evening break', time: '06:00 PM' }
    ];
  });

  const [habits, setHabits] = useState(() => {
    const s = localStorage.getItem('jasper_habits');
    return s ? JSON.parse(s) : [
      { id: 1, name: 'Drink 2L Water', streak: 5, doneToday: true },
      { id: 2, name: '30 Mins Workout', streak: 3, doneToday: false },
      { id: 3, name: 'Read 15 Mins', streak: 12, doneToday: true }
    ];
  });

  // Inputs
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newTodoText, setNewTodoText] = useState('');
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');
  const [newHabitName, setNewHabitName] = useState('');

  useEffect(() => {
    localStorage.setItem('jasper_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('jasper_todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('jasper_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('jasper_habits', JSON.stringify(habits));
  }, [habits]);

  // Handlers
  const addEvent = (e) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    setEvents([...events, { id: Date.now(), title: newEventTitle, time: newEventTime || 'All Day', date: 'Today' }]);
    setNewEventTitle('');
    setNewEventTime('');
  };

  const addTodo = (e) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    setTodos([...todos, { id: Date.now(), text: newTodoText, completed: false, priority: 'medium' }]);
    setNewTodoText('');
  };

  const addReminder = (e) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;
    setReminders([...reminders, { id: Date.now(), title: newReminderTitle, time: newReminderTime || 'In 1 hour' }]);
    setNewReminderTitle('');
    setNewReminderTime('');
  };

  const addHabit = (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    setHabits([...habits, { id: Date.now(), name: newHabitName, streak: 1, doneToday: false }]);
    setNewHabitName('');
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const toggleHabit = (id) => {
    setHabits(habits.map(h => {
      if (h.id === id) {
        const nextDone = !h.doneToday;
        return { ...h, doneToday: nextDone, streak: nextDone ? h.streak + 1 : Math.max(0, h.streak - 1) };
      }
      return h;
    }));
  };

  // Generate Daily Briefing text
  const generateBriefingText = () => {
    const pendingTodos = todos.filter(t => !t.completed).length;
    const todayEvents = events.length;
    const completedHabits = habits.filter(h => h.doneToday).length;
    return `Good day! Here is your daily briefing: You have ${todayEvents} scheduled event${todayEvents === 1 ? '' : 's'} today and ${pendingTodos} pending task${pendingTodos === 1 ? '' : 's'}. You have completed ${completedHabits} of ${habits.length} habits today. All systems are operational.`;
  };

  const handleSpeakBriefing = () => {
    const text = generateBriefingText();
    if (onSpeakBriefing) {
      onSpeakBriefing(text);
    } else {
      const synth = window.speechSynthesis;
      if (synth) {
        const u = new SpeechSynthesisUtterance(text);
        synth.speak(u);
      }
    }
  };

  return (
    <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-6 text-slate-100 backdrop-blur-xl shadow-2xl max-w-4xl w-full mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/40 rounded-xl text-amber-400">
            <Sun className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wider text-amber-300 uppercase">Personal Assistant</h2>
            <p className="text-xs text-slate-400">Calendar, To-Do, Reminders, Habits & Daily Briefing</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-3">
        {[
          { id: 'briefing', label: 'Daily Briefing', icon: Sun },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'todo', label: 'To-Do List', icon: CheckSquare },
          { id: 'reminders', label: 'Reminders', icon: Bell },
          { id: 'habits', label: 'Habit Tracking', icon: Flame }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive 
                  ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 shadow-lg shadow-amber-500/10' 
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[300px]">
        {/* Tab 1: Daily Briefing */}
        {activeTab === 'briefing' && (
          <div className="p-6 bg-slate-900/60 border border-amber-500/30 rounded-xl text-center flex flex-col items-center">
            <Sun className="w-12 h-12 text-amber-400 mb-3 animate-pulse" />
            <h3 className="text-lg font-bold text-amber-200 mb-2">1-Click Daily Executive Briefing</h3>
            <p className="text-xs text-slate-300 max-w-lg mb-6 leading-relaxed">
              "{generateBriefingText()}"
            </p>
            <button
              onClick={handleSpeakBriefing}
              className="px-6 py-3 bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 text-amber-300 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/10"
            >
              <Volume2 className="w-5 h-5" /> Play Voice Briefing
            </button>
          </div>
        )}

        {/* Tab 2: Calendar */}
        {activeTab === 'calendar' && (
          <div>
            <form onSubmit={addEvent} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Event title..."
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200"
              />
              <input
                type="text"
                placeholder="Time (e.g. 2:00 PM)..."
                value={newEventTime}
                onChange={(e) => setNewEventTime(e.target.value)}
                className="w-36 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
              <button type="submit" className="px-4 py-2 bg-amber-600/30 border border-amber-500/50 text-amber-200 rounded-xl text-xs font-semibold">
                Add Event
              </button>
            </form>

            <div className="space-y-2">
              {events.map(e => (
                <div key={e.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-200">{e.title}</p>
                    <span className="text-[10px] text-amber-400">{e.date} • {e.time}</span>
                  </div>
                  <button onClick={() => setEvents(events.filter(x => x.id !== e.id))} className="text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: To-Do List */}
        {activeTab === 'todo' && (
          <div>
            <form onSubmit={addTodo} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add new task..."
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200"
              />
              <button type="submit" className="px-4 py-2 bg-amber-600/30 border border-amber-500/50 text-amber-200 rounded-xl text-xs font-semibold">
                Add Task
              </button>
            </form>

            <div className="space-y-2">
              {todos.map(t => (
                <div key={t.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleTodo(t.id)}>
                      {t.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                    </button>
                    <span className={`${t.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{t.text}</span>
                  </div>
                  <button onClick={() => setTodos(todos.filter(x => x.id !== t.id))} className="text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Reminders */}
        {activeTab === 'reminders' && (
          <div>
            <form onSubmit={addReminder} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Reminder message..."
                value={newReminderTitle}
                onChange={(e) => setNewReminderTitle(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200"
              />
              <input
                type="text"
                placeholder="Time / Interval..."
                value={newReminderTime}
                onChange={(e) => setNewReminderTime(e.target.value)}
                className="w-36 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
              <button type="submit" className="px-4 py-2 bg-amber-600/30 border border-amber-500/50 text-amber-200 rounded-xl text-xs font-semibold">
                Set Reminder
              </button>
            </form>

            <div className="space-y-2">
              {reminders.map(r => (
                <div key={r.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-200">{r.title}</p>
                    <span className="text-[10px] text-amber-400">Scheduled: {r.time}</span>
                  </div>
                  <button onClick={() => setReminders(reminders.filter(x => x.id !== r.id))} className="text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Habit Tracking */}
        {activeTab === 'habits' && (
          <div>
            <form onSubmit={addHabit} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Habit name (e.g. Meditate 10 mins)..."
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200"
              />
              <button type="submit" className="px-4 py-2 bg-amber-600/30 border border-amber-500/50 text-amber-200 rounded-xl text-xs font-semibold">
                Add Habit
              </button>
            </form>

            <div className="space-y-2">
              {habits.map(h => (
                <div key={h.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleHabit(h.id)} className="p-1 rounded bg-slate-800 border border-slate-700">
                      {h.doneToday ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded" />}
                    </button>
                    <span className="font-semibold text-slate-200">{h.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" /> {h.streak} day streak
                    </span>
                    <button onClick={() => setHabits(habits.filter(x => x.id !== h.id))} className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
