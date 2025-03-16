import React, { useState } from 'react';
import { Container, Grid, Box, Tab, Tabs, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import CalendarView from '../components/Calendar/CalendarView';
import CalendarConnections from '../components/Calendar/CalendarConnections';
import AvailabilityManager from '../components/Availability/AvailabilityManager';
import TeamManager from '../components/Team/TeamManager';
import MeetingManager from '../components/Meeting/MeetingManager';
import UserProfile from '../components/User/UserProfile';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`dashboard-tabpanel-${index}`}
            aria-labelledby={`dashboard-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `dashboard-tab-${index}`,
        'aria-controls': `dashboard-tabpanel-${index}`,
    };
}

const Dashboard = () => {
    const { currentUser } = useAuth();
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ mt: 4, mb: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Welcome, {currentUser?.name || 'User'}
                </Typography>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="dashboard tabs"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label="Calendar" {...a11yProps(0)} />
                    <Tab label="Meetings" {...a11yProps(1)} />
                    <Tab label="Availability" {...a11yProps(2)} />
                    <Tab label="Teams" {...a11yProps(3)} />
                    <Tab label="Calendar Connections" {...a11yProps(4)} />
                    <Tab label="Profile" {...a11yProps(5)} />
                </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
                <CalendarView />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <MeetingManager />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <AvailabilityManager />
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
                <TeamManager />
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
                <CalendarConnections />
            </TabPanel>

            <TabPanel value={tabValue} index={5}>
                <UserProfile />
            </TabPanel>
        </Container>
    );
};

export default Dashboard; 