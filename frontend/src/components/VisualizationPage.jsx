import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, subDays, startOfMonth, eachDayOfInterval, endOfMonth, isSameDay, parseISO } from 'date-fns';
import { getHabits, getLogs } from '../utils/api';
import { TrendingUp, Award, Calendar } from 'lucide-react';

const VisualizationPage = () => {
    const [data, setData] = useState({
        monthlyTrend: [],
        weeklyOverview: [],
        overallProgress: 0,
        topHabits: [],
        totalHabits: 0,
        totalCompleted: 0,
        detailedStats: []
    });

    const COLORS = ['#10b981', '#6366f1', '#8b5cf6', '#f43f5e', '#f59e0b', '#06b6d4'];
    const PIE_COLORS = ['#10b981', '#1e293b']; // Emerald for success, Slate for remaining

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log("Fetching visualization data...");
                const habits = await getHabits();
                const logs = await getLogs();
                console.log("Habits:", habits.length, "Logs:", logs.length);

                if (!habits.length) {
                    setData(prev => ({ ...prev, totalHabits: 0, detailedStats: [] }));
                    return;
                }

                // 1. Monthly Trend (Area Chart)
                // Generate last 30 days
                const today = new Date();
                const last30Days = eachDayOfInterval({
                    start: subDays(today, 29),
                    end: today
                });

                const monthlyTrend = last30Days.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayLogs = logs.filter(l => l.date === dateStr);
                    // Calculate percentage for that day
                    const percentage = habits.length > 0 ? Math.round((dayLogs.length / habits.length) * 100) : 0;
                    return {
                        date: format(date, 'MMM d'),
                        fullDate: dateStr,
                        percentage: percentage
                    };
                });

                // 2. Weekly Overview (Bar Chart)
                // Last 7 days
                const last7Days = eachDayOfInterval({
                    start: subDays(today, 6),
                    end: today
                });
                const weeklyOverview = last7Days.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayLogs = logs.filter(l => l.date === dateStr);
                    return {
                        day: format(date, 'EEE'),
                        completed: dayLogs.length
                    };
                });

                // 3. Top Habits (Ranking)
                const habitStats = habits.map(habit => {
                    const habitLogs = logs.filter(l => l.habit_id === habit.id);
                    return {
                        name: habit.name,
                        count: habitLogs.length,
                        color: habit.color || '#6366f1'
                    };
                });
                // Sort by count descending
                const topHabits = habitStats.sort((a, b) => b.count - a.count).slice(0, 5);

                // 4. Overall Progress (Pie)
                // Calculate total possible completions (approximate for "lifetime" or just this month)
                // Let's do "Month to Date" for accuracy
                const startMonth = startOfMonth(today);
                const daysInMonthSoFar = eachDayOfInterval({ start: startMonth, end: today });
                const totalPossible = daysInMonthSoFar.length * habits.length;
                const totalCompletedMonth = logs.filter(l => {
                    const logDate = parseISO(l.date);
                    return logDate >= startMonth && logDate <= today;
                }).length;

                const overallProgress = totalPossible > 0 ? Math.round((totalCompletedMonth / totalPossible) * 100) : 0;

                // 5. Detailed Stats Calculation
                const detailedStats = habits.map(habit => {
                    const habitLogs = logs.filter(l => l.habit_id === habit.id);
                    // Streak
                    // Parse dates safely for sorting
                    const sortedLogs = habitLogs.sort((a, b) => parseISO(b.date) - parseISO(a.date));
                    let streak = 0;
                    let currentCheck = new Date();
                    currentCheck.setHours(0, 0, 0, 0);

                    // Allow today or yesterday to start streak (if today not checked yet)
                    const todayStr = format(currentCheck, 'yyyy-MM-dd');
                    const yesterdayStr = format(subDays(currentCheck, 1), 'yyyy-MM-dd');

                    const hasToday = sortedLogs.some(l => l.date === todayStr);
                    const hasYesterday = sortedLogs.some(l => l.date === yesterdayStr);

                    if (hasToday) {
                        streak = 1;
                        let checkDate = subDays(currentCheck, 1);
                        while (true) {
                            const dStr = format(checkDate, 'yyyy-MM-dd');
                            if (sortedLogs.some(l => l.date === dStr)) {
                                streak++;
                                checkDate = subDays(checkDate, 1);
                            } else {
                                break;
                            }
                        }
                    } else if (hasYesterday) {
                        streak = 1;
                        let checkDate = subDays(currentCheck, 2);
                        while (true) {
                            const dStr = format(checkDate, 'yyyy-MM-dd');
                            if (sortedLogs.some(l => l.date === dStr)) {
                                streak++;
                                checkDate = subDays(checkDate, 1);
                            } else {
                                break;
                            }
                        }
                    }

                    // Success Rate (Last 30 Days)
                    const last30Count = habitLogs.filter(l => {
                        const d = parseISO(l.date);
                        return d >= subDays(new Date(), 30);
                    }).length;
                    const rate = Math.round((last30Count / 30) * 100);

                    return {
                        name: habit.name,
                        category: habit.category,
                        total: habitLogs.length,
                        streak,
                        rate: isNaN(rate) ? 0 : rate
                    };
                });

                setData({
                    monthlyTrend,
                    weeklyOverview,
                    overallProgress,
                    topHabits,
                    totalHabits: habits.length,
                    totalCompleted: logs.length,
                    detailedStats
                });
            } catch (err) {
                console.error("Error fetching visualization data:", err);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="w-full max-w-[1400px] mx-auto animate-fade-in p-4 space-y-6">

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-panel p-4 flex items-center space-x-4 border-l-4 border-emerald-500">
                    <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Completion Rate</p>
                        <h3 className="text-2xl font-bold text-white">{data.overallProgress}%</h3>
                    </div>
                </div>
                <div className="glass-panel p-4 flex items-center space-x-4 border-l-4 border-indigo-500">
                    <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400">
                        <Award size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Total Habits</p>
                        <h3 className="text-2xl font-bold text-white">{data.totalHabits}</h3>
                    </div>
                </div>
                <div className="glass-panel p-4 flex items-center space-x-4 border-l-4 border-amber-500">
                    <div className="p-3 bg-amber-500/20 rounded-lg text-amber-400">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Total Check-ins</p>
                        <h3 className="text-2xl font-bold text-white">{data.totalCompleted}</h3>
                    </div>
                </div>
                <div className="glass-panel p-4 flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600">
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-white">Keep Going!</h3>
                        <p className="text-white/80 text-xs"> Consistency is key.</p>
                    </div>
                </div>
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Monthly Trend Area Chart */}
                <div className="glass-panel p-6 lg:col-span-2">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-emerald-500 rounded-sm"></span>
                        30-Day Consistency Trend
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.monthlyTrend}>
                                <defs>
                                    <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    minTickGap={30}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    unit="%"
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                    itemStyle={{ color: '#10b981' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="percentage"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorPv)"
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Overall Progress Pie */}
                <div className="glass-panel p-6 flex flex-col items-center justify-center relative">
                    <h3 className="text-lg font-bold text-white mb-2 absolute top-6 left-6">Monthly Goal</h3>
                    <div className="h-[250px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Completed', value: data.overallProgress },
                                        { name: 'Remaining', value: 100 - data.overallProgress }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={100}
                                    startAngle={90}
                                    endAngle={-270}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    <Cell key="cell-0" fill="#10b981" />
                                    <Cell key="cell-1" fill="#1e293b" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-5xl font-bold text-white">{data.overallProgress}%</span>
                            <span className="text-sm text-slate-400 uppercase tracking-widest mt-1">Success</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Weekly Bar Chart */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Weekly Volume</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.weeklyOverview}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                                <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                                <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30}>
                                    {data.weeklyOverview.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'][index % 5]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Habits List */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Top Performing Habits</h3>
                    <div className="space-y-4">
                        {data.topHabits.map((habit, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-sm border border-slate-700">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-medium text-slate-200">{habit.name}</span>
                                        <span className="text-xs text-slate-400">{habit.count} check-ins</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${data.totalCompleted > 0 ? (habit.count / Math.max(...data.topHabits.map(h => h.count))) * 100 : 0}%`,
                                                backgroundColor: COLORS[index % COLORS.length]
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {data.topHabits.length === 0 && (
                            <div className="text-center text-slate-500 py-10">No data available yet</div>
                        )}
                    </div>
                </div>
            </div> {/* This closes the "Second Row" grid div */}

            {/* Third Row: Detailed Report Table */}
            <div className="glass-panel p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Detailed Performance Report</h3>
                    <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold border px-2 py-1 rounded border-slate-700">Live Data</div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700/50 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="pb-3 pl-2">Habit</th>
                                <th className="pb-3">Category</th>
                                <th className="pb-3 text-center">Current Streak</th>
                                <th className="pb-3 text-center">Total Check-ins</th>
                                <th className="pb-3 text-right pr-2">Success Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {data.detailedStats?.map((habit, index) => (
                                <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="py-4 pl-2 font-medium text-slate-200">{habit.name}</td>
                                    <td className="py-4 text-slate-500 text-sm">{habit.category}</td>
                                    <td className="py-4 text-center">
                                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 font-bold text-sm">
                                            <TrendingUp size={14} /> {habit.streak} Days
                                        </div>
                                    </td>
                                    <td className="py-4 text-center text-slate-300 font-mono">{habit.total}</td>
                                    <td className="py-4 text-right pr-2">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${habit.rate >= 80 ? 'bg-emerald-500' : habit.rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${habit.rate}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-slate-300 w-8">{habit.rate}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!data.detailedStats || data.detailedStats.length === 0) && (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-slate-500 italic">No habits found. Start tracking!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

// Simple Icon component helper
const CheckCircle = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

export default VisualizationPage;
