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
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Switch,
    FormControlLabel,
    Chip
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    SupervisorAccount as AdminIcon,
    Person as UserIcon,
    Group as TeamIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const TabPanel = (props) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`admin-tabpanel-${index}`}
            aria-labelledby={`admin-tab-${index}`}
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

const AdminPanel = () => {
    const { currentUser } = useContext(AuthContext);
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Users state
    const [users, setUsers] = useState([]);
    const [openUserDialog, setOpenUserDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userFormData, setUserFormData] = useState({
        name: '',
        email: '',
        password: '',
        is_superadmin: false
    });

    // Teams state
    const [teams, setTeams] = useState([]);

    // Settings state
    const [settings, setSettings] = useState({
        allow_registration: true,
        require_email_verification: true,
        default_calendar_sync_interval: 30,
        smtp_server: '',
        smtp_port: 587,
        smtp_username: '',
        smtp_password: '',
        smtp_from_email: ''
    });

    useEffect(() => {
        if (tabValue === 0) {
            fetchUsers();
        } else if (tabValue === 1) {
            fetchTeams();
        } else if (tabValue === 2) {
            fetchSettings();
        }
    }, [tabValue]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setError(null);
        setSuccess(null);
    };

    // User management functions
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/admin/users');
            setUsers(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenUserDialog = (user = null) => {
        if (user) {
            // Edit mode
            setSelectedUser(user);
            setUserFormData({
                name: user.name,
                email: user.email,
                password: '', // Don't populate password for security
                is_superadmin: user.is_superadmin || false
            });
        } else {
            // Create mode
            setSelectedUser(null);
            setUserFormData({
                name: '',
                email: '',
                password: '',
                is_superadmin: false
            });
        }
        setOpenUserDialog(true);
    };

    const handleCloseUserDialog = () => {
        setOpenUserDialog(false);
    };

    const handleUserInputChange = (field, value) => {
        setUserFormData({
            ...userFormData,
            [field]: value
        });
    };

    const handleSubmitUser = async () => {
        // Validate form
        if (!userFormData.name || !userFormData.email || (!selectedUser && !userFormData.password)) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (selectedUser) {
                // Update existing user
                const dataToSend = { ...userFormData };
                if (!dataToSend.password) {
                    delete dataToSend.password; // Don't send empty password
                }
                await api.put(`/api/admin/users/${selectedUser.id}`, dataToSend);
                setSuccess('User updated successfully');
            } else {
                // Create new user
                await api.post('/api/admin/users', userFormData);
                setSuccess('User created successfully');
            }

            // Refresh the list
            fetchUsers();
            handleCloseUserDialog();
        } catch (err) {
            console.error('Error saving user:', err);
            setError('Failed to save user. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            setLoading(true);
            try {
                await api.delete(`/api/admin/users/${id}`);
                fetchUsers();
                setSuccess('User deleted successfully');
            } catch (err) {
                console.error('Error deleting user:', err);
                setError('Failed to delete user. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleToggleAdmin = async (user) => {
        setLoading(true);
        try {
            if (user.is_superadmin) {
                await api.put(`/api/admin/users/${user.id}/remove-admin`);
            } else {
                await api.put(`/api/admin/users/${user.id}/make-admin`);
            }
            fetchUsers();
            setSuccess(`User ${user.is_superadmin ? 'removed from' : 'added to'} administrators`);
        } catch (err) {
            console.error('Error updating user admin status:', err);
            setError('Failed to update user admin status. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Team management functions
    const fetchTeams = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/teams');
            setTeams(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching teams:', err);
            setError('Failed to load teams. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Settings management functions
    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/admin/settings');
            setSettings(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError('Failed to load settings. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingsChange = (field, value) => {
        setSettings({
            ...settings,
            [field]: value
        });
    };

    const handleSaveSettings = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await api.put('/api/admin/settings', settings);
            setSuccess('Settings updated successfully');
        } catch (err) {
            console.error('Error saving settings:', err);
            setError('Failed to save settings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="admin tabs"
                    centered
                >
                    <Tab icon={<UserIcon />} label="Users" />
                    <Tab icon={<TeamIcon />} label="Teams" />
                    <Tab icon={<SettingsIcon />} label="Settings" />
                </Tabs>

                {error && (
                    <Alert severity="error" sx={{ mx: 3, mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mx: 3, mt: 2 }}>
                        {success}
                    </Alert>
                )}

                {/* Users Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenUserDialog()}
                        >
                            Add User
                        </Button>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : users.length === 0 ? (
                        <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body1">
                                No users found. Click the "Add User" button to create one.
                            </Typography>
                        </Paper>
                    ) : (
                        <List>
                            {users.map((user) => (
                                <ListItem
                                    key={user.id}
                                    divider
                                    secondaryAction={
                                        <Box>
                                            <IconButton
                                                edge="end"
                                                aria-label="toggle-admin"
                                                onClick={() => handleToggleAdmin(user)}
                                                disabled={user.id === currentUser?.id}
                                                sx={{ mr: 1 }}
                                            >
                                                <AdminIcon color={user.is_superadmin ? "primary" : "action"} />
                                            </IconButton>
                                            <IconButton
                                                edge="end"
                                                aria-label="edit"
                                                onClick={() => handleOpenUserDialog(user)}
                                                sx={{ mr: 1 }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                edge="end"
                                                aria-label="delete"
                                                onClick={() => handleDeleteUser(user.id)}
                                                disabled={user.id === currentUser?.id}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    }
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {user.name}
                                                {user.is_superadmin && (
                                                    <Chip
                                                        label="Admin"
                                                        size="small"
                                                        color="primary"
                                                        sx={{ ml: 1 }}
                                                    />
                                                )}
                                                {user.id === currentUser?.id && (
                                                    <Chip
                                                        label="You"
                                                        size="small"
                                                        color="secondary"
                                                        sx={{ ml: 1 }}
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={user.email}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </TabPanel>

                {/* Teams Tab */}
                <TabPanel value={tabValue} index={1}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : teams.length === 0 ? (
                        <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body1">
                                No teams found. Teams can be created from the Teams page.
                            </Typography>
                        </Paper>
                    ) : (
                        <List>
                            {teams.map((team) => (
                                <ListItem key={team.id} divider>
                                    <ListItemText
                                        primary={team.name}
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {team.description || 'No description'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Members: {team.member_count || 0}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </TabPanel>

                {/* Settings Tab */}
                <TabPanel value={tabValue} index={2}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                General Settings
                            </Typography>
                            <Paper sx={{ p: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={settings.allow_registration}
                                                    onChange={(e) => handleSettingsChange('allow_registration', e.target.checked)}
                                                />
                                            }
                                            label="Allow Public Registration"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={settings.require_email_verification}
                                                    onChange={(e) => handleSettingsChange('require_email_verification', e.target.checked)}
                                                />
                                            }
                                            label="Require Email Verification"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Default Calendar Sync Interval (minutes)"
                                            type="number"
                                            value={settings.default_calendar_sync_interval}
                                            onChange={(e) => handleSettingsChange('default_calendar_sync_interval', parseInt(e.target.value))}
                                            fullWidth
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Email Settings (SMTP)
                            </Typography>
                            <Paper sx={{ p: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="SMTP Server"
                                            value={settings.smtp_server}
                                            onChange={(e) => handleSettingsChange('smtp_server', e.target.value)}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="SMTP Port"
                                            type="number"
                                            value={settings.smtp_port}
                                            onChange={(e) => handleSettingsChange('smtp_port', parseInt(e.target.value))}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="SMTP Username"
                                            value={settings.smtp_username}
                                            onChange={(e) => handleSettingsChange('smtp_username', e.target.value)}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="SMTP Password"
                                            type="password"
                                            value={settings.smtp_password}
                                            onChange={(e) => handleSettingsChange('smtp_password', e.target.value)}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="From Email Address"
                                            value={settings.smtp_from_email}
                                            onChange={(e) => handleSettingsChange('smtp_from_email', e.target.value)}
                                            fullWidth
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Button
                                    variant="contained"
                                    onClick={handleSaveSettings}
                                    disabled={loading}
                                >
                                    Save Settings
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </TabPanel>
            </Paper>

            {/* Add/Edit User Dialog */}
            <Dialog open={openUserDialog} onClose={handleCloseUserDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedUser ? 'Edit User' : 'Add New User'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                label="Full Name"
                                value={userFormData.name}
                                onChange={(e) => handleUserInputChange('name', e.target.value)}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Email Address"
                                type="email"
                                value={userFormData.email}
                                onChange={(e) => handleUserInputChange('email', e.target.value)}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label={selectedUser ? "New Password (leave blank to keep current)" : "Password"}
                                type="password"
                                value={userFormData.password}
                                onChange={(e) => handleUserInputChange('password', e.target.value)}
                                fullWidth
                                required={!selectedUser}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={userFormData.is_superadmin}
                                        onChange={(e) => handleUserInputChange('is_superadmin', e.target.checked)}
                                        disabled={selectedUser && selectedUser.id === currentUser?.id}
                                    />
                                }
                                label="Administrator Access"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseUserDialog}>Cancel</Button>
                    <Button onClick={handleSubmitUser} variant="contained">
                        {selectedUser ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminPanel; 