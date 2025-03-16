import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Typography, Container } from '@mui/material';
import { SentimentDissatisfied as SadIcon } from '@mui/icons-material';

const NotFound = () => {
    return (
        <Container maxWidth="md">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '80vh',
                    textAlign: 'center',
                }}
            >
                <SadIcon sx={{ fontSize: 100, color: 'primary.main', mb: 4 }} />
                <Typography variant="h1" component="h1" gutterBottom>
                    404
                </Typography>
                <Typography variant="h4" component="h2" gutterBottom>
                    Page Not Found
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, maxWidth: '600px' }}>
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </Typography>
                <Button
                    component={RouterLink}
                    to="/"
                    variant="contained"
                    size="large"
                >
                    Go to Dashboard
                </Button>
            </Box>
        </Container>
    );
};

export default NotFound; 