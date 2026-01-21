import React, { useState } from 'react';
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
import StaffScheduleView from '@/components/StaffScheduleView';
import SectionScheduleView from '@/components/SectionScheduleView';
import ViewSwitcher from '@/components/ViewSwitcher';
import { ViewType } from '@/types/views';

const AppContent: React.FC = () => {
  const { isAuthenticated, isManager, logout, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('calendar');

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

  // Staff users see their dashboard, managers see the schedule manager with views
  if (!isManager) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Header onLogout={handleLogout} />
        <StaffDashboard />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header onLogout={handleLogout} viewSwitcher={<ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />} />
      {currentView === 'calendar' && <SchedulerGrid />}
      {currentView === 'staff' && <StaffScheduleView />}
      {currentView === 'section' && <SectionScheduleView />}
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
