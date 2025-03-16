import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Layout
import Layout from './components/Layout/Layout';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Calendars from './pages/Calendars/Calendars';
import Availability from './pages/Availability/Availability';
import Meetings from './pages/Meetings/Meetings';
import Teams from './pages/Teams/Teams';
import TeamDetail from './pages/Teams/TeamDetail';
import Profile from './pages/Profile/Profile';
import Admin from './pages/Admin/Admin';
import NotFound from './pages/NotFound/NotFound';

// Auth Context
import { AuthProvider, useAuth } from './utils/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return children;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="calendars" element={<Calendars />} />
                <Route path="availability" element={<Availability />} />
                <Route path="meetings" element={<Meetings />} />
                <Route path="teams" element={<Teams />} />
                <Route path="teams/:id" element={<TeamDetail />} />
                <Route path="profile" element={<Profile />} />
                <Route path="admin" element={<Admin />} />
            </Route>

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

function App() {
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </LocalizationProvider>
    );
}

export default App; 