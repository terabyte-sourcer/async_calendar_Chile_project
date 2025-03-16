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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    CircularProgress,
    Alert,
    Snackbar,
    Chip,
    Tooltip
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Event as EventIcon,
    Group as GroupIcon,
    CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { format, parseISO, isAfter } from 'date-fns';

const MeetingManager = () => {
    const { currentUser } = useAuth();
    const [meetings, setMeetings] = useState([]);
    const [teams, setTeams] = useState([]);
    const [calendars, setCalendars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editMeetingId, setEditMeetingId] = useState(null);
    const [meetingData, setMeetingData] = useState({
        title: '',
        description: '',
        location: '',
        start_time: new Date(new Date().setHours(new Date().getHours() + 1)),
        end_time: new Date(new Date().setHours(new Date().getHours() + 2)),
        team_id: '',
        calendar_id: ''
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        fetchMeetings();
        fetchTeams();
        fetchCalendars();
    }, []);

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/meetings/');

            // Sort meetings by start time (most recent first)
            const sortedMeetings = response.data.sort((a, b) => {
                return new Date(b.start_time) - new Date(a.start_time);
            });

            setMeetings(sortedMeetings);
        } catch (error) {
            console.error('Error fetching meetings:', error);
            showSnackbar('Failed to load meetings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await api.get('/teams/');
            setTeams(response.data);
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    };

    const fetchCalendars = async () => {
        try {
            const response = await api.get('/calendars/');
            setCalendars(response.data);
        } catch (error) {
            console.error('Error fetching calendars:', error);
        }
    };

    const handleOpenDialog = (meeting = null) => {
        if (meeting) {
            setEditMeetingId(meeting.id);
            setMeetingData({
                title: meeting.title,
                description: meeting.description || '',
                location: meeting.location || '',
                start_time: parseISO(meeting.start_time),
                end_time: parseISO(meeting.end_time),
                team_id: meeting.team_id,
                calendar_id: meeting.calendar_id
            });
        } else {
            setEditMeetingId(null);
            setMeetingData({
                title: '',
                description: '',
                location: '',
                start_time: new Date(new Date().setHours(new Date().getHours() + 1)),
                end_time: new Date(new Date().setHours(new Date().getHours() + 2)),
                team_id: teams.length > 0 ? teams[0].id : '',
                calendar_id: calendars.length > 0 ? calendars[0].id : ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleInputChange = (field, value) => {
        setMeetingData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async () => {
        // Validate form
        if (!meetingData.title || !meetingData.team_id || !meetingData.calendar_id) {
            showSnackbar('Please fill in all required fields', 'error');
            return;
        }

        if (isAfter(meetingData.start_time, meetingData.end_time)) {
            showSnackbar('Start time cannot be after end time', 'error');
            return;
        }

        try {
            if (editMeetingId) {
                // Update existing meeting
                await api.put(`/meetings/${editMeetingId}`, meetingData);
                showSnackbar('Meeting updated successfully');
            } else {
                // Create new meeting
                await api.post('/meetings/', meetingData);
                showSnackbar('Meeting created successfully');
            }

            fetchMeetings();
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving meeting:', error);
            showSnackbar('Failed to save meeting', 'error');
        }
    };

    const handleDeleteMeeting = async (id) => {
        if (window.confirm('Are you sure you want to delete this meeting?')) {
            try {
                await api.delete(`/meetings/${id}`);
                showSnackbar('Meeting deleted successfully');
                fetchMeetings();
            } catch (error) {
                console.error('Error deleting meeting:', error);
                showSnackbar('Failed to delete meeting', 'error');
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

    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : 'Unknown Team';
    };

    const getCalendarName = (calendarId) => {
        const calendar = calendars.find(c => c.id === calendarId);
        return calendar ? calendar.name : 'Unknown Calendar';
    };

    const getCalendarColor = (calendarId) => {
        const calendar = calendars.find(c => c.id === calendarId);
        return calendar ? calendar.color || '#1976d2' : '#1976d2';
    };

    // Group meetings by date
    const groupMeetingsByDate = () => {
        const grouped = {};

        meetings.forEach(meeting => {
            const date = format(parseISO(meeting.start_time), 'yyyy-MM-dd');
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(meeting);
        });

        return grouped;
    };

    const groupedMeetings = groupMeetingsByDate();
    const dates = Object.keys(groupedMeetings).sort((a, b) => new Date(b) - new Date(a));

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5">Meeting Management</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Schedule Meeting
                    </Button>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : meetings.length === 0 ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        You haven't scheduled any meetings yet. Click "Schedule Meeting" to get started.
                    </Alert>
                ) : (
                    <List>
                        {dates.map(date => (
                            <React.Fragment key={date}>
                                <ListItem>
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                                            </Typography>
                                        }
                                    />
                                </ListItem>

                                {groupedMeetings[date].map(meeting => (
                                    <ListItem key={meeting.id} divider>
                                        <Box
                                            sx={{
                                                width: 4,
                                                height: '100%',
                                                backgroundColor: getCalendarColor(meeting.calendar_id),
                                                mr: 2,
                                                borderRadius: 1
                                            }}
                                        />
                                        <ListItemText
                                            primary={
                                                <Typography variant="h6">{meeting.title}</Typography>
                                            }
                                            secondary={
                                                <Box sx={{ mt: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                        <EventIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                                                        <Typography variant="body2">
                                                            {format(parseISO(meeting.start_time), 'h:mm a')} - {format(parseISO(meeting.end_time), 'h:mm a')}
                                                        </Typography>
                                                    </Box>

                                                    {meeting.location && (
                                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                            Location: {meeting.location}
                                                        </Typography>
                                                    )}

                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                                        <Chip
                                                            icon={<GroupIcon />}
                                                            label={getTeamName(meeting.team_id)}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                        <Chip
                                                            icon={<CalendarIcon />}
                                                            label={getCalendarName(meeting.calendar_id)}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{
                                                                borderColor: getCalendarColor(meeting.calendar_id),
                                                                color: getCalendarColor(meeting.calendar_id)
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <Tooltip title="Edit Meeting">
                                                <IconButton edge="end" onClick={() => handleOpenDialog(meeting)}>
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Meeting">
                                                <IconButton edge="end" onClick={() => handleDeleteMeeting(meeting.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </React.Fragment>
                        ))}
                    </List>
                )}

                {/* Add/Edit Meeting Dialog */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>{editMeetingId ? 'Edit Meeting' : 'Schedule New Meeting'}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    autoFocus
                                    margin="dense"
                                    label="Meeting Title"
                                    type="text"
                                    fullWidth
                                    variant="outlined"
                                    value={meetingData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    margin="dense"
                                    label="Description"
                                    type="text"
                                    fullWidth
                                    variant="outlined"
                                    multiline
                                    rows={3}
                                    value={meetingData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    margin="dense"
                                    label="Location"
                                    type="text"
                                    fullWidth
                                    variant="outlined"
                                    value={meetingData.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <DateTimePicker
                                    label="Start Time"
                                    value={meetingData.start_time}
                                    onChange={(newValue) => handleInputChange('start_time', newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth margin="dense" />}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <DateTimePicker
                                    label="End Time"
                                    value={meetingData.end_time}
                                    onChange={(newValue) => handleInputChange('end_time', newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth margin="dense" />}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth margin="dense">
                                    <InputLabel id="team-label">Team</InputLabel>
                                    <Select
                                        labelId="team-label"
                                        value={meetingData.team_id}
                                        label="Team"
                                        onChange={(e) => handleInputChange('team_id', e.target.value)}
                                        required
                                    >
                                        {teams.map((team) => (
                                            <MenuItem key={team.id} value={team.id}>
                                                {team.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth margin="dense">
                                    <InputLabel id="calendar-label">Calendar</InputLabel>
                                    <Select
                                        labelId="calendar-label"
                                        value={meetingData.calendar_id}
                                        label="Calendar"
                                        onChange={(e) => handleInputChange('calendar_id', e.target.value)}
                                        required
                                    >
                                        {calendars.map((calendar) => (
                                            <MenuItem key={calendar.id} value={calendar.id}>
                                                {calendar.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleSubmit} variant="contained" color="primary">
                            {editMeetingId ? 'Update Meeting' : 'Schedule Meeting'}
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
        </LocalizationProvider>
    );
};

export default MeetingManager; 