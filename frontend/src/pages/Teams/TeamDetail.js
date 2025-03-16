import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    CircularProgress,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Autocomplete
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import api from '../../services/api';

const TeamDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState([]);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/teams/${id}`);
                setTeam(response.data);
                setSelectedMembers(response.data.members || []);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching team:', err);
                setError('Failed to load team details. Please try again later.');
                setLoading(false);
            }
        };

        const fetchUsers = async () => {
            try {
                const response = await api.get('/users/');
                setUsers(response.data);
            } catch (err) {
                console.error('Error fetching users:', err);
            }
        };

        fetchTeam();
        fetchUsers();
    }, [id]);

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleUpdateMembers = async () => {
        try {
            const memberIds = selectedMembers.map(member => member.id);
            await api.put(`/teams/${id}`, {
                member_ids: memberIds
            });

            // Refresh team data
            const response = await api.get(`/teams/${id}`);
            setTeam(response.data);

            handleCloseDialog();
        } catch (err) {
            console.error('Error updating team members:', err);
            setError('Failed to update team members. Please try again.');
        }
    };

    const handleDeleteTeam = async () => {
        if (window.confirm('Are you sure you want to delete this team?')) {
            try {
                await api.delete(`/teams/${id}`);
                navigate('/teams');
            } catch (err) {
                console.error('Error deleting team:', err);
                setError('Failed to delete team. Please try again.');
            }
        }
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase();
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

    if (error) {
        return (
            <Container maxWidth="xl">
                <Alert severity="error" sx={{ mt: 4 }}>
                    {error}
                </Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/teams')}
                    sx={{ mt: 2 }}
                >
                    Back to Teams
                </Button>
            </Container>
        );
    }

    if (!team) {
        return (
            <Container maxWidth="xl">
                <Alert severity="info" sx={{ mt: 4 }}>
                    Team not found.
                </Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/teams')}
                    sx={{ mt: 2 }}
                >
                    Back to Teams
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => navigate('/teams')} sx={{ mr: 1 }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h4" component="h1">
                            {team.name}
                        </Typography>
                    </Box>
                    <Box>
                        <Button
                            variant="outlined"
                            startIcon={<PersonAddIcon />}
                            onClick={handleOpenDialog}
                            sx={{ mr: 1 }}
                        >
                            Manage Members
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={handleDeleteTeam}
                        >
                            Delete Team
                        </Button>
                    </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Team Members
                    </Typography>

                    {team.members && team.members.length > 0 ? (
                        <List>
                            {team.members.map((member) => (
                                <ListItem key={member.id} divider>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                                            {getInitials(member.name)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={member.name}
                                        secondary={member.email}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Alert severity="info">
                            This team doesn't have any members yet. Add members to start collaborating.
                        </Alert>
                    )}
                </Paper>

                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Team Availability
                    </Typography>
                    <Alert severity="info">
                        Team availability view is coming soon. This will show the combined availability of all team members.
                    </Alert>
                </Paper>
            </Box>

            {/* Manage Members Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Manage Team Members</DialogTitle>
                <DialogContent>
                    <Typography variant="subtitle1" gutterBottom>
                        Team: {team.name}
                    </Typography>
                    <Autocomplete
                        multiple
                        id="team-members"
                        options={users}
                        value={selectedMembers}
                        onChange={(event, newValue) => {
                            setSelectedMembers(newValue);
                        }}
                        getOptionLabel={(option) => option.name}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                label="Select Members"
                                placeholder="Search users"
                                fullWidth
                                margin="normal"
                            />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip
                                    avatar={<Avatar>{getInitials(option.name)}</Avatar>}
                                    label={option.name}
                                    {...getTagProps({ index })}
                                />
                            ))
                        }
                        renderOption={(props, option) => (
                            <li {...props}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar sx={{ mr: 1, width: 24, height: 24 }}>
                                        {getInitials(option.name)}
                                    </Avatar>
                                    <Typography variant="body2">{option.name}</Typography>
                                </Box>
                            </li>
                        )}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleUpdateMembers} variant="contained" color="primary">
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default TeamDetail; 