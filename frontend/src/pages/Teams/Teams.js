import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import TeamManager from '../../components/Team/TeamManager';

const Teams = () => {
    return (
        <Container maxWidth="xl">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Teams
                </Typography>
                <Typography variant="body1" paragraph>
                    Create and manage teams to collaborate with your colleagues.
                </Typography>

                <TeamManager />
            </Box>
        </Container>
    );
};

export default Teams; 