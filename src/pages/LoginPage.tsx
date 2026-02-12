import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Restaurant } from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const REGISTRATION_SECRET_CODE = 'ABCD123';

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isSignup) {
        if (!name.trim()) {
          setError('Name is required');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setIsSubmitting(false);
          return;
        }
        if (secretCode.toUpperCase() !== REGISTRATION_SECRET_CODE) {
          setError('Invalid secret code');
          setIsSubmitting(false);
          return;
        }
        if (!phoneNumber.trim()) {
          setError('Phone number is required');
          setIsSubmitting(false);
          return;
        }
        const result = await signup(name, email, password, 'manager', phoneNumber);
        if (result.success) {
          onLoginSuccess();
        } else {
          setError(result.error || 'Signup failed');
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
          onLoginSuccess();
        } else {
          setError(result.error || 'Login failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1E3A5F 0%, #2E5A8F 50%, #1E3A5F 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              mb: 2,
            }}
          >
            <Restaurant sx={{ fontSize: 40, color: '#D4A574' }} />
          </Box>
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
            FloorFlow
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem' }}>
            Restaurant Shift & Floor Manager
          </Typography>
        </Box>

        <Card sx={{ overflow: 'visible' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {isSignup && (
                <>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    sx={{ mb: 2 }}
                    required
                    disabled={isSubmitting}
                  />
                  <TextField
                    fullWidth
                    label="Phone Number"
                    type="tel"
                    inputMode="numeric"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    sx={{ mb: 2 }}
                    required
                    disabled={isSubmitting}
                    placeholder="e.g. 5551234567"
                  />
                  <TextField
                    fullWidth
                    label="Secret Code"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                    sx={{ mb: 2 }}
                    required
                    disabled={isSubmitting}
                    inputProps={{ maxLength: 7 }}
                    helperText="6-digit alphanumeric code required to register"
                  />
                </>
              )}
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
                required
                disabled={isSubmitting}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
                required
                disabled={isSubmitting}
                helperText={isSignup ? 'At least 6 characters' : ''}
              />

              {isSignup && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Only managers can create accounts here. Staff accounts are created by managers from the Staff Management page.
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ py: 1.5, fontSize: '1rem' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  isSignup ? 'Create Account' : 'Sign In'
                )}
              </Button>
            </form>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}
              </Typography>
              <Button
                variant="text"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                  setSecretCode('');
                }}
                sx={{ mt: 0.5 }}
                disabled={isSubmitting}
              >
                {isSignup ? 'Sign In' : 'Create Account'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginPage;
