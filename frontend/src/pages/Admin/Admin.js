import React, { useContext, useEffect } from 'react';
import { Container, Typography, Box, Alert } from '@mui/material';
import AdminPanel from '../../components/Admin/AdminPanel';
import { AuthContext } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

const Admin = () => {
    const { currentUser } = useContext(AuthContext);

    // Check if user is a superadmin
    if (!currentUser || !currentUser.is_superadmin) {
        return <Navigate to="/dashboard" />;
    }

    return (
        <Container maxWidth="xl">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Admin Panel
                </Typography>
                <Typography variant="body1" paragraph>
                    Manage users, teams, and system settings.
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                    This area is restricted to administrators only.
                </Alert>

                <AdminPanel />
            </Box>
        </Container>
    );
};

export default Admin; 