import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    CircularProgress,
    Divider,
    Tooltip,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const CalendarConnections = () => {
    const { currentUser } = useAuth();
    const [calendars, setCalendars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editCalendarId, setEditCalendarId] = useState(null);
    const [calendarData, setCalendarData] = useState({
        name: '',
        provider: 'google',
        color: '#1976d2'
    });
    const [syncingCalendar, setSyncingCalendar] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const providers = [
        { value: 'google', label: 'Google Calendar' },
        { value: 'outlook', label: 'Microsoft Outlook' },
        { value: 'caldav', label: 'CalDAV' }
    ];

    const colors = [
        '#1976d2', // Blue
        '#2e7d32', // Green
        '#c62828', // Red
        '#f57c00', // Orange
        '#6a1b9a', // Purple
        '#00838f', // Teal
        '#558b2f', // Light Green
        '#d81b60', // Pink
        '#4527a0', // Deep Purple
        '#00695c'  // Dark Teal
    ];

    useEffect(() => {
        fetchCalendars();
    }, []);

    const fetchCalendars = async () => {
        setLoading(true);
        try {
            const response = await api.get('/calendars/');
            setCalendars(response.data);
        } catch (error) {
            console.error('Error fetching calendars:', error);
            showSnackbar('Failed to load calendars', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (calendar = null) => {
        if (calendar) {
            setEditCalendarId(calendar.id);
            setCalendarData({
                name: calendar.name,
                provider: calendar.provider,
                color: calendar.color || '#1976d2'
            });
        } else {
            setEditCalendarId(null);
            setCalendarData({
                name: '',
                provider: 'google',
                color: '#1976d2'
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCalendarData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            if (editCalendarId) {
                // Update existing calendar
                await api.put(`/calendars/${editCalendarId}`, calendarData);
                showSnackbar('Calendar updated successfully');
            } else {
                // Create new calendar
                const response = await api.post('/calendars/', calendarData);

                // If it's a provider that requires OAuth, redirect to auth URL
                if (response.data.auth_url) {
                    window.location.href = response.data.auth_url;
                    return;
                }

                showSnackbar('Calendar created successfully');
            }

            fetchCalendars();
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving calendar:', error);
            showSnackbar('Failed to save calendar', 'error');
        }
    };

    const handleDeleteCalendar = async (id) => {
        if (window.confirm('Are you sure you want to delete this calendar?')) {
            try {
                await api.delete(`/calendars/${id}`);
                showSnackbar('Calendar deleted successfully');
                fetchCalendars();
            } catch (error) {
                console.error('Error deleting calendar:', error);
                showSnackbar('Failed to delete calendar', 'error');
            }
        }
    };

    const handleSyncCalendar = async (id) => {
        setSyncingCalendar(id);
        try {
            await api.post(`/calendars/${id}/sync`);
            showSnackbar('Calendar synced successfully');
        } catch (error) {
            console.error('Error syncing calendar:', error);
            showSnackbar('Failed to sync calendar', 'error');
        } finally {
            setSyncingCalendar(null);
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

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Calendar Connections</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Add Calendar
                </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : calendars.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                    You haven't connected any calendars yet. Click "Add Calendar" to get started.
                </Alert>
            ) : (
                <List>
                    {calendars.map((calendar) => (
                        <ListItem key={calendar.id} divider>
                            <Box
                                sx={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    backgroundColor: calendar.color || '#1976d2',
                                    mr: 2
                                }}
                            />
                            <ListItemText
                                primary={calendar.name}
                                secondary={`Provider: ${providers.find(p => p.value === calendar.provider)?.label || calendar.provider}`}
                            />
                            <ListItemSecondaryAction>
                                <Tooltip title="Sync Calendar">
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleSyncCalendar(calendar.id)}
                                        disabled={syncingCalendar === calendar.id}
                                    >
                                        {syncingCalendar === calendar.id ? (
                                            <CircularProgress size={24} />
                                        ) : (
                                            <RefreshIcon />
                                        )}
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit">
                                    <IconButton edge="end" onClick={() => handleOpenDialog(calendar)}>
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                    <IconButton edge="end" onClick={() => handleDeleteCalendar(calendar.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            )}

            {/* Add/Edit Calendar Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editCalendarId ? 'Edit Calendar' : 'Add Calendar'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        name="name"
                        label="Calendar Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={calendarData.name}
                        onChange={handleInputChange}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        select
                        margin="dense"
                        name="provider"
                        label="Calendar Provider"
                        fullWidth
                        variant="outlined"
                        value={calendarData.provider}
                        onChange={handleInputChange}
                        sx={{ mb: 2 }}
                        disabled={editCalendarId !== null}
                    >
                        {providers.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Typography variant="subtitle2" gutterBottom>
                        Calendar Color
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {colors.map((color) => (
                            <Box
                                key={color}
                                onClick={() => setCalendarData(prev => ({ ...prev, color }))}
                                sx={{
                                    width: 36,
                                    height: 36,
                                    backgroundColor: color,
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    border: calendarData.color === color ? '2px solid #000' : 'none',
                                    '&:hover': {
                                        opacity: 0.8
                                    }
                                }}
                            />
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {editCalendarId ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

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

export default CalendarConnections; 