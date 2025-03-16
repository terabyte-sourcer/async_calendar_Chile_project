import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Grid,
    Paper,
    Button,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    Divider,
    Card,
    CardContent,
    CardActions,
    Chip
} from '@mui/material';
import {
    Event as EventIcon,
    CalendarMonth as CalendarIcon,
    AccessTime as AccessTimeIcon,
    Group as GroupIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { format, parseISO, isToday, isTomorrow, addDays } from 'date-fns';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const Dashboard = () => {
    const { currentUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [upcomingMeetings, setUpcomingMeetings] = useState([]);
    const [calendars, setCalendars] = useState([]);
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch upcoming meetings
                const meetingsResponse = await api.get('/api/meetings/?upcoming=true&limit=5');
                setUpcomingMeetings(meetingsResponse.data);

                // Fetch calendars
                const calendarsResponse = await api.get('/api/calendars/');
                setCalendars(calendarsResponse.data);

                // Fetch teams
                const teamsResponse = await api.get('/api/teams/');
                setTeams(teamsResponse.data);

                setError(null);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to load dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatMeetingDate = (dateString) => {
        const date = parseISO(dateString);

        if (isToday(date)) {
            return `Today at ${format(date, 'h:mm a')}`;
        } else if (isTomorrow(date)) {
            return `Tomorrow at ${format(date, 'h:mm a')}`;
        } else if (date < addDays(new Date(), 7)) {
            return format(date, 'EEEE') + ` at ${format(date, 'h:mm a')}`;
        } else {
            return format(date, 'MMM d') + ` at ${format(date, 'h:mm a')}`;
        }
    };

    if (loading) {
        return (
            <Container maxWidth="xl">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Welcome, {currentUser?.name || 'User'}!
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Upcoming Meetings */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" component="h2">
                                    Upcoming Meetings
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => navigate('/meetings')}
                                >
                                    New Meeting
                                </Button>
                            </Box>

                            {upcomingMeetings.length === 0 ? (
                                <Alert severity="info">
                                    You don't have any upcoming meetings. Click "New Meeting" to schedule one.
                                </Alert>
                            ) : (
                                <List>
                                    {upcomingMeetings.map((meeting, index) => (
                                        <React.Fragment key={meeting.id}>
                                            <ListItem alignItems="flex-start">
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Typography variant="subtitle1" component="span">
                                                                {meeting.title}
                                                            </Typography>
                                                            {meeting.team_id && (
                                                                <Chip
                                                                    size="small"
                                                                    label={meeting.team_name || 'Team'}
                                                                    sx={{ ml: 1 }}
                                                                    color="primary"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <>
                                                            <Typography
                                                                component="span"
                                                                variant="body2"
                                                                color="text.primary"
                                                                sx={{ display: 'block' }}
                                                            >
                                                                {formatMeetingDate(meeting.start_time)}
                                                            </Typography>
                                                            {meeting.description && (
                                                                <Typography
                                                                    component="span"
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                >
                                                                    {meeting.description.length > 100
                                                                        ? `${meeting.description.substring(0, 100)}...`
                                                                        : meeting.description}
                                                                </Typography>
                                                            )}
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                            {index < upcomingMeetings.length - 1 && <Divider component="li" />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </Paper>
                    </Grid>

                    {/* Quick Actions */}
                    <Grid item xs={12} md={4}>
                        <Grid container spacing={2} direction="column">
                            <Grid item>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" component="h2" gutterBottom>
                                        Quick Actions
                                    </Typography>
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                startIcon={<CalendarIcon />}
                                                onClick={() => navigate('/calendars')}
                                                sx={{ justifyContent: 'flex-start' }}
                                            >
                                                Calendars
                                            </Button>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                startIcon={<AccessTimeIcon />}
                                                onClick={() => navigate('/availability')}
                                                sx={{ justifyContent: 'flex-start' }}
                                            >
                                                Availability
                                            </Button>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                startIcon={<EventIcon />}
                                                onClick={() => navigate('/meetings')}
                                                sx={{ justifyContent: 'flex-start' }}
                                            >
                                                Meetings
                                            </Button>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                startIcon={<GroupIcon />}
                                                onClick={() => navigate('/teams')}
                                                sx={{ justifyContent: 'flex-start' }}
                                            >
                                                Teams
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>

                            {/* Calendars */}
                            <Grid item>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" component="h2" gutterBottom>
                                            Your Calendars
                                        </Typography>
                                        {calendars.length === 0 ? (
                                            <Typography variant="body2" color="text.secondary">
                                                You haven't connected any calendars yet.
                                            </Typography>
                                        ) : (
                                            <List dense>
                                                {calendars.slice(0, 3).map((calendar) => (
                                                    <ListItem key={calendar.id} disablePadding sx={{ py: 0.5 }}>
                                                        <Box
                                                            sx={{
                                                                width: 12,
                                                                height: 12,
                                                                borderRadius: '50%',
                                                                bgcolor: calendar.color || '#3174ad',
                                                                mr: 1.5
                                                            }}
                                                        />
                                                        <ListItemText
                                                            primary={calendar.name}
                                                            secondary={calendar.calendar_type}
                                                        />
                                                    </ListItem>
                                                ))}
                                                {calendars.length > 3 && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                                                        +{calendars.length - 3} more calendars
                                                    </Typography>
                                                )}
                                            </List>
                                        )}
                                    </CardContent>
                                    <CardActions>
                                        <Button size="small" onClick={() => navigate('/calendars')}>
                                            {calendars.length === 0 ? 'Connect Calendar' : 'Manage Calendars'}
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>

                            {/* Teams */}
                            <Grid item>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" component="h2" gutterBottom>
                                            Your Teams
                                        </Typography>
                                        {teams.length === 0 ? (
                                            <Typography variant="body2" color="text.secondary">
                                                You're not a member of any teams yet.
                                            </Typography>
                                        ) : (
                                            <List dense>
                                                {teams.slice(0, 3).map((team) => (
                                                    <ListItem key={team.id} disablePadding sx={{ py: 0.5 }}>
                                                        <ListItemText
                                                            primary={team.name}
                                                            secondary={`${team.member_count || 0} members`}
                                                        />
                                                    </ListItem>
                                                ))}
                                                {teams.length > 3 && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                                                        +{teams.length - 3} more teams
                                                    </Typography>
                                                )}
                                            </List>
                                        )}
                                    </CardContent>
                                    <CardActions>
                                        <Button size="small" onClick={() => navigate('/teams')}>
                                            {teams.length === 0 ? 'Create Team' : 'Manage Teams'}
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default Dashboard; 