import React, { useState, useEffect } from 'react';
import { format, subDays, addDays } from 'date-fns';
import { getJournalEntries, saveJournalEntry } from '../utils/api';
import { Save, Calendar, BookOpen, PenTool, MessageCircle } from 'lucide-react';

const JournalPage = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [content, setContent] = useState('');
    const [reflection, setReflection] = useState('');
    const [mood, setMood] = useState('active');
    const [entries, setEntries] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadEntries();
    }, []);

    useEffect(() => {
        // Load content for selected date
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const entry = entries.find(e => e.date === dateStr);
        if (entry) {
            setContent(entry.content || '');
            setReflection(entry.reflection || '');
            setMood(entry.mood || 'active');
        } else {
            setContent('');
            setReflection('');
            setMood('active');
        }
    }, [selectedDate, entries]);

    const loadEntries = async () => {
        const data = await getJournalEntries();
        setEntries(data);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            await saveJournalEntry({
                date: dateStr,
                content,
                reflection,
                mood
            });
            await loadEntries(); // Reload to update list
        } finally {
            setIsSaving(false);
        }
    };

    const moods = [
        { id: 'happy', emoji: '😊', label: 'Happy' },
        { id: 'productive', emoji: '⚡', label: 'Productive' },
        { id: 'calm', emoji: '😌', label: 'Calm' },
        { id: 'tired', emoji: '😴', label: 'Tired' },
        { id: 'stress', emoji: '😰', label: 'Stressed' }
    ];

    return (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Left Column: Editor */}
            <div className="lg:col-span-2 space-y-6">

                {/* Date Header */}
                <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">{format(selectedDate, 'MMMM d, yyyy')}</h2>
                            <p className="text-slate-400 text-sm">Daily entry</p>
                        </div>
                    </div>
                    <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg">
                        <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md">Prev</button>
                        <button onClick={() => setSelectedDate(new Date())} className="px-3 py-1 text-xs font-medium bg-indigo-500 text-white rounded-md shadow-lg shadow-indigo-500/20">Today</button>
                        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md">Next</button>
                    </div>
                </div>

                {/* Journal Input */}
                <div className="glass-panel p-6 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-400 mb-2">
                        <BookOpen size={20} />
                        <span className="font-semibold uppercase tracking-wider text-sm">Events & Observations</span>
                    </div>
                    <textarea
                        className="w-full h-40 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
                        placeholder="What happened today? What did you do?"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    ></textarea>
                </div>

                {/* Reflection Input */}
                <div className="glass-panel p-6 space-y-2">
                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                        <MessageCircle size={20} />
                        <span className="font-semibold uppercase tracking-wider text-sm">Reflections & Meaning</span>
                    </div>
                    <textarea
                        className="w-full h-40 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
                        placeholder="How did it make you feel? What did you learn?"
                        value={reflection}
                        onChange={e => setReflection(e.target.value)}
                    ></textarea>
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 glass-panel p-4">
                    <div className="flex items-center gap-2 max-sm:w-full">
                        <span className="text-slate-400 mr-2 text-sm">Mood:</span>
                        <div className="flex gap-1">
                            {moods.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setMood(m.id)}
                                    title={m.label}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${mood === m.id ? 'bg-slate-700 scale-110 shadow-lg border border-slate-500' : 'hover:bg-slate-800 grayscale hover:grayscale-0'}`}
                                >
                                    {m.emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="btn-primary w-full sm:w-auto px-8"
                    >
                        {isSaving ? 'Saving...' : (
                            <span className="flex items-center gap-2">
                                <Save size={18} /> Save Entry
                            </span>
                        )}
                    </button>
                </div>

            </div>

            {/* Right Column: History */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white px-2">Recent Entries</h3>
                <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                    {entries.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">No entries yet. Start writing!</div>
                    ) : (
                        entries.map(entry => (
                            <div
                                key={entry.id}
                                onClick={() => setSelectedDate(new Date(entry.date))}
                                className={`glass-panel p-4 cursor-pointer transition-all hover:bg-slate-800/80 border-l-4 ${format(selectedDate, 'yyyy-MM-dd') === entry.date ? 'border-indigo-500 bg-indigo-500/10' : 'border-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-slate-200">{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                                    <span className="text-xl">{moods.find(m => m.id === entry.mood)?.emoji}</span>
                                </div>
                                <p className="text-slate-400 text-sm line-clamp-2 mb-2 font-medium">
                                    {entry.content || 'No content...'}
                                </p>
                                {entry.reflection && (
                                    <div className="text-xs text-purple-400 bg-purple-500/10 p-2 rounded border border-purple-500/20 line-clamp-2">
                                        {entry.reflection}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default JournalPage;
