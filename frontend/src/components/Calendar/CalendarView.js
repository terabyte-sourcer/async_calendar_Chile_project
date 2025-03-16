import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    CircularProgress,
    Alert,
    Grid,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, parseISO, addHours } from 'date-fns';
import api from '../../services/api';

const CalendarView = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [calendars, setCalendars] = useState([]);
    const [teams, setTeams] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_time: new Date(),
        end_time: addHours(new Date(), 1),
        calendar_id: '',
        team_id: null,
        attendees: []
    });

    useEffect(() => {
        fetchEvents();
        fetchCalendars();
        fetchTeams();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/meetings/');

            // Format events for FullCalendar
            const formattedEvents = response.data.map(event => ({
                id: event.id,
                title: event.title,
                start: event.start_time,
                end: event.end_time,
                description: event.description,
                calendar_id: event.calendar_id,
                team_id: event.team_id,
                attendees: event.attendees || [],
                extendedProps: {
                    originalEvent: event
                }
            }));

            setEvents(formattedEvents);
            setError(null);
        } catch (err) {
            console.error('Error fetching events:', err);
            setError('Failed to load calendar events. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCalendars = async () => {
        try {
            const response = await api.get('/api/calendars/');
            setCalendars(response.data);
        } catch (err) {
            console.error('Error fetching calendars:', err);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await api.get('/api/teams/');
            setTeams(response.data);
        } catch (err) {
            console.error('Error fetching teams:', err);
        }
    };

    const handleDateClick = (info) => {
        const startTime = new Date(info.date);
        setFormData({
            title: '',
            description: '',
            start_time: startTime,
            end_time: addHours(startTime, 1),
            calendar_id: calendars.length > 0 ? calendars[0].id : '',
            team_id: null,
            attendees: []
        });
        setSelectedEvent(null);
        setOpenDialog(true);
    };

    const handleEventClick = (info) => {
        const event = info.event.extendedProps.originalEvent;
        setFormData({
            title: event.title,
            description: event.description || '',
            start_time: parseISO(event.start_time),
            end_time: parseISO(event.end_time),
            calendar_id: event.calendar_id,
            team_id: event.team_id,
            attendees: event.attendees || []
        });
        setSelectedEvent(event);
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
        if (!formData.title || !formData.start_time || !formData.end_time || !formData.calendar_id) {
            setError('Please fill in all required fields');
            return;
        }

        // Format data for API
        const formattedData = {
            ...formData,
            start_time: format(formData.start_time, "yyyy-MM-dd'T'HH:mm:ss"),
            end_time: format(formData.end_time, "yyyy-MM-dd'T'HH:mm:ss")
        };

        try {
            if (selectedEvent) {
                // Update existing event
                await api.put(`/api/meetings/${selectedEvent.id}`, formattedData);
            } else {
                // Create new event
                await api.post('/api/meetings/', formattedData);
            }

            // Refresh events
            fetchEvents();
            handleCloseDialog();
            setError(null);
        } catch (err) {
            console.error('Error saving event:', err);
            setError('Failed to save event. Please try again.');
        }
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent || !window.confirm('Are you sure you want to delete this event?')) {
            return;
        }

        try {
            await api.delete(`/api/meetings/${selectedEvent.id}`);
            fetchEvents();
            handleCloseDialog();
        } catch (err) {
            console.error('Error deleting event:', err);
            setError('Failed to delete event. Please try again.');
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Paper sx={{ p: 2 }}>
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="timeGridWeek"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay'
                            }}
                            events={events}
                            dateClick={handleDateClick}
                            eventClick={handleEventClick}
                            height="auto"
                            aspectRatio={1.5}
                            editable={true}
                            selectable={true}
                            selectMirror={true}
                            dayMaxEvents={true}
                            weekends={true}
                            businessHours={{
                                daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
                                startTime: '08:00',
                                endTime: '18:00',
                            }}
                        />
                    </Paper>
                )}

                {/* Create/Edit Event Dialog */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>
                        {selectedEvent ? 'Edit Event' : 'Create New Event'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Title"
                                    value={formData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    fullWidth
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    fullWidth
                                    multiline
                                    rows={3}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <DatePicker
                                    label="Start Date & Time"
                                    value={formData.start_time}
                                    onChange={(newValue) => handleInputChange('start_time', newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth required />}
                                    showTimeSelect
                                    dateFormat="MMMM d, yyyy h:mm aa"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <DatePicker
                                    label="End Date & Time"
                                    value={formData.end_time}
                                    onChange={(newValue) => handleInputChange('end_time', newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth required />}
                                    showTimeSelect
                                    dateFormat="MMMM d, yyyy h:mm aa"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel id="calendar-label">Calendar</InputLabel>
                                    <Select
                                        labelId="calendar-label"
                                        value={formData.calendar_id}
                                        label="Calendar"
                                        onChange={(e) => handleInputChange('calendar_id', e.target.value)}
                                    >
                                        {calendars.map(calendar => (
                                            <MenuItem key={calendar.id} value={calendar.id}>
                                                {calendar.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="team-label">Team (Optional)</InputLabel>
                                    <Select
                                        labelId="team-label"
                                        value={formData.team_id || ''}
                                        label="Team (Optional)"
                                        onChange={(e) => handleInputChange('team_id', e.target.value || null)}
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        {teams.map(team => (
                                            <MenuItem key={team.id} value={team.id}>
                                                {team.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        {selectedEvent && (
                            <Button
                                onClick={handleDeleteEvent}
                                color="error"
                                sx={{ mr: 'auto' }}
                            >
                                Delete
                            </Button>
                        )}
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

export default CalendarView; 