import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    CircularProgress,
    Alert,
    Snackbar,
    Chip
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { format, parse } from 'date-fns';

const weekdays = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' }
];

const AvailabilityManager = () => {
    const { currentUser } = useAuth();
    const [availabilities, setAvailabilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        day_of_week: 0,
        start_time: new Date('2023-01-01T09:00:00'),
        end_time: new Date('2023-01-01T17:00:00')
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        fetchAvailabilities();
    }, []);

    const fetchAvailabilities = async () => {
        setLoading(true);
        try {
            const response = await api.get('/availabilities/');

            // Sort availabilities by day of week and start time
            const sortedAvailabilities = response.data.sort((a, b) => {
                if (a.day_of_week !== b.day_of_week) {
                    return a.day_of_week - b.day_of_week;
                }
                return a.start_time.localeCompare(b.start_time);
            });

            setAvailabilities(sortedAvailabilities);
        } catch (error) {
            console.error('Error fetching availabilities:', error);
            showSnackbar('Failed to load availabilities', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const resetForm = () => {
        setFormData({
            day_of_week: 0,
            start_time: new Date('2023-01-01T09:00:00'),
            end_time: new Date('2023-01-01T17:00:00')
        });
        setEditMode(false);
        setEditId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Format times for API
        const formattedData = {
            ...formData,
            start_time: format(formData.start_time, 'HH:mm:ss'),
            end_time: format(formData.end_time, 'HH:mm:ss')
        };

        try {
            if (editMode) {
                await api.put(`/availabilities/${editId}`, formattedData);
                showSnackbar('Availability updated successfully');
            } else {
                await api.post('/availabilities/', formattedData);
                showSnackbar('Availability added successfully');
            }

            fetchAvailabilities();
            resetForm();
        } catch (error) {
            console.error('Error saving availability:', error);
            showSnackbar('Failed to save availability', 'error');
        }
    };

    const handleEdit = (availability) => {
        // Parse time strings to Date objects for the TimePicker
        const startTime = parse(availability.start_time, 'HH:mm:ss', new Date());
        const endTime = parse(availability.end_time, 'HH:mm:ss', new Date());

        setFormData({
            day_of_week: availability.day_of_week,
            start_time: startTime,
            end_time: endTime
        });

        setEditMode(true);
        setEditId(availability.id);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this availability?')) {
            try {
                await api.delete(`/availabilities/${id}`);
                showSnackbar('Availability deleted successfully');
                fetchAvailabilities();
            } catch (error) {
                console.error('Error deleting availability:', error);
                showSnackbar('Failed to delete availability', 'error');
            }
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

    // Group availabilities by day of week
    const groupedAvailabilities = availabilities.reduce((acc, availability) => {
        const day = availability.day_of_week;
        if (!acc[day]) {
            acc[day] = [];
        }
        acc[day].push(availability);
        return acc;
    }, {});

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Manage Your Availability
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                {editMode ? 'Edit Availability' : 'Add New Availability'}
                            </Typography>
                            <form onSubmit={handleSubmit}>
                                <FormControl fullWidth margin="normal">
                                    <InputLabel id="day-of-week-label">Day of Week</InputLabel>
                                    <Select
                                        labelId="day-of-week-label"
                                        value={formData.day_of_week}
                                        label="Day of Week"
                                        onChange={(e) => handleInputChange('day_of_week', e.target.value)}
                                    >
                                        {weekdays.map((day) => (
                                            <MenuItem key={day.value} value={day.value}>
                                                {day.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                    <TimePicker
                                        label="Start Time"
                                        value={formData.start_time}
                                        onChange={(newValue) => handleInputChange('start_time', newValue)}
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                    />

                                    <TimePicker
                                        label="End Time"
                                        value={formData.end_time}
                                        onChange={(newValue) => handleInputChange('end_time', newValue)}
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                    />
                                </Box>

                                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        startIcon={editMode ? <EditIcon /> : <AddIcon />}
                                    >
                                        {editMode ? 'Update' : 'Add'}
                                    </Button>

                                    {editMode && (
                                        <Button
                                            variant="outlined"
                                            onClick={resetForm}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </Box>
                            </form>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper elevation={1} sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Your Availability Schedule
                            </Typography>

                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress />
                                </Box>
                            ) : availabilities.length === 0 ? (
                                <Alert severity="info">
                                    You haven't set any availability yet. Add your available time slots to get started.
                                </Alert>
                            ) : (
                                <List>
                                    {weekdays.map((day) => {
                                        const dayAvailabilities = groupedAvailabilities[day.value] || [];

                                        if (dayAvailabilities.length === 0) {
                                            return null;
                                        }

                                        return (
                                            <React.Fragment key={day.value}>
                                                <ListItem>
                                                    <ListItemText
                                                        primary={
                                                            <Typography variant="subtitle1" fontWeight="bold">
                                                                {day.label}
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItem>

                                                {dayAvailabilities.map((availability) => (
                                                    <ListItem key={availability.id} sx={{ pl: 4 }}>
                                                        <ListItemText
                                                            primary={
                                                                <Chip
                                                                    label={`${availability.start_time.substring(0, 5)} - ${availability.end_time.substring(0, 5)}`}
                                                                    color="primary"
                                                                    variant="outlined"
                                                                />
                                                            }
                                                        />
                                                        <ListItemSecondaryAction>
                                                            <IconButton edge="end" onClick={() => handleEdit(availability)}>
                                                                <EditIcon />
                                                            </IconButton>
                                                            <IconButton edge="end" onClick={() => handleDelete(availability.id)}>
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </ListItemSecondaryAction>
                                                    </ListItem>
                                                ))}

                                                <Divider component="li" />
                                            </React.Fragment>
                                        );
                                    })}
                                </List>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

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
        </LocalizationProvider>
    );
};

export default AvailabilityManager; 