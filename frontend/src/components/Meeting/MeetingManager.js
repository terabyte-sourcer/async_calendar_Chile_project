import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    CardActions,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete,
    IconButton,
    Divider,
    Tooltip
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const MeetingManager = () => {
    const { currentUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [calendars, setCalendars] = useState([]);
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState('upcoming');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_time: new Date(),
        end_time: new Date(new Date().setHours(new Date().getHours() + 1)),
        calendar_id: '',
        team_id: null,
        attendees: []
    });

    useEffect(() => {
        fetchMeetings();
        fetchCalendars();
        fetchTeams();
        fetchUsers();
    }, []);

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/meetings/');
            setMeetings(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching meetings:', err);
            setError('Failed to load meetings. Please try again later.');
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

    const fetchUsers = async () => {
        try {
            const response = await api.get('/api/users/list');
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleOpenDialog = (meeting = null) => {
        if (meeting) {
            // Edit mode
            setSelectedMeeting(meeting);
            setFormData({
                title: meeting.title,
                description: meeting.description || '',
                start_time: parseISO(meeting.start_time),
                end_time: parseISO(meeting.end_time),
                calendar_id: meeting.calendar_id,
                team_id: meeting.team_id,
                attendees: meeting.attendees || []
            });
        } else {
            // Create mode
            setSelectedMeeting(null);
            setFormData({
                title: '',
                description: '',
                start_time: new Date(),
                end_time: new Date(new Date().setHours(new Date().getHours() + 1)),
                calendar_id: calendars.length > 0 ? calendars[0].id : '',
                team_id: null,
                attendees: []
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setError(null);
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

        if (isAfter(formData.start_time, formData.end_time)) {
            setError('Start time cannot be after end time');
            return;
        }

        // Format data for API
        const formattedData = {
            ...formData,
            start_time: format(formData.start_time, "yyyy-MM-dd'T'HH:mm:ss"),
            end_time: format(formData.end_time, "yyyy-MM-dd'T'HH:mm:ss")
        };

        try {
            if (selectedMeeting) {
                // Update existing meeting
                await api.put(`/api/meetings/${selectedMeeting.id}`, formattedData);
                setSuccess('Meeting updated successfully');
            } else {
                // Create new meeting
                await api.post('/api/meetings/', formattedData);
                setSuccess('Meeting created successfully');
            }

            // Refresh meetings
            fetchMeetings();
            handleCloseDialog();
        } catch (err) {
            console.error('Error saving meeting:', err);
            setError('Failed to save meeting. Please try again.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
            try {
                await api.delete(`/api/meetings/${id}`);
                fetchMeetings();
                setSuccess('Meeting deleted successfully');
            } catch (err) {
                console.error('Error deleting meeting:', err);
                setError('Failed to delete meeting. Please try again.');
            }
        }
    };

    const handleFilterChange = (event) => {
        setFilter(event.target.value);
    };

    const filteredMeetings = () => {
        const now = new Date();

        switch (filter) {
            case 'upcoming':
                return meetings.filter(meeting => isAfter(parseISO(meeting.start_time), now));
            case 'past':
                return meetings.filter(meeting => isBefore(parseISO(meeting.end_time), now));
            case 'today':
                const today = new Date(now.setHours(0, 0, 0, 0));
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return meetings.filter(meeting =>
                    isAfter(parseISO(meeting.start_time), today) &&
                    isBefore(parseISO(meeting.start_time), tomorrow)
                );
            default:
                return meetings;
        }
    };

    const getCalendarName = (id) => {
        const calendar = calendars.find(cal => cal.id === id);
        return calendar ? calendar.name : 'Unknown Calendar';
    };

    const getTeamName = (id) => {
        if (!id) return null;
        const team = teams.find(team => team.id === id);
        return team ? team.name : 'Unknown Team';
    };

    const getUserName = (id) => {
        const user = users.find(user => user.id === id);
        return user ? user.name : 'Unknown User';
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box>
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

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel id="filter-label">Filter</InputLabel>
                        <Select
                            labelId="filter-label"
                            value={filter}
                            label="Filter"
                            onChange={handleFilterChange}
                        >
                            <MenuItem value="all">All Meetings</MenuItem>
                            <MenuItem value="upcoming">Upcoming Meetings</MenuItem>
                            <MenuItem value="past">Past Meetings</MenuItem>
                            <MenuItem value="today">Today's Meetings</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Create Meeting
                    </Button>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : filteredMeetings().length === 0 ? (
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body1">
                            No meetings found. Click the "Create Meeting" button to schedule a new meeting.
                        </Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={2}>
                        {filteredMeetings().map((meeting) => (
                            <Grid item xs={12} md={6} lg={4} key={meeting.id}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Typography variant="h6" component="div" noWrap>
                                                {meeting.title}
                                            </Typography>
                                            <Chip
                                                size="small"
                                                label={getCalendarName(meeting.calendar_id)}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {format(parseISO(meeting.start_time), 'MMM d, yyyy h:mm a')} - {format(parseISO(meeting.end_time), 'h:mm a')}
                                            </Typography>
                                        </Box>

                                        {meeting.team_id && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <GroupIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Team: {getTeamName(meeting.team_id)}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                mb: 2,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                            }}
                                        >
                                            {meeting.description || 'No description provided.'}
                                        </Typography>

                                        {meeting.attendees && meeting.attendees.length > 0 && (
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Attendees:
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                    {meeting.attendees.slice(0, 3).map(attendeeId => (
                                                        <Chip
                                                            key={attendeeId}
                                                            icon={<PersonIcon />}
                                                            label={getUserName(attendeeId)}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    ))}
                                                    {meeting.attendees.length > 3 && (
                                                        <Chip
                                                            label={`+${meeting.attendees.length - 3} more`}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        )}
                                    </CardContent>
                                    <Divider />
                                    <CardActions>
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => handleOpenDialog(meeting)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="small"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => handleDelete(meeting.id)}
                                        >
                                            Delete
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Create/Edit Meeting Dialog */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>
                        {selectedMeeting ? 'Edit Meeting' : 'Create New Meeting'}
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
                                <DateTimePicker
                                    label="Start Date & Time"
                                    value={formData.start_time}
                                    onChange={(newValue) => handleInputChange('start_time', newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth required />}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <DateTimePicker
                                    label="End Date & Time"
                                    value={formData.end_time}
                                    onChange={(newValue) => handleInputChange('end_time', newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth required />}
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

                            <Grid item xs={12}>
                                <Autocomplete
                                    multiple
                                    id="attendees"
                                    options={users}
                                    getOptionLabel={(option) => option.name}
                                    value={users.filter(user => formData.attendees.includes(user.id))}
                                    onChange={(event, newValue) => {
                                        handleInputChange('attendees', newValue.map(user => user.id));
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Attendees"
                                            placeholder="Add attendees"
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleSubmit} variant="contained">
                            {selectedMeeting ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
};

export default MeetingManager; 