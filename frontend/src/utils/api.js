import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001/api',
});

export const getHabits = async () => {
    try {
        const res = await api.get('/habits');
        return res.data;
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const createHabit = async (data) => {
    const res = await api.post('/habits', data);
    return res.data.data;
};

export const deleteHabit = async (id) => {
    await api.delete(`/habits/${id}`);
};

export const getLogs = async () => {
    try {
        const res = await api.get('/logs');
        return res.data;
    } catch (e) {
        return [];
    }
};

export const toggleLog = async (habit_id, date) => {
    const res = await api.post('/logs', { habit_id, date });
    return res.data;
};

export const getJournalEntries = async () => {
    try {
        const res = await api.get('/journal');
        return res.data;
    } catch (e) {
        return [];
    }
};

export const saveJournalEntry = async (data) => {
    const res = await api.post('/journal', data);
    return res.data.data;
};

export const getProfile = async () => {
    try {
        const res = await api.get('/profile');
        return res.data;
    } catch (e) {
        return null;
    }
};

export const updateProfile = async (data) => {
    const res = await api.post('/profile', data);
    return res.data;
};

export const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post('/upload', formData);
    return res.data.url;
};
