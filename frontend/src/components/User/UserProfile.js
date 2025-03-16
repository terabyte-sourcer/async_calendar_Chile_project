import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Grid,
    CircularProgress,
    Alert,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Avatar,
    Tabs,
    Tab
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    width: 100,
    height: 100,
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.primary.main,
    fontSize: '2.5rem'
}));

const TabPanel = (props) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`profile-tabpanel-${index}`}
            aria-labelledby={`profile-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

const UserProfile = () => {
    const { currentUser, updateUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [tabValue, setTabValue] = useState(0);

    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        route_time_preference: 'morning'
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    useEffect(() => {
        if (currentUser) {
            setProfileData({
                name: currentUser.name || '',
                email: currentUser.email || '',
                route_time_preference: currentUser.route_time_preference || 'morning'
            });
        }
    }, [currentUser]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setError(null);
        setSuccess(null);
    };

    const handleProfileChange = (field, value) => {
        setProfileData({
            ...profileData,
            [field]: value
        });
    };

    const handlePasswordChange = (field, value) => {
        setPasswordData({
            ...passwordData,
            [field]: value
        });
    };

    const handleUpdateProfile = async () => {
        // Validate form
        if (!profileData.name || !profileData.email) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await api.put('/api/users/me', profileData);

            // Update the user in context
            updateUser(response.data);

            setSuccess('Profile updated successfully');
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        // Validate form
        if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
            setError('Please fill in all password fields');
            return;
        }

        if (passwordData.new_password !== passwordData.confirm_password) {
            setError('New passwords do not match');
            return;
        }

        if (passwordData.new_password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await api.put('/api/users/me/password', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });

            // Reset password fields
            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });

            setSuccess('Password updated successfully');
        } catch (err) {
            console.error('Error updating password:', err);
            setError('Failed to update password. Please check your current password and try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
            </Paper>
        );
    }

    return (
        <Box>
            <Paper sx={{ mb: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="profile tabs"
                        centered
                    >
                        <Tab icon={<EditIcon />} label="Profile Information" />
                        <Tab icon={<LockIcon />} label="Change Password" />
                        <Tab icon={<AccessTimeIcon />} label="Preferences" />
                    </Tabs>
                </Box>

                {/* Profile Information Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <StyledAvatar>
                            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                        </StyledAvatar>
                        <Typography variant="h5">{currentUser.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {currentUser.email}
                        </Typography>
                        {currentUser.is_superadmin && (
                            <Box sx={{ mt: 1 }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        bgcolor: 'error.main',
                                        color: 'white',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1
                                    }}
                                >
                                    Administrator
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="Full Name"
                                value={profileData.name}
                                onChange={(e) => handleProfileChange('name', e.target.value)}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Email Address"
                                type="email"
                                value={profileData.email}
                                onChange={(e) => handleProfileChange('email', e.target.value)}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={handleUpdateProfile}
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Change Password Tab */}
                <TabPanel value={tabValue} index={1}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="Current Password"
                                type="password"
                                value={passwordData.current_password}
                                onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="New Password"
                                type="password"
                                value={passwordData.new_password}
                                onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                                fullWidth
                                required
                                helperText="Password must be at least 8 characters long"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Confirm New Password"
                                type="password"
                                value={passwordData.confirm_password}
                                onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<LockIcon />}
                                    onClick={handleUpdatePassword}
                                    disabled={loading}
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Preferences Tab */}
                <TabPanel value={tabValue} index={2}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel id="route-time-preference-label">Route Time Preference</InputLabel>
                                <Select
                                    labelId="route-time-preference-label"
                                    value={profileData.route_time_preference}
                                    label="Route Time Preference"
                                    onChange={(e) => handleProfileChange('route_time_preference', e.target.value)}
                                >
                                    <MenuItem value="morning">Morning (8:00 - 12:00)</MenuItem>
                                    <MenuItem value="afternoon">Afternoon (12:00 - 17:00)</MenuItem>
                                    <MenuItem value="evening">Evening (17:00 - 21:00)</MenuItem>
                                    <MenuItem value="any">Any Time</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={handleUpdateProfile}
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save Preferences'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </TabPanel>
            </Paper>
        </Box>
    );
};

export default UserProfile; 