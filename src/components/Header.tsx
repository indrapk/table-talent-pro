import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  Avatar,
} from '@mui/material';
import { Restaurant, Logout, Person } from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  onLogout: () => void;
  viewSwitcher?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ onLogout, viewSwitcher }) => {
  const { profile, isManager } = useAuth();

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        bgcolor: 'white',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'primary.main',
            }}
          >
            <Restaurant sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'primary.main', 
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            FloorFlow
          </Typography>
        </Box>

        {viewSwitcher && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {viewSwitcher}
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar 
              sx={{ 
                width: 36, 
                height: 36, 
                bgcolor: isManager ? 'secondary.main' : 'primary.light',
                color: isManager ? 'primary.main' : 'white',
              }}
            >
              <Person sx={{ fontSize: 20 }} />
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {profile?.name}
              </Typography>
              <Chip 
                label={isManager ? 'Manager' : 'Staff'}
                size="small"
                sx={{ 
                  height: 20,
                  fontSize: '0.7rem',
                  bgcolor: isManager ? 'secondary.light' : 'primary.light',
                  color: isManager ? 'primary.main' : 'white',
                }}
              />
            </Box>
          </Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Logout />}
            onClick={onLogout}
            size="small"
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
