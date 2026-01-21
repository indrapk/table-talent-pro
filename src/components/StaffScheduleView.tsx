import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Person,
  CalendarMonth,
  AccessTime,
  Place,
  Add,
  Close,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { format, parseISO, addDays, startOfWeek, isAfter, startOfDay } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useSchedule } from '@/context/ScheduleContext';
import { SECTION_COLORS, Shift, Section } from '@/types';
import CreateShiftDialog from './CreateShiftDialog';
import AssignStaffDialog from './AssignStaffDialog';

const StaffScheduleView: React.FC = () => {
  const { profiles } = useAuth();
  const { shifts, assignments, unassignStaff, isLoading } = useSchedule();

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
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

  const selectedStaff = useMemo(() => {
    if (!selectedStaffId) return null;
    return staffMembers.find(s => s.user_id === selectedStaffId) || null;
  }, [selectedStaffId, staffMembers]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  // Get assignments for selected staff within current week
  const staffAssignments = useMemo(() => {
    if (!selectedStaffId) return [];
    
    const weekStart = format(currentWeekStart, 'yyyy-MM-dd');
    const weekEnd = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');
    
    return assignments
      .filter(a => a.staffId === selectedStaffId)
      .map(assignment => {
        const shift = shifts.find(s => s.id === assignment.shiftId);
        if (!shift) return null;
        // Filter by current week
        if (shift.date < weekStart || shift.date > weekEnd) return null;
        return { assignment, shift };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        const dateCompare = a.shift.date.localeCompare(b.shift.date);
        if (dateCompare !== 0) return dateCompare;
        return a.shift.startTime.localeCompare(b.shift.startTime);
      });
  }, [selectedStaffId, assignments, shifts, currentWeekStart]);

  // Get unassigned shifts for the week (shifts where selected staff could be assigned)
  const availableShiftsForStaff = useMemo(() => {
    if (!selectedStaffId) return [];
    
    const weekStart = format(currentWeekStart, 'yyyy-MM-dd');
    const weekEnd = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');
    
    return shifts
      .filter(shift => {
        // Within current week
        if (shift.date < weekStart || shift.date > weekEnd) return false;
        // Staff not already assigned to this shift
        const isAssigned = assignments.some(a => a.shiftId === shift.id && a.staffId === selectedStaffId);
        return !isAssigned;
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [selectedStaffId, shifts, assignments, currentWeekStart]);

  // Count assignments per staff
  const staffAssignmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    staffMembers.forEach(staff => {
      counts[staff.user_id] = assignments.filter(a => a.staffId === staff.user_id).length;
    });
    return counts;
  }, [staffMembers, assignments]);

  const handlePrevWeek = () => setCurrentWeekStart(prev => addDays(prev, -7));
  const handleNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));

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
    <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)' }}>
      {/* Staff List Sidebar */}
      <Paper
        elevation={0}
        sx={{
          width: 280,
          flexShrink: 0,
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600}>
            Staff Members
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {staffMembers.length} staff
          </Typography>
        </Box>

        <List sx={{ flex: 1, overflow: 'auto', py: 1 }}>
          {staffMembers.map(staff => (
            <ListItemButton
              key={staff.user_id}
              selected={selectedStaffId === staff.user_id}
              onClick={() => setSelectedStaffId(staff.user_id)}
              sx={{
                mx: 1,
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemText-secondary': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                },
              }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: selectedStaffId === staff.user_id ? 'rgba(255, 255, 255, 0.2)' : 'primary.light',
                    color: selectedStaffId === staff.user_id ? 'white' : 'primary.main',
                  }}
                >
                  <Person />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={staff.name}
                secondary={`${staffAssignmentCounts[staff.user_id] || 0} assignments`}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItemButton>
          ))}
        </List>
      </Paper>

      {/* Schedule Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {!selectedStaff ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
            }}
          >
            <Person sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography variant="h6">Select a staff member</Typography>
            <Typography>Choose from the list to view their schedule</Typography>
          </Box>
        ) : (
          <>
            {/* Staff Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  {selectedStaff.name}
                </Typography>
                <Typography color="text.secondary">
                  {staffAssignments.length} shifts this week
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

            {/* Assigned Shifts */}
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Assigned Shifts
            </Typography>

            {staffAssignments.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: 2,
                  bgcolor: 'grey.50',
                  border: '1px dashed',
                  borderColor: 'grey.300',
                  mb: 3,
                }}
              >
                <CalendarMonth sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="grey.600">
                  No shifts this week
                </Typography>
                <Typography color="text.secondary">
                  {selectedStaff.name} has no assigned shifts for this week
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                {staffAssignments.map(({ assignment, shift }) => {
                  const colors = SECTION_COLORS[assignment.section];
                  const shiftDate = parseISO(shift.date);
                  const isToday = format(shiftDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                  return (
                    <Card
                      key={assignment.id}
                      elevation={0}
                      sx={{
                        border: '1px solid',
                        borderColor: isToday ? 'primary.main' : 'divider',
                        borderLeft: '4px solid',
                        borderLeftColor: colors.border,
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <CalendarMonth sx={{ fontSize: 18, color: 'primary.main' }} />
                                <Typography fontWeight={600}>
                                  {format(shiftDate, 'EEE, MMM d')}
                                </Typography>
                                {isToday && (
                                  <Chip label="Today" size="small" color="primary" sx={{ fontWeight: 600 }} />
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {shift.startTime} - {shift.endTime}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Place sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {assignment.section}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={assignment.section}
                              size="small"
                              sx={{
                                bgcolor: colors.bg,
                                color: colors.text,
                                border: '1px solid',
                                borderColor: colors.border,
                                fontWeight: 600,
                              }}
                            />
                            <Tooltip title="Remove assignment">
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveAssignment(assignment.id)}
                                sx={{ color: 'grey.400' }}
                              >
                                <Close fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}

            {/* Available Shifts to Assign */}
            {availableShiftsForStaff.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Available Shifts to Assign
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {availableShiftsForStaff.map(shift => {
                    const shiftDate = parseISO(shift.date);
                    const shiftAssignments = assignments.filter(a => a.shiftId === shift.id);
                    const assignedSections = shiftAssignments.map(a => a.section);

                    return (
                      <Paper
                        key={shift.id}
                        elevation={0}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          '&:hover': {
                            bgcolor: 'grey.50',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box>
                            <Typography fontWeight={500}>
                              {format(shiftDate, 'EEE, MMM d')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {shift.startTime} - {shift.endTime}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {(['Bar', 'Patio', 'Dining Room'] as Section[]).map(section => {
                              const isAssigned = assignedSections.includes(section);
                              const colors = SECTION_COLORS[section];
                              return (
                                <Chip
                                  key={section}
                                  label={section}
                                  size="small"
                                  sx={{
                                    bgcolor: isAssigned ? 'grey.200' : colors.bg,
                                    color: isAssigned ? 'grey.500' : colors.text,
                                    textDecoration: isAssigned ? 'line-through' : 'none',
                                    opacity: isAssigned ? 0.5 : 1,
                                    fontSize: '0.7rem',
                                  }}
                                />
                              );
                            })}
                          </Box>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Add />}
                          onClick={() => handleOpenAssignDialog(shift)}
                        >
                          Assign
                        </Button>
                      </Paper>
                    );
                  })}
                </Box>
              </>
            )}
          </>
        )}
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
        preselectedStaffId={selectedStaffId || undefined}
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

export default StaffScheduleView;
