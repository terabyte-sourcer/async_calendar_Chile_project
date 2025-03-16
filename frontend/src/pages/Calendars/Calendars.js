import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import CalendarView from '../../components/Calendar/CalendarView';
import CalendarConnections from '../../components/Calendar/CalendarConnections';

const Calendars = () => {
    return (
        <Container maxWidth="xl">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Calendars
                </Typography>
                <Typography variant="body1" paragraph>
                    View and manage your calendars and events.
                </Typography>

                <Box sx={{ mb: 4 }}>
                    <CalendarView />
                </Box>

                <Box sx={{ mt: 4 }}>
                    <CalendarConnections />
                </Box>
            </Box>
        </Container>
    );
};

export default Calendars; 