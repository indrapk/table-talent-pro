import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Add,
  Delete,
  PersonAdd,
  Close,
} from '@mui/icons-material';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useSchedule } from '@/context/ScheduleContext';
import { Shift, SECTIONS, SECTION_COLORS } from '@/types';
import CreateShiftDialog from './CreateShiftDialog';
import AssignStaffDialog from './AssignStaffDialog';

const SchedulerGrid: React.FC = () => {
  const { profiles } = useAuth();
  const { shifts, assignments, deleteShift, unassignStaff, isLoading } = useSchedule();
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [createShiftOpen, setCreateShiftOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const staffMembers = useMemo(() => profiles.filter(u => u.role === 'staff'), [profiles]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const shiftsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.filter(s => s.date === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const handlePrevWeek = () => setCurrentWeekStart(prev => addDays(prev, -7));
  const handleNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));

  const handleOpenAssignDialog = (shift: Shift) => {
    setSelectedShift(shift);
    setAssignDialogOpen(true);
  };

  const handleRemoveAssignment = async (assignmentId: string, staffName: string) => {
    await unassignStaff(assignmentId);
    setSnackbar({ open: true, message: `Removed ${staffName} from shift`, severity: 'success' });
  };

  const handleDeleteShift = async (shiftId: string) => {
    await deleteShift(shiftId);
    setSnackbar({ open: true, message: 'Shift deleted', severity: 'success' });
  };

  const renderShiftCard = (shift: Shift) => {
    const shiftAssignments = assignments.filter(a => a.shiftId === shift.id);
    
    return (
      <Paper
        key={shift.id}
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="primary.main">
              {shift.startTime} - {shift.endTime}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {shiftAssignments.length} of {SECTIONS.length} sections filled
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Assign Staff">
              <IconButton size="small" onClick={() => handleOpenAssignDialog(shift)}>
                <PersonAdd fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Shift">
              <IconButton size="small" color="error" onClick={() => handleDeleteShift(shift.id)}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {SECTIONS.map(section => {
            const assignment = shiftAssignments.find(a => a.section === section);
            const staff = assignment ? staffMembers.find(s => s.user_id === assignment.staffId) : null;
            const colors = SECTION_COLORS[section];

            return (
              <Box
                key={section}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1,
                  borderRadius: 1,
                  bgcolor: assignment ? colors.bg : 'grey.50',
                  border: '1px solid',
                  borderColor: assignment ? colors.border : 'grey.200',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{ 
                      color: assignment ? colors.text : 'grey.500',
                      minWidth: 80,
                    }}
                  >
                    {section}
                  </Typography>
                  {staff ? (
                    <Chip
                      label={staff.name}
                      size="small"
                      sx={{
                        bgcolor: 'white',
                        border: '1px solid',
                        borderColor: colors.border,
                        color: colors.text,
                        fontWeight: 500,
                        fontSize: '0.75rem',
                      }}
                    />
                  ) : (
                    <Typography variant="caption" color="grey.400">
                      Unassigned
                    </Typography>
                  )}
                </Box>
                {assignment && (
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveAssignment(assignment.id, staff?.name || '')}
                    sx={{ p: 0.5 }}
                  >
                    <Close sx={{ fontSize: 14, color: 'grey.400' }} />
                  </IconButton>
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="primary.main">
            Schedule Manager
          </Typography>
          <Typography color="text.secondary">
            Assign staff to sections and manage shifts
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateShiftOpen(true)}
          sx={{ px: 3 }}
        >
          Create Shift
        </Button>
      </Box>

      {/* Week Navigation */}
      <Paper 
        elevation={0} 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2,
          mb: 3,
          bgcolor: 'grey.50',
          borderRadius: 2,
        }}
      >
        <IconButton onClick={handlePrevWeek}>
          <ChevronLeft />
        </IconButton>
        <Typography variant="h6" fontWeight={600}>
          {format(currentWeekStart, 'MMMM d')} - {format(addDays(currentWeekStart, 6), 'MMMM d, yyyy')}
        </Typography>
        <IconButton onClick={handleNextWeek}>
          <ChevronRight />
        </IconButton>
      </Paper>

      {/* Section Legend */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {SECTIONS.map(section => {
          const colors = SECTION_COLORS[section];
          return (
            <Chip
              key={section}
              label={section}
              sx={{
                bgcolor: colors.bg,
                color: colors.text,
                border: '1px solid',
                borderColor: colors.border,
                fontWeight: 600,
              }}
            />
          );
        })}
      </Box>

      {/* Calendar Grid */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: 2,
          minHeight: 400,
        }}
      >
        {weekDays.map(day => {
          const dayShifts = shiftsForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <Paper
              key={day.toISOString()}
              elevation={0}
              sx={{
                p: 2,
                minHeight: 300,
                border: '1px solid',
                borderColor: isToday ? 'primary.main' : 'divider',
                borderRadius: 2,
                bgcolor: isToday ? 'rgba(30, 58, 95, 0.02)' : 'background.paper',
              }}
            >
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  pb: 2, 
                  mb: 2, 
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography 
                  variant="caption" 
                  color={isToday ? 'primary.main' : 'text.secondary'}
                  fontWeight={500}
                >
                  {format(day, 'EEE')}
                </Typography>
                <Typography 
                  variant="h6" 
                  fontWeight={isToday ? 700 : 600}
                  color={isToday ? 'primary.main' : 'text.primary'}
                >
                  {format(day, 'd')}
                </Typography>
              </Box>

              {dayShifts.length === 0 ? (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: 100,
                    color: 'grey.400',
                  }}
                >
                  <Typography variant="body2">No shifts</Typography>
                </Box>
              ) : (
                dayShifts.map(shift => renderShiftCard(shift))
              )}
            </Paper>
          );
        })}
      </Box>

      {/* Dialogs */}
      <CreateShiftDialog
        open={createShiftOpen}
        onClose={() => setCreateShiftOpen(false)}
      />

      <AssignStaffDialog
        open={assignDialogOpen}
        onClose={() => {
          setAssignDialogOpen(false);
          setSelectedShift(null);
        }}
        shift={selectedShift}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SchedulerGrid;
