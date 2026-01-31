import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { Check, Trash2, Plus, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getHabits, getLogs, toggleLog, deleteHabit, createHabit } from '../utils/api';

const HabitGrid = () => {
    const [habits, setHabits] = useState([]);
    const [logs, setLogs] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysToShow = 7;
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const dates = Array.from({ length: daysToShow }).map((_, i) => addDays(startDate, i));

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const h = await getHabits();
        const l = await getLogs();
        setHabits(h || []);
        setLogs(l || []);
    };

    const isCompleted = (habitId, date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return logs.some(log => log.habit_id === habitId && log.date === dateStr);
    };

    const handleToggle = async (habitId, date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        // Optimistic update
        const exists = isCompleted(habitId, date);
        if (exists) {
            setLogs(prev => prev.filter(l => !(l.habit_id === habitId && l.date === dateStr)));
        } else {
            setLogs(prev => [...prev, { habit_id: habitId, date: dateStr }]);
        }

        await toggleLog(habitId, dateStr);
        fetchData(); // Sync to be sure
    };

    const [newHabitName, setNewHabitName] = useState('');
    const handleAddHabit = async (e) => {
        e.preventDefault();
        if (!newHabitName.trim()) return;
        await createHabit({ name: newHabitName });
        setNewHabitName('');
        fetchData();
    };

    const changeWeek = (direction) => {
        setCurrentDate(prev => addDays(prev, direction * 7));
    };

    return (
        <div className="glass-panel p-6 w-full max-w-5xl mx-auto animate-fade-in shadow-2xl shadow-indigo-500/10">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button onClick={() => changeWeek(-1)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors border-l border-r border-slate-700 mx-1">
                            Today
                        </button>
                        <button onClick={() => changeWeek(1)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="relative">
                        <input
                            type="date"
                            value={format(currentDate, 'yyyy-MM-dd')}
                            onChange={(e) => setCurrentDate(new Date(e.target.value))}
                            className="bg-slate-800 text-white border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 appearance-none min-h-[42px]"
                        />
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>

                    <div className="hidden sm:block">
                        <p className="text-slate-400 text-sm font-medium">
                            {format(startDate, 'MMM d')} - {format(addDays(startDate, 6), 'MMM d, yyyy')}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleAddHabit} className="flex gap-2 w-full lg:w-auto">
                    <input
                        type="text"
                        value={newHabitName}
                        onChange={e => setNewHabitName(e.target.value)}
                        placeholder="New Habit..."
                        className="bg-slate-800 text-white border border-slate-600 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 flex-1 sm:w-64 transition-all focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button className="btn-primary flex items-center gap-1 shrink-0">
                        <Plus size={18} /> Add
                    </button>
                </form>
            </div>

            <div className="overflow-x-auto pb-2">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr>
                            <th className="p-3 text-slate-400 font-medium w-1/4">Habit Name</th>
                            {dates.map(date => {
                                const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                                return (
                                    <th key={date.toString()} className="p-3 text-center">
                                        <div className={`flex flex-col items-center justify-center p-2 rounded-lg ${isToday ? 'bg-indigo-500/10 border border-indigo-500/30' : ''}`}>
                                            <span className="text-xs text-slate-500 uppercase font-semibold">{format(date, 'EEE')}</span>
                                            <span className={`text-lg font-bold ${isToday ? 'text-indigo-400' : 'text-slate-300'}`}>
                                                {format(date, 'd')}
                                            </span>
                                        </div>
                                    </th>
                                );
                            })}
                            <th className="p-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {habits.map(habit => (
                            <tr key={habit.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors group">
                                <td className="p-3">
                                    <span className="font-medium text-slate-200 text-lg">{habit.name}</span>
                                    {habit.category && <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{habit.category}</div>}
                                </td>
                                {dates.map(date => {
                                    const completed = isCompleted(habit.id, date);
                                    return (
                                        <td key={date.toString()} className="p-3 text-center">
                                            <button
                                                onClick={() => handleToggle(habit.id, date)}
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all mx-auto duration-200 hover:scale-110 active:scale-95 ${completed ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-slate-800/80 text-slate-600 hover:bg-slate-700 border border-transparent hover:border-slate-600'}`}
                                            >
                                                {completed && <Check size={24} strokeWidth={3} />}
                                            </button>
                                        </td>
                                    );
                                })}
                                <td className="p-3 text-right">
                                    <button onClick={() => { if (confirm('Delete habit?')) { deleteHabit(habit.id); fetchData(); } }} className="btn-icon text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {habits.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                            <Plus size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-300">No habits yet</h3>
                        <p className="text-slate-500 mb-6">Start tracking your first habit to see progress.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HabitGrid;
