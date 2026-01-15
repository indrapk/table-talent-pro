import React, { useState } from 'react';
import { Box } from '@mui/material';
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
  const { isAuthenticated, isManager, logout } = useAuth();
  const [key, setKey] = useState(0);

  const handleLoginSuccess = () => {
    setKey(prev => prev + 1);
  };

  const handleLogout = () => {
    logout();
    setKey(prev => prev + 1);
  };

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
