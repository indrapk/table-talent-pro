import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Add,
  Person,
  AccessTime,
  Close,
} from '@mui/icons-material';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useSchedule } from '@/context/ScheduleContext';
import { SECTIONS, SECTION_COLORS, Section, Shift } from '@/types';
import CreateShiftDialog from './CreateShiftDialog';
import AssignStaffDialog from './AssignStaffDialog';

const SectionScheduleView: React.FC = () => {
  const { profiles } = useAuth();
  const { shifts, assignments, unassignStaff, isLoading } = useSchedule();

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

  const handlePrevWeek = () => setCurrentWeekStart(prev => addDays(prev, -7));
  const handleNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));

  // Get assignments grouped by section and day
  const getSectionAssignmentsForDay = (section: Section, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayShifts = shifts.filter(s => s.date === dateStr);
    
    return dayShifts
      .map(shift => {
        const assignment = assignments.find(a => a.shiftId === shift.id && a.section === section);
        if (!assignment) return null;
        const staff = staffMembers.find(s => s.user_id === assignment.staffId);
        return { shift, assignment, staff };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.shift.startTime.localeCompare(b.shift.startTime));
  };

  // Get unassigned shifts for a section on a day
  const getUnassignedShiftsForSection = (section: Section, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayShifts = shifts.filter(s => s.date === dateStr);
    
    return dayShifts.filter(shift => {
      const hasAssignment = assignments.some(a => a.shiftId === shift.id && a.section === section);
      return !hasAssignment;
    });
  };

  const handleOpenAssignDialog = (shift: Shift) => {
    setSelectedShift(shift);
    setAssignDialogOpen(true);
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    await unassignStaff(assignmentId);
    setSnackbar({ open: true, message: 'Assignment removed', severity: 'success' });
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
            Section View
          </Typography>
          <Typography color="text.secondary">
            View assignments grouped by section across the week
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

      {/* Section Grids */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {SECTIONS.map(section => {
          const colors = SECTION_COLORS[section];

          return (
            <Paper
              key={section}
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: colors.border,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              {/* Section Header */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: colors.bg,
                  borderBottom: '1px solid',
                  borderColor: colors.border,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Chip
                  label={section}
                  sx={{
                    bgcolor: 'white',
                    color: colors.text,
                    border: '1px solid',
                    borderColor: colors.border,
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Weekly coverage overview
                </Typography>
              </Box>

              {/* Week Grid */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {weekDays.map(day => {
                  const isToday = isSameDay(day, new Date());
                  const dayAssignments = getSectionAssignmentsForDay(section, day);
                  const unassignedShifts = getUnassignedShiftsForSection(section, day);

                  return (
                    <Box
                      key={day.toISOString()}
                      sx={{
                        minHeight: 180,
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': { borderRight: 'none' },
                        bgcolor: isToday ? 'rgba(30, 58, 95, 0.02)' : 'transparent',
                      }}
                    >
                      {/* Day Header */}
                      <Box
                        sx={{
                          p: 1.5,
                          textAlign: 'center',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          bgcolor: isToday ? 'primary.main' : 'grey.50',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: isToday ? 'white' : 'text.secondary' }}
                          fontWeight={500}
                        >
                          {format(day, 'EEE')}
                        </Typography>
                        <Typography
                          variant="body1"
                          fontWeight={isToday ? 700 : 600}
                          sx={{ color: isToday ? 'white' : 'text.primary' }}
                        >
                          {format(day, 'd')}
                        </Typography>
                      </Box>

                      {/* Assignments */}
                      <Box sx={{ p: 1 }}>
                        {dayAssignments.length === 0 && unassignedShifts.length === 0 ? (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: 80,
                              color: 'grey.400',
                            }}
                          >
                            <Typography variant="caption">No shifts</Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {/* Assigned shifts */}
                            {dayAssignments.map(({ shift, assignment, staff }) => (
                              <Paper
                                key={assignment.id}
                                elevation={0}
                                sx={{
                                  p: 1,
                                  bgcolor: colors.bg,
                                  border: '1px solid',
                                  borderColor: colors.border,
                                  borderRadius: 1,
                                }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                      <AccessTime sx={{ fontSize: 12, color: 'text.secondary' }} />
                                      <Typography variant="caption" color="text.secondary">
                                        {shift.startTime} - {shift.endTime}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Avatar sx={{ width: 18, height: 18, bgcolor: colors.border }}>
                                        <Person sx={{ fontSize: 12 }} />
                                      </Avatar>
                                      <Typography
                                        variant="body2"
                                        fontWeight={500}
                                        sx={{
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {staff?.name || 'Unknown'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Tooltip title="Remove">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleRemoveAssignment(assignment.id)}
                                      sx={{ p: 0.25, color: 'grey.400' }}
                                    >
                                      <Close sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Paper>
                            ))}

                            {/* Unassigned shifts */}
                            {unassignedShifts.map(shift => (
                              <Paper
                                key={`unassigned-${shift.id}`}
                                elevation={0}
                                sx={{
                                  p: 1,
                                  bgcolor: 'grey.50',
                                  border: '1px dashed',
                                  borderColor: 'grey.300',
                                  borderRadius: 1,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    bgcolor: 'grey.100',
                                    borderColor: colors.border,
                                  },
                                }}
                                onClick={() => handleOpenAssignDialog(shift)}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                  <AccessTime sx={{ fontSize: 12, color: 'grey.400' }} />
                                  <Typography variant="caption" color="grey.500">
                                    {shift.startTime} - {shift.endTime}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" color="grey.400" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Add sx={{ fontSize: 12 }} />
                                  Click to assign
                                </Typography>
                              </Paper>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          );
        })}
      </Box>

      {/* Dialogs */}
      <CreateShiftDialog open={createShiftOpen} onClose={() => setCreateShiftOpen(false)} />

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
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SectionScheduleView;
