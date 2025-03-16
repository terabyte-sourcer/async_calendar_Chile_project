import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    Button,
    Grid,
    TextField,
    CircularProgress,
    Divider,
    Alert,
    Snackbar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Avatar
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const UserProfile = () => {
    const { currentUser, updateUserInfo } = useAuth();
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        route_time_preference: 'fastest'
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        if (currentUser) {
            setUserData({
                name: currentUser.name || '',
                email: currentUser.email || '',
                password: '',
                confirmPassword: '',
                route_time_preference: currentUser.route_time_preference || 'fastest'
            });
        }
    }, [currentUser]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        if (userData.password && userData.password !== userData.confirmPassword) {
            showSnackbar('Passwords do not match', 'error');
            return;
        }

        setLoading(true);
        try {
            // Only include password if it's been changed
            const dataToUpdate = {
                name: userData.name,
                email: userData.email,
                route_time_preference: userData.route_time_preference
            };

            if (userData.password) {
                dataToUpdate.password = userData.password;
            }

            const response = await api.put('/users/me', dataToUpdate);

            // Update the user info in the auth context
            updateUserInfo(response.data);

            showSnackbar('Profile updated successfully');

            // Clear password fields
            setUserData(prev => ({
                ...prev,
                password: '',
                confirmPassword: ''
            }));
        } catch (error) {
            console.error('Error updating profile:', error);
            showSnackbar('Failed to update profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({
            ...prev,
            open: false
        }));
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase();
    };

    if (!currentUser) {
        return (
            <Paper elevation={3} sx={{ p: 3 }}>
                <Alert severity="info">Please log in to view your profile.</Alert>
            </Paper>
        );
    }

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                    sx={{
                        width: 80,
                        height: 80,
                        bgcolor: 'primary.main',
                        fontSize: '2rem',
                        mr: 2
                    }}
                >
                    {getInitials(currentUser.name || 'User')}
                </Avatar>
                <Box>
                    <Typography variant="h5">User Profile</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage your account information
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Name"
                            name="name"
                            value={userData.name}
                            onChange={handleInputChange}
                            margin="normal"
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={userData.email}
                            onChange={handleInputChange}
                            margin="normal"
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="New Password"
                            name="password"
                            type="password"
                            value={userData.password}
                            onChange={handleInputChange}
                            margin="normal"
                            helperText="Leave blank to keep current password"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Confirm New Password"
                            name="confirmPassword"
                            type="password"
                            value={userData.confirmPassword}
                            onChange={handleInputChange}
                            margin="normal"
                            disabled={!userData.password}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="route-preference-label">Route Time Preference</InputLabel>
                            <Select
                                labelId="route-preference-label"
                                name="route_time_preference"
                                value={userData.route_time_preference}
                                label="Route Time Preference"
                                onChange={handleInputChange}
                            >
                                <MenuItem value="fastest">Fastest Route</MenuItem>
                                <MenuItem value="shortest">Shortest Route</MenuItem>
                                <MenuItem value="balanced">Balanced</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Update Profile'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default UserProfile; 