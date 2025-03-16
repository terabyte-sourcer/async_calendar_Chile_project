import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFound = () => {
    return (
        <Container maxWidth="md">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    textAlign: 'center',
                    py: 4
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        maxWidth: 600,
                        width: '100%'
                    }}
                >
                    <Typography variant="h1" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        404
                    </Typography>
                    <Typography variant="h4" component="h2" gutterBottom>
                        Page Not Found
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
                        The page you are looking for might have been removed, had its name changed,
                        or is temporarily unavailable.
                    </Typography>
                    <Button
                        component={RouterLink}
                        to="/"
                        variant="contained"
                        startIcon={<HomeIcon />}
                        size="large"
                    >
                        Back to Home
                    </Button>
                </Paper>
            </Box>
        </Container>
    );
};

export default NotFound; 