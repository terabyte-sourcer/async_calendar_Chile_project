import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    Grid,
    Button,
    CircularProgress,
    Chip,
    Divider
} from '@mui/material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const localizer = momentLocalizer(moment);

const CalendarView = () => {
    const { currentUser } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [calendars, setCalendars] = useState([]);
    const [selectedCalendars, setSelectedCalendars] = useState([]);

    useEffect(() => {
        const fetchCalendars = async () => {
            try {
                const response = await api.get('/calendars/');
                setCalendars(response.data);
                // By default, select all calendars
                setSelectedCalendars(response.data.map(cal => cal.id));
            } catch (error) {
                console.error('Error fetching calendars:', error);
            }
        };

        fetchCalendars();
    }, []);

    useEffect(() => {
        const fetchEvents = async () => {
            if (selectedCalendars.length === 0) {
                setEvents([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Fetch meetings that are associated with the selected calendars
                const response = await api.get('/meetings/');

                // Filter meetings by selected calendars
                const filteredMeetings = response.data.filter(meeting =>
                    selectedCalendars.includes(meeting.calendar_id)
                );

                // Transform meetings to events format for react-big-calendar
                const formattedEvents = filteredMeetings.map(meeting => ({
                    id: meeting.id,
                    title: meeting.title,
                    start: new Date(meeting.start_time),
                    end: new Date(meeting.end_time),
                    calendarId: meeting.calendar_id,
                    description: meeting.description || '',
                    location: meeting.location || '',
                }));

                setEvents(formattedEvents);
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [selectedCalendars]);

    const handleCalendarToggle = (calendarId) => {
        setSelectedCalendars(prev => {
            if (prev.includes(calendarId)) {
                return prev.filter(id => id !== calendarId);
            } else {
                return [...prev, calendarId];
            }
        });
    };

    const eventStyleGetter = (event) => {
        const calendar = calendars.find(cal => cal.id === event.calendarId);
        const backgroundColor = calendar?.color || '#3174ad';

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    return (
        <Paper elevation={3} sx={{ p: 3, height: 'calc(100vh - 200px)' }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h5" gutterBottom>
                    Calendar
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {calendars.map(calendar => (
                        <Chip
                            key={calendar.id}
                            label={calendar.name}
                            onClick={() => handleCalendarToggle(calendar.id)}
                            color={selectedCalendars.includes(calendar.id) ? "primary" : "default"}
                            variant={selectedCalendars.includes(calendar.id) ? "filled" : "outlined"}
                            sx={{
                                backgroundColor: selectedCalendars.includes(calendar.id) ? calendar.color || '#1976d2' : 'transparent',
                                color: selectedCalendars.includes(calendar.id) ? 'white' : 'inherit',
                                '&:hover': {
                                    backgroundColor: selectedCalendars.includes(calendar.id) ? calendar.color || '#1976d2' : 'rgba(0, 0, 0, 0.08)',
                                }
                            }}
                        />
                    ))}
                </Box>
                <Divider sx={{ mb: 2 }} />
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70%' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 'calc(100% - 80px)' }}
                    eventPropGetter={eventStyleGetter}
                    views={['month', 'week', 'day', 'agenda']}
                    popup
                    tooltipAccessor="description"
                />
            )}
        </Paper>
    );
};

export default CalendarView; 