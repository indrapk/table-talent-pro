import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { CalendarMonth, AccessTime, Place, EventAvailable } from '@mui/icons-material';
import { format, parseISO, isAfter, startOfDay } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useSchedule } from '@/context/ScheduleContext';
import { SECTION_COLORS } from '@/types';

const StaffDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { shifts, getAssignmentsForStaff, isLoading } = useSchedule();

  const myAssignments = useMemo(() => {
    if (!profile) return [];
    return getAssignmentsForStaff(profile.user_id);
  }, [profile, getAssignmentsForStaff]);

  const upcomingShifts = useMemo(() => {
    const today = startOfDay(new Date());
    
    return myAssignments
      .map(assignment => {
        const shift = shifts.find(s => s.id === assignment.shiftId);
        if (!shift) return null;
        return { assignment, shift };
      })
      .filter((item): item is NonNullable<typeof item> => {
        if (!item) return false;
        const shiftDate = parseISO(item.shift.date);
        return isAfter(shiftDate, today) || format(shiftDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
      })
      .sort((a, b) => {
        const dateCompare = a.shift.date.localeCompare(b.shift.date);
        if (dateCompare !== 0) return dateCompare;
        return a.shift.startTime.localeCompare(b.shift.startTime);
      });
  }, [myAssignments, shifts]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="primary.main">
          My Schedule
        </Typography>
        <Typography color="text.secondary">
          View your upcoming shifts and assignments
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: 'primary.main',
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
              <EventAvailable />
            </Avatar>
            <Box>
              <Typography variant="h3" fontWeight={700}>
                {upcomingShifts.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Upcoming Shifts
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: 'secondary.main',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(30, 58, 95, 0.2)', color: 'primary.main' }}>
              <CalendarMonth />
            </Avatar>
            <Box>
              <Typography variant="h3" fontWeight={700} color="primary.main">
                {myAssignments.length}
              </Typography>
              <Typography variant="body2" color="primary.main" sx={{ opacity: 0.8 }}>
                Total Assignments
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Upcoming Shifts */}
      <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
        Upcoming Shifts
      </Typography>

      {upcomingShifts.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'grey.50',
            border: '1px dashed',
            borderColor: 'grey.300',
          }}
        >
          <CalendarMonth sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="grey.600">
            No upcoming shifts
          </Typography>
          <Typography color="text.secondary">
            You don't have any scheduled shifts at the moment
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {upcomingShifts.map(({ assignment, shift }) => {
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
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CalendarMonth sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight={600}>
                          {format(shiftDate, 'EEEE, MMMM d, yyyy')}
                        </Typography>
                        {isToday && (
                          <Chip
                            label="Today"
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTime sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography color="text.secondary">
                            {shift.startTime} - {shift.endTime}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Place sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography color="text.secondary">
                            {assignment.section}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Chip
                      label={assignment.section}
                      sx={{
                        bgcolor: colors.bg,
                        color: colors.text,
                        border: '1px solid',
                        borderColor: colors.border,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        py: 0.5,
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default StaffDashboard;
