import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Alert,
    Chip,
    Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const TeamManager = () => {
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/teams/');
            setTeams(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching teams:', err);
            setError('Failed to load your teams. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (team = null) => {
        if (team) {
            // Edit mode
            setSelectedTeam(team);
            setFormData({
                name: team.name,
                description: team.description || ''
            });
        } else {
            // Create mode
            setSelectedTeam(null);
            setFormData({
                name: '',
                description: ''
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
        if (!formData.name) {
            setError('Please enter a team name');
            return;
        }

        try {
            if (selectedTeam) {
                // Update existing team
                await api.put(`/api/teams/${selectedTeam.id}`, formData);
            } else {
                // Create new team
                await api.post('/api/teams/', formData);
            }

            // Refresh the list
            fetchTeams();
            handleCloseDialog();
            setError(null);
        } catch (err) {
            console.error('Error saving team:', err);
            setError('Failed to save team. Please try again.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
            try {
                await api.delete(`/api/teams/${id}`);
                fetchTeams();
            } catch (err) {
                console.error('Error deleting team:', err);
                setError('Failed to delete team. Please try again.');
            }
        }
    };

    const handleViewTeam = (teamId) => {
        navigate(`/teams/${teamId}`);
    };

    return (
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
                    Create Team
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : teams.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1">
                        You haven't created any teams yet. Click the "Create Team" button to get started.
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {teams.map((team) => (
                        <Grid item xs={12} md={6} lg={4} key={team.id}>
                            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Typography variant="h6" noWrap>{team.name}</Typography>
                                    <Box>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleOpenDialog(team)}
                                            aria-label="edit"
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(team.id)}
                                            aria-label="delete"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        mb: 2,
                                        flexGrow: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                    }}
                                >
                                    {team.description || 'No description provided.'}
                                </Typography>

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Chip
                                        icon={<GroupIcon />}
                                        label={`${team.member_count || 0} members`}
                                        size="small"
                                        variant="outlined"
                                    />
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => handleViewTeam(team.id)}
                                    >
                                        View Details
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Add/Edit Team Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedTeam ? 'Edit Team' : 'Create New Team'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <TextField
                            label="Team Name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            fullWidth
                            margin="normal"
                            required
                        />

                        <TextField
                            label="Description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            fullWidth
                            margin="normal"
                            multiline
                            rows={4}
                            placeholder="Describe the purpose of this team..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {selectedTeam ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeamManager; 