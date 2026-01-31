import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile, getHabits, getLogs, uploadAvatar } from '../utils/api';
import { User, Mail, Award, Calendar, Edit2, Check, X, Camera } from 'lucide-react';
import { format } from 'date-fns';

const ProfilePage = () => {
    const [profile, setProfile] = useState({
        name: '',
        title: '',
        bio: '',
        avatar_url: ''
    });
    const [stats, setStats] = useState({
        totalHabits: 0,
        totalLogs: 0,
        joinedDate: new Date()
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const p = await getProfile();
        const habits = await getHabits();
        const logs = await getLogs();

        if (p) {
            setProfile(p);
            setFormData(p);
            setStats({
                totalHabits: habits.length,
                totalLogs: logs.length,
                joinedDate: new Date(p.created_at || Date.now()) // fallback
            });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateProfile(formData);
            setProfile(formData);
            setIsEditing(false);
        } catch (err) {
            alert('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData(profile);
        setIsEditing(false);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const url = await uploadAvatar(file);
            setFormData(prev => ({ ...prev, avatar_url: url }));
        } catch (err) {
            alert("Failed to upload image");
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in p-4 space-y-8">

            {/* Profile Header/Card */}
            <div className="glass-panel p-8 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                    {/* Avatar */}
                    <div className="relative group shrink-0">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-1 shadow-2xl shadow-indigo-500/30">
                            <div className="w-full h-full rounded-full bg-slate-900 border-4 border-slate-900 overflow-hidden flex items-center justify-center text-4xl font-bold text-white relative">
                                {(isEditing && formData.avatar_url) || (!isEditing && profile.avatar_url) ? (
                                    <img src={isEditing ? formData.avatar_url : profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{profile.name.charAt(0)}</span>
                                )}

                                {/* Upload Overlay (Edit Mode) */}
                                {isEditing && (
                                    <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        <Camera size={24} className="text-white" />
                                    </label>
                                )}
                            </div>
                        </div>
                        {/* Edit Badge - Only show when NOT editing (to start edit) */}
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="absolute bottom-1 right-1 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white border border-slate-600 hover:bg-indigo-500 hover:border-indigo-500 transition-all shadow-lg"
                            >
                                <Edit2 size={14} />
                            </button>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 w-full">
                        {isEditing ? (
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-semibold mb-1 block">Full Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                                            value={formData.name || ''}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-semibold mb-1 block">Title / Role</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                                            value={formData.title || ''}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-semibold mb-1 block">Gender</label>
                                    <select
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                                        value={formData.gender || 'Prefer not to say'}
                                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Non-binary">Non-binary</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-semibold mb-1 block">Bio</label>
                                    <textarea
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none h-24 resize-none"
                                        value={formData.bio || ''}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    ></textarea>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="btn-primary"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4 animate-fade-in">
                                <div>
                                    <h1 className="text-3xl font-bold text-white mb-1">{profile.name}</h1>
                                    <p className="text-indigo-400 text-lg">{profile.title}</p>
                                </div>
                                <p className="text-slate-300 max-w-2xl leading-relaxed">
                                    {profile.bio}
                                </p>
                                <div className="flex items-center gap-6 pt-4">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <Award size={16} />
                                        <span>Level 5 Achiever</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <Calendar size={16} />
                                        <span>Joined {format(stats.joinedDate, 'MMMM yyyy')}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<User size={24} />} label="Total Habits" value={stats.totalHabits} color="bg-blue-500" />
                <StatCard icon={<Check size={24} />} label="Lifetime Check-ins" value={stats.totalLogs} color="bg-emerald-500" />
                <StatCard icon={<Award size={24} />} label="Achievements" value="3 Unlocked" subValue="Next: 7 Day Streak" color="bg-amber-500" />
            </div>

            {/* Placeholder for future sections */}
            <div className="glass-panel p-6 text-center py-12 border-dashed border-2 border-slate-800 bg-transparent">
                <h3 className="text-lg font-medium text-slate-400 mb-2">Detailed Activity History</h3>
                <p className="text-slate-500 text-sm">More detailed activity logs and contribution graphs coming soon.</p>
            </div>
        </div >
    );
};

const StatCard = ({ icon, label, value, subValue, color }) => (
    <div className="glass-panel p-5 flex items-center gap-4 hover:translate-y-[-2px] transition-transform duration-300">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
            <h3 className="text-2xl font-bold text-white">{value}</h3>
            {subValue && <p className="text-slate-500 text-xs mt-0.5">{subValue}</p>}
        </div>
    </div>
);

export default ProfilePage;
