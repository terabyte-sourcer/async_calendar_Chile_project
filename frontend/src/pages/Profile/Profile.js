import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import UserProfile from '../../components/User/UserProfile';

const Profile = () => {
    return (
        <Container maxWidth="xl">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Your Profile
                </Typography>
                <Typography variant="body1" paragraph>
                    Manage your account settings and preferences.
                </Typography>

                <UserProfile />
            </Box>
        </Container>
    );
};

export default Profile; 