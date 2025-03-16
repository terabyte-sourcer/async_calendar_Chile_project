import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Check if token is expired
                    const decodedToken = jwtDecode(token);
                    const currentTime = Date.now() / 1000;

                    if (decodedToken.exp < currentTime) {
                        // Token is expired
                        logout();
                    } else {
                        // Set auth header
                        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                        // Get user info
                        const response = await axios.get('/api/users/me');
                        setUser(response.data);
                        setIsAuthenticated(true);
                    }
                } catch (err) {
                    console.error('Auth error:', err);
                    logout();
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post('/api/auth/login/access-token', {
                username: email,
                password: password,
            });

            const { access_token } = response.data;
            localStorage.setItem('token', access_token);

            // Set auth header
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

            // Get user info
            const userResponse = await axios.get('/api/users/me');
            setUser(userResponse.data);
            setIsAuthenticated(true);
            setLoading(false);
            return true;
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
            setLoading(false);
            return false;
        }
    };

    const register = async (userData) => {
        setLoading(true);
        setError(null);
        try {
            await axios.post('/api/auth/register', userData);
            setLoading(false);
            return true;
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
            setLoading(false);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 