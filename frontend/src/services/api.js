import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle 401 Unauthorized errors (token expired or invalid)
        if (error.response && error.response.status === 401) {
            // Clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Redirect to login page if not already there
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email, password) => api.post('/api/auth/login', { username: email, password }),
    register: (userData) => api.post('/api/auth/register', userData),
    verifyEmail: (token) => api.post(`/api/auth/verify-email/${token}`),
    requestVerificationEmail: () => api.post('/api/auth/request-verification'),
    resetPassword: (data) => api.post('/api/auth/reset-password', data),
};

// User API
export const userAPI = {
    getCurrentUser: () => api.get('/api/users/me'),
    updateCurrentUser: (userData) => api.put('/api/users/me', userData),
    getUsers: () => api.get('/api/users/list'),
};

// Calendar API
export const calendarAPI = {
    getCalendars: () => api.get('/api/calendars'),
    createCalendar: (calendarData) => api.post('/api/calendars', calendarData),
    getAuthUrl: (provider) => api.get(`/api/calendars/auth-url/${provider}`),
    authenticateCalendar: (authData) => api.post('/api/calendars/auth', authData),
    updateCalendar: (id, calendarData) => api.put(`/api/calendars/${id}`, calendarData),
    deleteCalendar: (id) => api.delete(`/api/calendars/${id}`),
    syncCalendar: (id) => api.post(`/api/calendars/${id}/sync`),
};

// Availability API
export const availabilityAPI = {
    getAvailabilities: () => api.get('/api/availability'),
    createAvailability: (availabilityData) => api.post('/api/availability', availabilityData),
    updateAvailability: (id, availabilityData) => api.put(`/api/availability/${id}`, availabilityData),
    deleteAvailability: (id) => api.delete(`/api/availability/${id}`),
};

// Meeting API
export const meetingAPI = {
    getMeetings: () => api.get('/api/meetings'),
    createMeeting: (meetingData) => api.post('/api/meetings', meetingData),
    getMeeting: (id) => api.get(`/api/meetings/${id}`),
    updateMeeting: (id, meetingData) => api.put(`/api/meetings/${id}`, meetingData),
    deleteMeeting: (id) => api.delete(`/api/meetings/${id}`),
    getTeamAvailability: (teamId, startDate, endDate) =>
        api.get(`/api/meetings/team/${teamId}/availability?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`),
};

// Team API
export const teamAPI = {
    getTeams: () => api.get('/api/teams'),
    createTeam: (teamData) => api.post('/api/teams', teamData),
    getTeam: (id) => api.get(`/api/teams/${id}`),
    updateTeam: (id, teamData) => api.put(`/api/teams/${id}`, teamData),
    deleteTeam: (id) => api.delete(`/api/teams/${id}`),
    updateTeamMembers: (id, memberData) => api.put(`/api/teams/${id}/members`, memberData),
};

// Admin API
export const adminAPI = {
    getUsers: () => api.get('/api/admin/users'),
    createUser: (userData) => api.post('/api/admin/users', userData),
    getUser: (id) => api.get(`/api/admin/users/${id}`),
    updateUser: (id, userData) => api.put(`/api/admin/users/${id}`, userData),
    deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
    getStats: () => api.get('/api/admin/stats'),
    makeUserAdmin: (id) => api.put(`/api/admin/users/${id}/make-admin`),
    removeUserAdmin: (id) => api.put(`/api/admin/users/${id}/remove-admin`),
};

export default api; 