import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PersonAdd,
  CheckCircle,
  Cancel,
  Person,
  Email,
  Lock,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const StaffManagement: React.FC = () => {
  const { profiles, refreshProfiles, session } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const staffMembers = profiles.filter(p => p.role === 'staff');

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (!name.trim()) {
        setError('Name is required');
        setIsSubmitting(false);
        return;
      }
      if (!email.trim()) {
        setError('Email is required');
        setIsSubmitting(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsSubmitting(false);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('create-staff', {
        body: { name, email, password }
      });

      if (fnError) {
        setError(fnError.message);
        setIsSubmitting(false);
        return;
      }

      if (data?.error) {
        setError(data.error);
        setIsSubmitting(false);
        return;
      }

      setSuccess('Staff member created successfully!');
      setName('');
      setEmail('');
      setPassword('');
      await refreshProfiles();
      
      setTimeout(() => {
        setIsDialogOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    setTogglingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('user_id', userId);

      if (error) {
        console.error('Error toggling status:', error);
        return;
      }

      await refreshProfiles();
    } catch (err) {
      console.error('Error toggling status:', err);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Staff Members
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setIsDialogOpen(true)}
        >
          Add Staff
        </Button>
      </Box>

      {staffMembers.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Person sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No staff members yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Add your first staff member to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setIsDialogOpen(true)}
            >
              Add Staff Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gap: 2 }}>
          {staffMembers.map((staff) => (
            <Card key={staff.id} sx={{ opacity: staff.is_active === false ? 0.6 : 1 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: staff.is_active === false ? 'grey.300' : 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '1.2rem',
                    }}
                  >
                    {staff.name.charAt(0).toUpperCase()}
                  </Box>
                  <Box>
                    <Typography fontWeight={600}>{staff.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {staff.email}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    label={staff.is_active === false ? 'Inactive' : 'Active'}
                    color={staff.is_active === false ? 'default' : 'success'}
                    size="small"
                  />
                  <Tooltip title={staff.is_active === false ? 'Reactivate Account' : 'Deactivate Account'}>
                    <IconButton
                      onClick={() => handleToggleActive(staff.user_id, staff.is_active !== false)}
                      disabled={togglingId === staff.user_id}
                      color={staff.is_active === false ? 'success' : 'error'}
                    >
                      {togglingId === staff.user_id ? (
                        <CircularProgress size={24} />
                      ) : staff.is_active === false ? (
                        <CheckCircle />
                      ) : (
                        <Cancel />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Create Staff Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Staff Member</DialogTitle>
        <form onSubmit={handleCreateStaff}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                disabled={isSubmitting}
                InputProps={{
                  startAdornment: <Person sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
              />
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                disabled={isSubmitting}
                InputProps={{
                  startAdornment: <Email sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                disabled={isSubmitting}
                helperText="At least 6 characters. Share this with the staff member."
                InputProps={{
                  startAdornment: <Lock sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} /> : 'Create Staff'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default StaffManagement;