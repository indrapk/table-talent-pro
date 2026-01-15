import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { Person, Block, CheckCircle } from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { useSchedule } from '@/context/ScheduleContext';
import { Shift, Section, SECTIONS, SECTION_COLORS } from '@/types';

interface AssignStaffDialogProps {
  open: boolean;
  onClose: () => void;
  shift: Shift | null;
}

const AssignStaffDialog: React.FC<AssignStaffDialogProps> = ({ open, onClose, shift }) => {
  const { users } = useAuth();
  const { assignStaff, isStaffAssignedToShift, getAssignmentsForShift } = useSchedule();
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedSection, setSelectedSection] = useState<Section | ''>('');
  const [error, setError] = useState('');

  const staffMembers = useMemo(() => users.filter(u => u.role === 'staff'), [users]);

  const currentAssignments = useMemo(() => {
    if (!shift) return [];
    return getAssignmentsForShift(shift.id);
  }, [shift, getAssignmentsForShift]);

  const assignedSections = useMemo(() => {
    return currentAssignments.map(a => a.section);
  }, [currentAssignments]);

  const getStaffStatus = (staffId: string) => {
    if (!shift) return 'available';
    return isStaffAssignedToShift(shift.id, staffId) ? 'assigned' : 'available';
  };

  const handleSubmit = () => {
    setError('');

    if (!selectedStaff || !selectedSection || !shift) {
      setError('Please select both a staff member and a section');
      return;
    }

    // Double-booking validation at logic level
    if (isStaffAssignedToShift(shift.id, selectedStaff)) {
      setError('This staff member is already assigned to a section in this shift. Remove their existing assignment first.');
      return;
    }

    const result = assignStaff(shift.id, selectedStaff, selectedSection);
    if (result.success) {
      handleClose();
    } else {
      setError(result.error || 'Failed to assign staff');
    }
  };

  const handleClose = () => {
    setSelectedStaff('');
    setSelectedSection('');
    setError('');
    onClose();
  };

  if (!shift) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" fontWeight={600}>
          Assign Staff to Shift
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {shift.date} • {shift.startTime} - {shift.endTime}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Current Assignments */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
            Current Assignments
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {SECTIONS.map(section => {
              const assignment = currentAssignments.find(a => a.section === section);
              const staff = assignment ? staffMembers.find(s => s.id === assignment.staffId) : null;
              const colors = SECTION_COLORS[section];

              return (
                <Box
                  key={section}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: assignment ? colors.bg : 'grey.50',
                    border: '1px solid',
                    borderColor: assignment ? colors.border : 'grey.200',
                  }}
                >
                  <Typography fontWeight={500} color={assignment ? colors.text : 'grey.500'}>
                    {section}
                  </Typography>
                  {staff ? (
                    <Chip
                      icon={<CheckCircle sx={{ fontSize: 16 }} />}
                      label={staff.name}
                      size="small"
                      sx={{
                        bgcolor: 'white',
                        border: '1px solid',
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="grey.400">
                      Unassigned
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* New Assignment Form */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Select Staff Member</InputLabel>
            <Select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              label="Select Staff Member"
            >
              {staffMembers.map(staff => {
                const status = getStaffStatus(staff.id);
                const isAssigned = status === 'assigned';

                return (
                  <MenuItem 
                    key={staff.id} 
                    value={staff.id}
                    disabled={isAssigned}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      opacity: isAssigned ? 0.5 : 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person sx={{ fontSize: 20, color: 'grey.500' }} />
                      {staff.name}
                    </Box>
                    {isAssigned && (
                      <Chip
                        icon={<Block sx={{ fontSize: 14 }} />}
                        label="Already Assigned"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Select Section</InputLabel>
            <Select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value as Section)}
              label="Select Section"
            >
              {SECTIONS.map(section => {
                const isAssigned = assignedSections.includes(section);
                const colors = SECTION_COLORS[section];

                return (
                  <MenuItem 
                    key={section} 
                    value={section}
                    disabled={isAssigned}
                    sx={{ opacity: isAssigned ? 0.5 : 1 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: colors.border,
                        }}
                      />
                      {section}
                      {isAssigned && (
                        <Chip
                          label="Filled"
                          size="small"
                          sx={{ ml: 1, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!selectedStaff || !selectedSection}
        >
          Assign Staff
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignStaffDialog;
