import axios from 'axios';

// Base API configuration
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token to requests
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

// Add a response interceptor to handle errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Unauthorized, clear token and redirect to login
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email, password) => api.post('/auth/login/access-token', { username: email, password }),
    register: (userData) => api.post('/auth/register', userData),
    verifyEmail: (token) => api.post(`/auth/verify-email/${token}`),
    requestVerificationEmail: () => api.post('/auth/request-verification-email'),
    resetPassword: (data) => api.post('/auth/reset-password', data),
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
    getAvailabilities: () => api.get('/availability'),
    createAvailability: (availabilityData) => api.post('/availability', availabilityData),
    updateAvailability: (id, availabilityData) => api.put(`/availability/${id}`, availabilityData),
    deleteAvailability: (id) => api.delete(`/availability/${id}`),
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