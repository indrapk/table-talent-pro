import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import muiTheme from '@/theme/muiTheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ScheduleProvider } from '@/context/ScheduleContext';
import LoginPage from '@/pages/LoginPage';
import Header from '@/components/Header';
import SchedulerGrid from '@/components/SchedulerGrid';
import StaffDashboard from '@/components/StaffDashboard';

const AppContent: React.FC = () => {
  const { isAuthenticated, isManager, logout, isLoading } = useAuth();

  const handleLoginSuccess = () => {
    // Auth state change will handle the redirect automatically
  };

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header onLogout={handleLogout} />
      {isManager ? <SchedulerGrid /> : <StaffDashboard />}
    </Box>
  );
};

const Index: React.FC = () => {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <AuthProvider>
        <ScheduleProvider>
          <AppContent />
        </ScheduleProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default Index;
