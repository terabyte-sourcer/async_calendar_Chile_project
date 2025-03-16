import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    CircularProgress,
    Paper,
} from '@mui/material';
import {
    Event as EventIcon,
    CalendarMonth as CalendarIcon,
    Group as GroupIcon,
    AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../utils/AuthContext';
import { meetingAPI, calendarAPI, teamAPI } from '../../services/api';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [meetings, setMeetings] = useState([]);
    const [calendars, setCalendars] = useState([]);
    const [teams, setTeams] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch upcoming meetings
                const meetingsResponse = await meetingAPI.getMeetings();
                setMeetings(meetingsResponse.data.slice(0, 5)); // Get only 5 most recent

                // Fetch calendars
                const calendarsResponse = await calendarAPI.getCalendars();
                setCalendars(calendarsResponse.data);

                // Fetch teams
                const teamsResponse = await teamAPI.getTeams();
                setTeams(teamsResponse.data);

                setLoading(false);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to load dashboard data. Please try again later.');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Welcome, {user?.name || 'User'}!
            </Typography>

            <Grid container spacing={3}>
                {/* Quick Stats */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Calendars
                            </Typography>
                            <Typography variant="h3" align="center" sx={{ my: 2 }}>
                                {calendars.length}
                            </Typography>
                        </CardContent>
                        <Divider />
                        <CardActions>
                            <Button size="small" onClick={() => navigate('/calendars')}>
                                Manage Calendars
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Upcoming Meetings
                            </Typography>
                            <Typography variant="h3" align="center" sx={{ my: 2 }}>
                                {meetings.length}
                            </Typography>
                        </CardContent>
                        <Divider />
                        <CardActions>
                            <Button size="small" onClick={() => navigate('/meetings')}>
                                View All Meetings
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Teams
                            </Typography>
                            <Typography variant="h3" align="center" sx={{ my: 2 }}>
                                {teams.length}
                            </Typography>
                        </CardContent>
                        <Divider />
                        <CardActions>
                            <Button size="small" onClick={() => navigate('/teams')}>
                                Manage Teams
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

                {/* Upcoming Meetings */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Upcoming Meetings
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        {meetings.length === 0 ? (
                            <Typography variant="body1" sx={{ py: 2, textAlign: 'center' }}>
                                No upcoming meetings
                            </Typography>
                        ) : (
                            <List>
                                {meetings.map((meeting) => (
                                    <ListItem key={meeting.id} alignItems="flex-start" sx={{ borderBottom: '1px solid #eee' }}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                <EventIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={meeting.title}
                                            secondary={
                                                <>
                                                    <Typography component="span" variant="body2" color="text.primary">
                                                        {format(new Date(meeting.start_time), 'MMM dd, yyyy • h:mm a')}
                                                    </Typography>
                                                    {" — "}
                                                    {meeting.meeting_type === 'virtual' ? 'Virtual Meeting' : 'In-Person Meeting'}
                                                </>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}

                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Button variant="contained" onClick={() => navigate('/meetings')}>
                                View All Meetings
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Availability */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Your Availability
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <AccessTimeIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                                <Typography variant="body1" gutterBottom>
                                    Set your availability to let others know when you're free
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={() => navigate('/availability')}
                                    sx={{ mt: 2 }}
                                >
                                    Manage Availability
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Quick Actions */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Quick Actions
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<EventIcon />}
                                    onClick={() => navigate('/meetings')}
                                    sx={{ py: 1.5 }}
                                >
                                    Create Meeting
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<CalendarIcon />}
                                    onClick={() => navigate('/calendars')}
                                    sx={{ py: 1.5 }}
                                >
                                    Add Calendar
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<GroupIcon />}
                                    onClick={() => navigate('/teams')}
                                    sx={{ py: 1.5 }}
                                >
                                    Create Team
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<AccessTimeIcon />}
                                    onClick={() => navigate('/availability')}
                                    sx={{ py: 1.5 }}
                                >
                                    Set Availability
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard; 