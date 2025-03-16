import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
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
    CircularProgress,
    Divider,
    Chip,
    Avatar,
    Autocomplete,
    Alert,
    Snackbar,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Group as GroupIcon,
    PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const TeamManager = () => {
    const { currentUser } = useAuth();
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [openMemberDialog, setOpenMemberDialog] = useState(false);
    const [editTeamId, setEditTeamId] = useState(null);
    const [currentTeam, setCurrentTeam] = useState(null);
    const [teamData, setTeamData] = useState({
        name: '',
        member_ids: []
    });
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        fetchTeams();
        fetchUsers();
    }, []);

    const fetchTeams = async () => {
        setLoading(true);
        try {
            const response = await api.get('/teams/');
            setTeams(response.data);
        } catch (error) {
            console.error('Error fetching teams:', error);
            showSnackbar('Failed to load teams', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            showSnackbar('Failed to load users', 'error');
        }
    };

    const handleOpenDialog = (team = null) => {
        if (team) {
            setEditTeamId(team.id);
            setTeamData({
                name: team.name,
                member_ids: team.members?.map(member => member.id) || []
            });
        } else {
            setEditTeamId(null);
            setTeamData({
                name: '',
                member_ids: []
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleOpenMemberDialog = (team) => {
        setCurrentTeam(team);
        setSelectedMembers(
            users.filter(user =>
                team.members?.some(member => member.id === user.id)
            )
        );
        setOpenMemberDialog(true);
    };

    const handleCloseMemberDialog = () => {
        setOpenMemberDialog(false);
        setCurrentTeam(null);
        setSelectedMembers([]);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setTeamData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            if (editTeamId) {
                // Update existing team
                await api.put(`/teams/${editTeamId}`, teamData);
                showSnackbar('Team updated successfully');
            } else {
                // Create new team
                await api.post('/teams/', teamData);
                showSnackbar('Team created successfully');
            }

            fetchTeams();
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving team:', error);
            showSnackbar('Failed to save team', 'error');
        }
    };

    const handleUpdateMembers = async () => {
        if (!currentTeam) return;

        try {
            const memberIds = selectedMembers.map(member => member.id);
            await api.put(`/teams/${currentTeam.id}`, {
                member_ids: memberIds
            });

            showSnackbar('Team members updated successfully');
            fetchTeams();
            handleCloseMemberDialog();
        } catch (error) {
            console.error('Error updating team members:', error);
            showSnackbar('Failed to update team members', 'error');
        }
    };

    const handleDeleteTeam = async (id) => {
        if (window.confirm('Are you sure you want to delete this team?')) {
            try {
                await api.delete(`/teams/${id}`);
                showSnackbar('Team deleted successfully');
                fetchTeams();
            } catch (error) {
                console.error('Error deleting team:', error);
                showSnackbar('Failed to delete team', 'error');
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

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase();
    };

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Team Management</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Create Team
                </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : teams.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                    You haven't created any teams yet. Click "Create Team" to get started.
                </Alert>
            ) : (
                <List>
                    {teams.map((team) => (
                        <ListItem key={team.id} divider>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <GroupIcon sx={{ mr: 1 }} />
                                        <Typography variant="h6">{team.name}</Typography>
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                        {team.members?.length > 0 ? (
                                            team.members.map(member => (
                                                <Chip
                                                    key={member.id}
                                                    avatar={<Avatar>{getInitials(member.name)}</Avatar>}
                                                    label={member.name}
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No members
                                            </Typography>
                                        )}
                                    </Box>
                                }
                            />
                            <ListItemSecondaryAction>
                                <Tooltip title="Manage Members">
                                    <IconButton edge="end" onClick={() => handleOpenMemberDialog(team)}>
                                        <PersonAddIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit Team">
                                    <IconButton edge="end" onClick={() => handleOpenDialog(team)}>
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Team">
                                    <IconButton edge="end" onClick={() => handleDeleteTeam(team.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            )}

            {/* Add/Edit Team Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editTeamId ? 'Edit Team' : 'Create Team'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        name="name"
                        label="Team Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={teamData.name}
                        onChange={handleInputChange}
                        sx={{ mb: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {editTeamId ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Manage Team Members Dialog */}
            <Dialog open={openMemberDialog} onClose={handleCloseMemberDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Manage Team Members</DialogTitle>
                <DialogContent>
                    {currentTeam && (
                        <>
                            <Typography variant="subtitle1" gutterBottom>
                                Team: {currentTeam.name}
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
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseMemberDialog}>Cancel</Button>
                    <Button onClick={handleUpdateMembers} variant="contained" color="primary">
                        Save Changes
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
    );
};

export default TeamManager; 