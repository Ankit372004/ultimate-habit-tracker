import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { getHabits, getLogs } from '../utils/api';
import { startOfWeek, addDays, format } from 'date-fns';

const Analytics = () => {
    const [stats, setStats] = useState({ completionRate: 0, dailyConsistency: [] });

    useEffect(() => {
        const load = async () => {
            const habits = await getHabits();
            const logs = await getLogs();
            if (!habits.length) return;

            const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
            let totalPossible = habits.length * 7;
            let totalCompletedWeek = 0;

            const dailyData = [];

            for (let i = 0; i < 7; i++) {
                const d = format(addDays(startDate, i), 'yyyy-MM-dd');
                const completedCount = logs.filter(l => l.date === d && habits.some(h => h.id === l.habit_id)).length;
                totalCompletedWeek += completedCount;
                dailyData.push({
                    name: format(addDays(startDate, i), 'EEE'),
                    completed: completedCount,
                    total: habits.length
                });
            }

            setStats({
                completionRate: Math.round((totalCompletedWeek / (totalPossible || 1)) * 100),
                dailyConsistency: dailyData
            });
        };
        load(); // Initial load

        // Poll for updates every 2 seconds to keep in sync with Grid interactions
        const interval = setInterval(load, 2000);
        return () => clearInterval(interval);
    }, []);

    const dataPie = [
        { name: 'Completed', value: stats.completionRate },
        { name: 'Remaining', value: 100 - stats.completionRate },
    ];
    const COLORS = ['#6366f1', '#334155'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full max-w-5xl mx-auto">
            <div className="glass-panel p-6 flex flex-col relative overflow-hidden h-64">
                <h3 className="text-lg font-medium text-slate-300 mb-2">Weekly Completion</h3>
                <div className="flex-1 min-h-0 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={dataPie}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                                stroke="none"
                            >
                                {dataPie.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                        <span className="text-4xl font-bold text-white">{stats.completionRate}%</span>
                        <span className="text-xs text-slate-400">Total</span>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-6 h-64 flex flex-col">
                <h3 className="text-lg font-medium text-slate-300 mb-4">Daily Consistency</h3>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.dailyConsistency}>
                            <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1000} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
