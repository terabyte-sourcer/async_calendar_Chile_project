import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                setCurrentUser(user);
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } catch (err) {
                console.error('Error parsing user data:', err);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }

        setLoading(false);
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);

        try {
            // Use FormData for OAuth2 compatibility
            const formData = new FormData();
            formData.append('username', email);  // OAuth2 expects 'username'
            formData.append('password', password);

            const response = await api.post('/api/auth/login', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const { access_token, token_type, user } = response.data;

            // Save token and user data
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));

            // Set default auth header for future requests
            api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

            setCurrentUser(user);
            return true;
        } catch (err) {
            console.error('Login error:', err);
            // Handle different types of error responses
            let errorMessage = 'Invalid email or password';
            if (err.response) {
                if (err.response.data && err.response.data.detail) {
                    errorMessage = typeof err.response.data.detail === 'string'
                        ? err.response.data.detail
                        : JSON.stringify(err.response.data.detail);
                } else if (err.response.status === 422) {
                    errorMessage = 'Validation error. Please check your input.';
                }
            }
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await authAPI.register(userData);
            return true;
        } catch (err) {
            console.error('Registration error:', err);
            // Handle different types of error responses
            let errorMessage = 'Registration failed. Please try again.';
            if (err.response) {
                if (err.response.data && err.response.data.detail) {
                    errorMessage = typeof err.response.data.detail === 'string'
                        ? err.response.data.detail
                        : JSON.stringify(err.response.data.detail);
                } else if (err.response.status === 422) {
                    errorMessage = 'Validation error. Please check your input.';
                }
            }
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        // Remove token and user data
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Remove auth header
        delete api.defaults.headers.common['Authorization'];

        setCurrentUser(null);
    };

    const updateUser = (userData) => {
        setCurrentUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const checkAuth = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setCurrentUser(null);
            return false;
        }

        try {
            const response = await api.get('/api/users/me');
            setCurrentUser(response.data);
            return true;
        } catch (err) {
            console.error('Auth check error:', err);
            logout();
            return false;
        }
    };

    const value = {
        currentUser,
        loading,
        error,
        login,
        register,
        logout,
        updateUser,
        checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider; 