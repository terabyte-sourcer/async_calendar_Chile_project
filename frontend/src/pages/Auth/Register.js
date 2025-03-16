import React, { useState, useContext, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Link,
    Paper,
    Grid,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    Stepper,
    Step,
    StepLabel
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

const steps = ['Account Information', 'Personal Details'];

const Register = () => {
    const { register, currentUser, loading, error } = useContext(AuthContext);
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        route_time_preference: 'morning'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // If user is already logged in, redirect to dashboard
        if (currentUser) {
            navigate('/dashboard');
        }
    }, [currentUser, navigate]);

    const handleInputChange = (field, value) => {
        setFormData({
            ...formData,
            [field]: value
        });
    };

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const validateStep1 = () => {
        if (!formData.email) {
            setFormError('Email is required');
            return false;
        }
        if (!formData.email.includes('@')) {
            setFormError('Please enter a valid email address');
            return false;
        }
        if (!formData.password) {
            setFormError('Password is required');
            return false;
        }
        if (formData.password.length < 8) {
            setFormError('Password must be at least 8 characters long');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setFormError('Passwords do not match');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.name) {
            setFormError('Name is required');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        setFormError('');

        if (activeStep === 0) {
            if (validateStep1()) {
                setActiveStep(1);
            }
        } else if (activeStep === 1) {
            if (validateStep2()) {
                handleSubmit();
            }
        }
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
        setFormError('');
    };

    const handleSubmit = async () => {
        setFormError('');

        // Create user data object
        const userData = {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            route_time_preference: formData.route_time_preference
        };

        try {
            const success = await register(userData);
            if (success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (err) {
            console.error('Registration error:', err);
            setFormError('Registration failed. Please try again.');
        }
    };

    return (
        <Container component="main" maxWidth="sm">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                        <Typography component="h1" variant="h4" gutterBottom>
                            Async Calendar
                        </Typography>
                        <Typography component="h2" variant="h5">
                            Create Account
                        </Typography>
                    </Box>

                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {success ? (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Registration successful! You will be redirected to the login page.
                        </Alert>
                    ) : (
                        <>
                            {(error || formError) && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {typeof error === 'object' ? JSON.stringify(error) : (formError || error)}
                                </Alert>
                            )}

                            <Box component="form" noValidate>
                                {activeStep === 0 ? (
                                    // Step 1: Account Information
                                    <>
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            id="email"
                                            label="Email Address"
                                            name="email"
                                            autoComplete="email"
                                            autoFocus
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            disabled={loading}
                                        />
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            name="password"
                                            label="Password"
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            autoComplete="new-password"
                                            value={formData.password}
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                            disabled={loading}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            aria-label="toggle password visibility"
                                                            onClick={handleTogglePasswordVisibility}
                                                            edge="end"
                                                        >
                                                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            name="confirmPassword"
                                            label="Confirm Password"
                                            type={showPassword ? 'text' : 'password'}
                                            id="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                            disabled={loading}
                                        />
                                    </>
                                ) : (
                                    // Step 2: Personal Details
                                    <>
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            id="name"
                                            label="Full Name"
                                            name="name"
                                            autoComplete="name"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            disabled={loading}
                                        />
                                        <TextField
                                            margin="normal"
                                            fullWidth
                                            select
                                            id="routeTimePreference"
                                            label="Preferred Meeting Time"
                                            name="routeTimePreference"
                                            value={formData.route_time_preference}
                                            onChange={(e) => handleInputChange('route_time_preference', e.target.value)}
                                            disabled={loading}
                                            SelectProps={{
                                                native: true,
                                            }}
                                        >
                                            <option value="morning">Morning (8:00 - 12:00)</option>
                                            <option value="afternoon">Afternoon (12:00 - 17:00)</option>
                                            <option value="evening">Evening (17:00 - 21:00)</option>
                                            <option value="any">Any Time</option>
                                        </TextField>
                                    </>
                                )}

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                                    <Button
                                        onClick={handleBack}
                                        disabled={activeStep === 0 || loading}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={handleNext}
                                        disabled={loading}
                                        startIcon={activeStep === steps.length - 1 ? (loading ? <CircularProgress size={20} /> : <PersonAddIcon />) : null}
                                    >
                                        {activeStep === steps.length - 1
                                            ? (loading ? 'Creating Account...' : 'Create Account')
                                            : 'Next'}
                                    </Button>
                                </Box>
                            </Box>

                            <Grid container justifyContent="flex-end" sx={{ mt: 3 }}>
                                <Grid item>
                                    <Link component={RouterLink} to="/login" variant="body2">
                                        Already have an account? Sign in
                                    </Link>
                                </Grid>
                            </Grid>
                        </>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default Register; 