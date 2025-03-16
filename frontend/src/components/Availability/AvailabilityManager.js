import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    IconButton,
    Alert,
    CircularProgress
} from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { format, parseISO } from 'date-fns';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const weekdays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
];

const AvailabilityManager = () => {
    const { currentUser } = useContext(AuthContext);
    const [availabilities, setAvailabilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingAvailability, setEditingAvailability] = useState(null);

    const [formData, setFormData] = useState({
        day_of_week: '',
        start_time: null,
        end_time: null,
        is_recurring: true
    });

    useEffect(() => {
        fetchAvailabilities();
    }, []);

    const fetchAvailabilities = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/availabilities/');
            setAvailabilities(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching availabilities:', err);
            setError('Failed to load your availability data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (availability = null) => {
        if (availability) {
            // Edit mode
            setEditingAvailability(availability);
            setFormData({
                day_of_week: availability.day_of_week,
                start_time: parseISO(`2023-01-01T${availability.start_time}`),
                end_time: parseISO(`2023-01-01T${availability.end_time}`),
                is_recurring: availability.is_recurring
            });
        } else {
            // Create mode
            setEditingAvailability(null);
            setFormData({
                day_of_week: '',
                start_time: null,
                end_time: null,
                is_recurring: true
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
        if (!formData.day_of_week || !formData.start_time || !formData.end_time) {
            setError('Please fill in all required fields');
            return;
        }

        // Format times for API
        const formattedData = {
            ...formData,
            start_time: format(formData.start_time, 'HH:mm:ss'),
            end_time: format(formData.end_time, 'HH:mm:ss')
        };

        try {
            if (editingAvailability) {
                // Update existing availability
                await api.put(`/api/availabilities/${editingAvailability.id}`, formattedData);
            } else {
                // Create new availability
                await api.post('/api/availabilities/', formattedData);
            }

            // Refresh the list
            fetchAvailabilities();
            handleCloseDialog();
            setError(null);
        } catch (err) {
            console.error('Error saving availability:', err);
            setError('Failed to save availability. Please try again.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this availability?')) {
            try {
                await api.delete(`/api/availabilities/${id}`);
                fetchAvailabilities();
            } catch (err) {
                console.error('Error deleting availability:', err);
                setError('Failed to delete availability. Please try again.');
            }
        }
    };

    const renderAvailabilityList = () => {
        if (availabilities.length === 0) {
            return (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1">
                        You haven't set any availability yet. Click the "Add Availability" button to get started.
                    </Typography>
                </Paper>
            );
        }

        // Group availabilities by day of week
        const groupedAvailabilities = availabilities.reduce((acc, availability) => {
            if (!acc[availability.day_of_week]) {
                acc[availability.day_of_week] = [];
            }
            acc[availability.day_of_week].push(availability);
            return acc;
        }, {});

        return (
            <Box>
                {weekdays.map(day => {
                    const dayAvailabilities = groupedAvailabilities[day] || [];
                    if (dayAvailabilities.length === 0) return null;

                    return (
                        <Paper key={day} sx={{ p: 2, mb: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>{day}</Typography>
                            {dayAvailabilities.map(availability => (
                                <Box
                                    key={availability.id}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        p: 1,
                                        borderRadius: 1,
                                        mb: 1,
                                        bgcolor: 'background.paper',
                                        '&:hover': { bgcolor: 'action.hover' }
                                    }}
                                >
                                    <Typography>
                                        {availability.start_time.substring(0, 5)} - {availability.end_time.substring(0, 5)}
                                        {availability.is_recurring ? ' (Recurring)' : ' (One-time)'}
                                    </Typography>
                                    <Box>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleOpenDialog(availability)}
                                            aria-label="edit"
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(availability.id)}
                                            aria-label="delete"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            ))}
                        </Paper>
                    );
                })}
            </Box>
        );
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Add Availability
                    </Button>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    renderAvailabilityList()
                )}

                {/* Add/Edit Dialog */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {editingAvailability ? 'Edit Availability' : 'Add New Availability'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel id="day-of-week-label">Day of Week</InputLabel>
                                    <Select
                                        labelId="day-of-week-label"
                                        value={formData.day_of_week}
                                        label="Day of Week"
                                        onChange={(e) => handleInputChange('day_of_week', e.target.value)}
                                    >
                                        {weekdays.map(day => (
                                            <MenuItem key={day} value={day}>{day}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TimePicker
                                    label="Start Time"
                                    value={formData.start_time}
                                    onChange={(newValue) => handleInputChange('start_time', newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TimePicker
                                    label="End Time"
                                    value={formData.end_time}
                                    onChange={(newValue) => handleInputChange('end_time', newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel id="recurring-label">Recurring</InputLabel>
                                    <Select
                                        labelId="recurring-label"
                                        value={formData.is_recurring}
                                        label="Recurring"
                                        onChange={(e) => handleInputChange('is_recurring', e.target.value)}
                                    >
                                        <MenuItem value={true}>Yes (Weekly)</MenuItem>
                                        <MenuItem value={false}>No (One-time)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleSubmit} variant="contained">
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
};

export default AvailabilityManager; 