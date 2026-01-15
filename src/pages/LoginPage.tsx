import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Container,
  Divider,
} from '@mui/material';
import { Restaurant, Person, ManageAccounts } from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignup) {
      if (!name.trim()) {
        setError('Name is required');
        return;
      }
      const result = signup(name, email, password, role);
      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || 'Signup failed');
      }
    } else {
      const result = login(email, password);
      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || 'Login failed');
      }
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
                <TextField
                  fullWidth
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  sx={{ mb: 2 }}
                  required
                />
              )}
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
                required
              />

              {isSignup && (
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ mb: 1.5, fontWeight: 500, color: 'text.secondary' }}>
                    Select your role:
                  </Typography>
                  <ToggleButtonGroup
                    value={role}
                    exclusive
                    onChange={(_, newRole) => newRole && setRole(newRole)}
                    fullWidth
                    sx={{ gap: 2 }}
                  >
                    <ToggleButton 
                      value="staff" 
                      sx={{ 
                        flex: 1, 
                        py: 2,
                        borderRadius: '8px !important',
                        border: '2px solid',
                        borderColor: role === 'staff' ? 'primary.main' : 'divider',
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <Person />
                        <Typography variant="body2" fontWeight={600}>Staff</Typography>
                      </Box>
                    </ToggleButton>
                    <ToggleButton 
                      value="manager"
                      sx={{ 
                        flex: 1, 
                        py: 2,
                        borderRadius: '8px !important',
                        border: '2px solid',
                        borderColor: role === 'manager' ? 'primary.main' : 'divider',
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <ManageAccounts />
                        <Typography variant="body2" fontWeight={600}>Manager</Typography>
                      </Box>
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ py: 1.5, fontSize: '1rem' }}
              >
                {isSignup ? 'Create Account' : 'Sign In'}
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
                }}
                sx={{ mt: 0.5 }}
              >
                {isSignup ? 'Sign In' : 'Create Account'}
              </Button>
            </Box>

            {!isSignup && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Demo Accounts:</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  Manager: manager@restaurant.com / password123<br />
                  Staff: john@restaurant.com / password123
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginPage;
