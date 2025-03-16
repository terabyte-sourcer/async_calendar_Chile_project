import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Verify token expiration
                const decodedToken = jwt_decode(token);
                const currentTime = Date.now() / 1000;

                if (decodedToken.exp < currentTime) {
                    // Token expired
                    logout();
                } else {
                    // Set token in axios headers
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    // Fetch user data
                    fetchUserData();
                }
            } catch (error) {
                console.error('Error decoding token:', error);
                logout();
            }
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await api.get('/users/me');
            setCurrentUser(response.data);
        } catch (error) {
            console.error('Error fetching user data:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        setError('');
        try {
            const response = await api.post('/auth/login/access-token', {
                username: email,
                password: password
            });

            const { access_token } = response.data;

            // Store token in localStorage
            localStorage.setItem('token', access_token);

            // Set token in axios headers
            api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

            // Fetch user data
            await fetchUserData();

            return true;
        } catch (error) {
            console.error('Login error:', error);
            setError(error.response?.data?.detail || 'Failed to login. Please check your credentials.');
            return false;
        }
    };

    const register = async (name, email, password) => {
        setError('');
        try {
            await api.post('/users/', {
                name,
                email,
                password
            });

            // Login after successful registration
            return await login(email, password);
        } catch (error) {
            console.error('Registration error:', error);
            setError(error.response?.data?.detail || 'Failed to register. Please try again.');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setCurrentUser(null);
        navigate('/login');
    };

    const updateUserInfo = (userData) => {
        setCurrentUser(userData);
    };

    const value = {
        currentUser,
        loading,
        error,
        login,
        register,
        logout,
        updateUserInfo
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
} 