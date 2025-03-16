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
    getCurrentUser: () => api.get('/users/me'),
    updateCurrentUser: (userData) => api.put('/users/me', userData),
};

// Calendar API
export const calendarAPI = {
    getCalendars: () => api.get('/calendars'),
    createCalendar: (calendarData) => api.post('/calendars', calendarData),
    getAuthUrl: (provider) => api.get(`/calendars/auth-url/${provider}`),
    authenticateCalendar: (authData) => api.post('/calendars/auth', authData),
    updateCalendar: (id, calendarData) => api.put(`/calendars/${id}`, calendarData),
    deleteCalendar: (id) => api.delete(`/calendars/${id}`),
    syncCalendar: (id) => api.post(`/calendars/${id}/sync`),
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
    getMeetings: () => api.get('/meetings'),
    createMeeting: (meetingData) => api.post('/meetings', meetingData),
    getMeeting: (id) => api.get(`/meetings/${id}`),
    updateMeeting: (id, meetingData) => api.put(`/meetings/${id}`, meetingData),
    deleteMeeting: (id) => api.delete(`/meetings/${id}`),
    getTeamAvailability: (teamId, startDate, endDate) =>
        api.get(`/meetings/team/${teamId}/availability?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`),
};

// Team API
export const teamAPI = {
    getTeams: () => api.get('/teams'),
    createTeam: (teamData) => api.post('/teams', teamData),
    getTeam: (id) => api.get(`/teams/${id}`),
    updateTeam: (id, teamData) => api.put(`/teams/${id}`, teamData),
    deleteTeam: (id) => api.delete(`/teams/${id}`),
    updateTeamMembers: (id, memberData) => api.put(`/teams/${id}/members`, memberData),
};

// Admin API
export const adminAPI = {
    getUsers: () => api.get('/admin/users'),
    createUser: (userData) => api.post('/admin/users', userData),
    getUser: (id) => api.get(`/admin/users/${id}`),
    updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    getStats: () => api.get('/admin/stats'),
    makeUserAdmin: (id) => api.put(`/admin/users/${id}/make-admin`),
    removeUserAdmin: (id) => api.put(`/admin/users/${id}/remove-admin`),
};

export default api; 