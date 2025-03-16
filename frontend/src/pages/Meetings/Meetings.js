import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import MeetingManager from '../../components/Meeting/MeetingManager';

const Meetings = () => {
    return (
        <Container maxWidth="xl">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Meetings
                </Typography>
                <Typography variant="body1" paragraph>
                    Schedule and manage your meetings across all your calendars.
                </Typography>

                <MeetingManager />
            </Box>
        </Container>
    );
};

export default Meetings; 