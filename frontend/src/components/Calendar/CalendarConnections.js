import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Paper,
    Typography,
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Divider,
    Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SyncIcon from '@mui/icons-material/Sync';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const CALENDAR_TYPES = [
    { value: 'google', label: 'Google Calendar' },
    { value: 'outlook', label: 'Microsoft Outlook' },
    { value: 'caldav', label: 'CalDAV' }
];

const CalendarConnections = () => {
    const { currentUser } = useContext(AuthContext);
    const [calendars, setCalendars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openAuthDialog, setOpenAuthDialog] = useState(false);
    const [selectedCalendar, setSelectedCalendar] = useState(null);
    const [authUrl, setAuthUrl] = useState('');
    const [authCode, setAuthCode] = useState('');
    const [syncingCalendar, setSyncingCalendar] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        calendar_type: '',
        color: '#3174ad'
    });

    useEffect(() => {
        fetchCalendars();
    }, []);

    const fetchCalendars = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/calendars/');
            setCalendars(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching calendars:', err);
            setError('Failed to load your calendars. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (calendar = null) => {
        if (calendar) {
            // Edit mode
            setSelectedCalendar(calendar);
            setFormData({
                name: calendar.name,
                calendar_type: calendar.calendar_type,
                color: calendar.color || '#3174ad'
            });
        } else {
            // Create mode
            setSelectedCalendar(null);
            setFormData({
                name: '',
                calendar_type: '',
                color: '#3174ad'
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleInputChange = (field, value) => {
        setFormData({
            ...formData,
            [field]: value
        });
    };

    const handleSubmit = async () => {
        // Validate form
        if (!formData.name || !formData.calendar_type) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            if (selectedCalendar) {
                // Update existing calendar
                await api.put(`/api/calendars/${selectedCalendar.id}`, formData);
            } else {
                // Create new calendar
                const response = await api.post('/api/calendars/', formData);

                // If calendar requires authentication, open auth dialog
                if (response.data.auth_url) {
                    setAuthUrl(response.data.auth_url);
                    setSelectedCalendar(response.data);
                    handleCloseDialog();
                    setOpenAuthDialog(true);
                    return;
                }
            }

            // Refresh the list
            fetchCalendars();
            handleCloseDialog();
            setError(null);
        } catch (err) {
            console.error('Error saving calendar:', err);
            setError('Failed to save calendar. Please try again.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this calendar? All associated events will also be deleted.')) {
            try {
                await api.delete(`/api/calendars/${id}`);
                fetchCalendars();
            } catch (err) {
                console.error('Error deleting calendar:', err);
                setError('Failed to delete calendar. Please try again.');
            }
        }
    };

    const handleAuthSubmit = async () => {
        if (!authCode || !selectedCalendar) {
            setError('Please enter the authentication code');
            return;
        }

        try {
            await api.post(`/api/calendars/${selectedCalendar.id}/authenticate`, {
                auth_code: authCode
            });

            setOpenAuthDialog(false);
            setAuthCode('');
            fetchCalendars();
        } catch (err) {
            console.error('Error authenticating calendar:', err);
            setError('Failed to authenticate calendar. Please check your code and try again.');
        }
    };

    const handleSync = async (id) => {
        setSyncingCalendar(id);
        try {
            await api.post(`/api/calendars/${id}/sync`);
            fetchCalendars();
        } catch (err) {
            console.error('Error syncing calendar:', err);
            setError('Failed to sync calendar. Please try again.');
        } finally {
            setSyncingCalendar(null);
        }
    };

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Connected Calendars</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Connect Calendar
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : calendars.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1">
                        You haven't connected any calendars yet. Click the "Connect Calendar" button to get started.
                    </Typography>
                </Paper>
            ) : (
                <List component={Paper}>
                    {calendars.map((calendar) => (
                        <React.Fragment key={calendar.id}>
                            <ListItem>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box
                                        sx={{
                                            width: 16,
                                            height: 16,
                                            borderRadius: '50%',
                                            bgcolor: calendar.color || '#3174ad',
                                            mr: 2
                                        }}
                                    />
                                    <ListItemText
                                        primary={calendar.name}
                                        secondary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                <Chip
                                                    size="small"
                                                    label={CALENDAR_TYPES.find(t => t.value === calendar.calendar_type)?.label || calendar.calendar_type}
                                                    sx={{ mr: 1 }}
                                                />
                                                {calendar.last_synced && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Last synced: {new Date(calendar.last_synced).toLocaleString()}
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                    />
                                </Box>
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleSync(calendar.id)}
                                        disabled={syncingCalendar === calendar.id}
                                        aria-label="sync"
                                    >
                                        {syncingCalendar === calendar.id ? (
                                            <CircularProgress size={24} />
                                        ) : (
                                            <SyncIcon />
                                        )}
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleOpenDialog(calendar)}
                                        aria-label="edit"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleDelete(calendar.id)}
                                        aria-label="delete"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                            <Divider component="li" />
                        </React.Fragment>
                    ))}
                </List>
            )}

            {/* Add/Edit Calendar Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedCalendar ? 'Edit Calendar' : 'Connect New Calendar'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <TextField
                            label="Calendar Name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            fullWidth
                            margin="normal"
                            required
                        />

                        <FormControl fullWidth margin="normal" required>
                            <InputLabel id="calendar-type-label">Calendar Type</InputLabel>
                            <Select
                                labelId="calendar-type-label"
                                value={formData.calendar_type}
                                label="Calendar Type"
                                onChange={(e) => handleInputChange('calendar_type', e.target.value)}
                                disabled={selectedCalendar !== null} // Can't change type after creation
                            >
                                {CALENDAR_TYPES.map(type => (
                                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Calendar Color"
                            type="color"
                            value={formData.color}
                            onChange={(e) => handleInputChange('color', e.target.value)}
                            fullWidth
                            margin="normal"
                            sx={{ mt: 2 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {selectedCalendar ? 'Update' : 'Connect'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Authentication Dialog */}
            <Dialog open={openAuthDialog} maxWidth="md" fullWidth>
                <DialogTitle>Authenticate Calendar</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Please click the link below to authorize access to your calendar, then enter the provided code.
                        </Alert>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Authorization Link:
                            </Typography>
                            <Box
                                component="a"
                                href={authUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                    display: 'block',
                                    p: 2,
                                    bgcolor: 'background.paper',
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    wordBreak: 'break-all'
                                }}
                            >
                                {authUrl}
                            </Box>
                        </Box>

                        <TextField
                            label="Authorization Code"
                            value={authCode}
                            onChange={(e) => setAuthCode(e.target.value)}
                            fullWidth
                            margin="normal"
                            required
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAuthDialog(false)}>Cancel</Button>
                    <Button onClick={handleAuthSubmit} variant="contained">
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CalendarConnections; 