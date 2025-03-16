import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import AvailabilityManager from '../../components/Availability/AvailabilityManager';

const Availability = () => {
    return (
        <Container maxWidth="xl">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Availability
                </Typography>
                <Typography variant="body1" paragraph>
                    Set your availability preferences to let others know when you're free for meetings.
                </Typography>

                <AvailabilityManager />
            </Box>
        </Container>
    );
};

export default Availability; 