import React, { useState, useRef } from 'react';
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
  Avatar,
} from '@mui/material';
import {
  PersonAdd,
  CheckCircle,
  Cancel,
  Person,
  Email,
  Lock,
  Edit,
  PhotoCamera,
  VpnKey,
} from '@mui/icons-material';
import ResetPasswordDialog from './ResetPasswordDialog';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface StaffFormData {
  name: string;
  email: string;
  password: string;
  avatarFile: File | null;
  avatarPreview: string | null;
}

interface EditFormData {
  name: string;
  email: string;
  avatarFile: File | null;
  avatarPreview: string | null;
}

const StaffManagement: React.FC = () => {
  const { profiles, refreshProfiles } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<typeof profiles[0] | null>(null);
  const [resetPasswordStaff, setResetPasswordStaff] = useState<typeof profiles[0] | null>(null);
  
  // Create form state
  const [createForm, setCreateForm] = useState<StaffFormData>({
    name: '',
    email: '',
    password: '',
    avatarFile: null,
    avatarPreview: null,
  });
  
  // Edit form state
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '',
    email: '',
    avatarFile: null,
    avatarPreview: null,
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const staffMembers = profiles.filter(p => p.role === 'staff');

  const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleCreateFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCreateForm(prev => ({
          ...prev,
          avatarFile: file,
          avatarPreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({
          ...prev,
          avatarFile: file,
          avatarPreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (!createForm.name.trim()) {
        setError('Name is required');
        setIsSubmitting(false);
        return;
      }
      if (!createForm.email.trim()) {
        setError('Email is required');
        setIsSubmitting(false);
        return;
      }
      if (createForm.password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsSubmitting(false);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('create-staff', {
        body: { name: createForm.name, email: createForm.email, password: createForm.password }
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

      // Upload avatar if provided
      if (createForm.avatarFile && data?.user?.id) {
        const avatarUrl = await uploadAvatar(createForm.avatarFile, data.user.id);
        if (avatarUrl) {
          await supabase
            .from('profiles')
            .update({ avatar_url: avatarUrl })
            .eq('user_id', data.user.id);
        }
      }

      setSuccess('Staff member created successfully!');
      setCreateForm({
        name: '',
        email: '',
        password: '',
        avatarFile: null,
        avatarPreview: null,
      });
      await refreshProfiles();
      
      setTimeout(() => {
        setIsCreateDialogOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (staff: typeof profiles[0]) => {
    setEditingStaff(staff);
    setEditForm({
      name: staff.name,
      email: staff.email,
      avatarFile: null,
      avatarPreview: staff.avatar_url || null,
    });
    setError('');
    setSuccess('');
    setIsEditDialogOpen(true);
  };

  const handleOpenResetPassword = (staff: typeof profiles[0]) => {
    setResetPasswordStaff(staff);
    setIsResetPasswordDialogOpen(true);
  };

  const handleCloseResetPassword = () => {
    setIsResetPasswordDialogOpen(false);
    setResetPasswordStaff(null);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (!editForm.name.trim()) {
        setError('Name is required');
        setIsSubmitting(false);
        return;
      }

      let avatarUrl = editingStaff.avatar_url;

      // Upload new avatar if provided
      if (editForm.avatarFile) {
        const newAvatarUrl = await uploadAvatar(editForm.avatarFile, editingStaff.user_id);
        if (newAvatarUrl) {
          avatarUrl = newAvatarUrl;
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          name: editForm.name,
          avatar_url: avatarUrl,
        })
        .eq('user_id', editingStaff.user_id);

      if (updateError) {
        setError(updateError.message);
        setIsSubmitting(false);
        return;
      }

      setSuccess('Staff member updated successfully!');
      await refreshProfiles();
      
      setTimeout(() => {
        setIsEditDialogOpen(false);
        setEditingStaff(null);
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update staff member');
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

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setCreateForm({
      name: '',
      email: '',
      password: '',
      avatarFile: null,
      avatarPreview: null,
    });
    setError('');
    setSuccess('');
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingStaff(null);
    setEditForm({
      name: '',
      email: '',
      avatarFile: null,
      avatarPreview: null,
    });
    setError('');
    setSuccess('');
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
          onClick={() => setIsCreateDialogOpen(true)}
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
              onClick={() => setIsCreateDialogOpen(true)}
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
                  <Avatar
                    src={staff.avatar_url || undefined}
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: staff.is_active === false ? 'grey.300' : 'primary.main',
                      fontSize: '1.2rem',
                      fontWeight: 600,
                    }}
                  >
                    {staff.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={600}>{staff.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {staff.email}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={staff.is_active === false ? 'Inactive' : 'Active'}
                    color={staff.is_active === false ? 'default' : 'success'}
                    size="small"
                  />
                  <Tooltip title="Edit Profile">
                    <IconButton
                      onClick={() => handleOpenEdit(staff)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reset Password">
                    <IconButton
                      onClick={() => handleOpenResetPassword(staff)}
                      color="warning"
                    >
                      <VpnKey />
                    </IconButton>
                  </Tooltip>
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
      <Dialog open={isCreateDialogOpen} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
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
            
            {/* Avatar Upload */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={createForm.avatarPreview || undefined}
                  sx={{ width: 100, height: 100, fontSize: '2.5rem' }}
                >
                  {createForm.name ? createForm.name.charAt(0).toUpperCase() : <Person />}
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                  size="small"
                  onClick={() => createFileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <PhotoCamera fontSize="small" />
                </IconButton>
                <input
                  type="file"
                  ref={createFileInputRef}
                  hidden
                  accept="image/*"
                  onChange={handleCreateFileSelect}
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Full Name"
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
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
                value={createForm.email}
                onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
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
                value={createForm.password}
                onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
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
            <Button onClick={handleCloseCreateDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} /> : 'Create Staff'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Staff Member</DialogTitle>
        <form onSubmit={handleUpdateStaff}>
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
            
            {/* Avatar Upload */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={editForm.avatarPreview || undefined}
                  sx={{ width: 100, height: 100, fontSize: '2.5rem' }}
                >
                  {editForm.name ? editForm.name.charAt(0).toUpperCase() : <Person />}
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                  size="small"
                  onClick={() => editFileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <PhotoCamera fontSize="small" />
                </IconButton>
                <input
                  type="file"
                  ref={editFileInputRef}
                  hidden
                  accept="image/*"
                  onChange={handleEditFileSelect}
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Full Name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
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
                value={editForm.email}
                fullWidth
                disabled
                helperText="Email cannot be changed"
                InputProps={{
                  startAdornment: <Email sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Reset Password Dialog */}
      {resetPasswordStaff && (
        <ResetPasswordDialog
          open={isResetPasswordDialogOpen}
          onClose={handleCloseResetPassword}
          staffName={resetPasswordStaff.name}
          staffUserId={resetPasswordStaff.user_id}
        />
      )}
    </Box>
  );
};

export default StaffManagement;
