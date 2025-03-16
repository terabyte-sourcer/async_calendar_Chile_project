import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Context Providers
import { AuthProvider } from './context/AuthContext';

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

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" />;
    }
    return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token) {
        return <Navigate to="/login" />;
    }

    try {
        const user = JSON.parse(userStr);
        if (!user.is_superadmin) {
            return <Navigate to="/dashboard" />;
        }
        return children;
    } catch (error) {
        return <Navigate to="/login" />;
    }
};

function App() {
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route path="/" element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Navigate to="/dashboard" />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="calendars" element={<Calendars />} />
                        <Route path="availability" element={<Availability />} />
                        <Route path="meetings" element={<Meetings />} />
                        <Route path="teams" element={<Teams />} />
                        <Route path="teams/:id" element={<TeamDetail />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="admin" element={
                            <AdminRoute>
                                <Admin />
                            </AdminRoute>
                        } />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </AuthProvider>
        </LocalizationProvider>
    );
}

export default App; 