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
  Divider,
} from '@mui/material';
import { CalendarMonth, AccessTime, Place, EventAvailable, History, Today, Upcoming } from '@mui/icons-material';
import { format, parseISO, isAfter, isBefore, isToday as isDateToday, startOfDay } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useSchedule } from '@/context/ScheduleContext';
import { SECTION_COLORS, Assignment, Shift } from '@/types';

interface ShiftWithAssignment {
  assignment: Assignment;
  shift: Shift;
}

const ShiftCard: React.FC<{ item: ShiftWithAssignment; showTodayBadge?: boolean }> = ({ item, showTodayBadge = false }) => {
  const { assignment, shift } = item;
  const colors = SECTION_COLORS[assignment.section];
  const shiftDate = parseISO(shift.date);
  const isToday = isDateToday(shiftDate);

  return (
    <Card 
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: isToday && showTodayBadge ? 'primary.main' : 'divider',
        borderLeft: '4px solid',
        borderLeftColor: colors.border,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CalendarMonth sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight={600}>
                {format(shiftDate, 'EEEE, MMMM d, yyyy')}
              </Typography>
              {isToday && showTodayBadge && (
                <Chip
                  label="Today"
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 600, height: 22 }}
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
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
        </Box>
      </CardContent>
    </Card>
  );
};

const EmptyState: React.FC<{ message: string; submessage: string }> = ({ message, submessage }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      textAlign: 'center',
      borderRadius: 2,
      bgcolor: 'grey.50',
      border: '1px dashed',
      borderColor: 'grey.300',
    }}
  >
    <Typography variant="body1" color="grey.600" fontWeight={500}>
      {message}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {submessage}
    </Typography>
  </Paper>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; count: number; color?: string }> = ({ 
  icon, title, count, color = 'text.primary' 
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
    {icon}
    <Typography variant="h6" fontWeight={600} color={color}>
      {title}
    </Typography>
    <Chip 
      label={count} 
      size="small" 
      sx={{ 
        bgcolor: 'grey.200', 
        fontWeight: 600,
        minWidth: 28,
        height: 24,
      }} 
    />
  </Box>
);

const StaffDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { shifts, getAssignmentsForStaff, isLoading } = useSchedule();

  const myAssignments = useMemo(() => {
    if (!profile) return [];
    return getAssignmentsForStaff(profile.user_id);
  }, [profile, getAssignmentsForStaff]);

  const { todayShifts, upcomingShifts, historyShifts } = useMemo(() => {
    const today = startOfDay(new Date());
    
    const allShifts = myAssignments
      .map(assignment => {
        const shift = shifts.find(s => s.id === assignment.shiftId);
        if (!shift) return null;
        return { assignment, shift };
      })
      .filter((item): item is ShiftWithAssignment => item !== null);

    const todayShifts = allShifts
      .filter(item => isDateToday(parseISO(item.shift.date)))
      .sort((a, b) => a.shift.startTime.localeCompare(b.shift.startTime));

    const upcomingShifts = allShifts
      .filter(item => {
        const shiftDate = parseISO(item.shift.date);
        return isAfter(shiftDate, today) && !isDateToday(shiftDate);
      })
      .sort((a, b) => {
        const dateCompare = a.shift.date.localeCompare(b.shift.date);
        if (dateCompare !== 0) return dateCompare;
        return a.shift.startTime.localeCompare(b.shift.startTime);
      });

    const historyShifts = allShifts
      .filter(item => {
        const shiftDate = parseISO(item.shift.date);
        return isBefore(shiftDate, today);
      })
      .sort((a, b) => {
        const dateCompare = b.shift.date.localeCompare(a.shift.date); // Most recent first
        if (dateCompare !== 0) return dateCompare;
        return b.shift.startTime.localeCompare(a.shift.startTime);
      });

    return { todayShifts, upcomingShifts, historyShifts };
  }, [myAssignments, shifts]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      {/* Header with Profile */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
        <Avatar
          src={profile?.avatar_url || undefined}
          sx={{
            width: 80,
            height: 80,
            bgcolor: 'primary.main',
            fontSize: '2rem',
            fontWeight: 600,
            border: '3px solid',
            borderColor: 'primary.light',
          }}
        >
          {profile?.name?.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700} color="primary.main">
            Welcome, {profile?.name?.split(' ')[0]}!
          </Typography>
          <Typography color="text.secondary">
            View your assignments and shift history
          </Typography>
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            bgcolor: 'success.light',
            border: '1px solid',
            borderColor: 'success.main',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
              <Today sx={{ fontSize: 20 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} color="success.dark">
                {todayShifts.length}
              </Typography>
              <Typography variant="body2" color="success.dark">
                Today
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            bgcolor: 'primary.main',
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 40, height: 40 }}>
              <Upcoming sx={{ fontSize: 20 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                {upcomingShifts.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Upcoming
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            bgcolor: 'grey.100',
            border: '1px solid',
            borderColor: 'grey.300',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'grey.400', width: 40, height: 40 }}>
              <History sx={{ fontSize: 20 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} color="text.primary">
                {historyShifts.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Past
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Today's Assignment */}
      <Box sx={{ mb: 4 }}>
        <SectionHeader 
          icon={<Today sx={{ color: 'success.main' }} />} 
          title="Today's Assignment" 
          count={todayShifts.length}
          color="success.main"
        />
        {todayShifts.length === 0 ? (
          <EmptyState 
            message="No shifts today" 
            submessage="Enjoy your day off!" 
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {todayShifts.map(item => (
              <ShiftCard key={item.assignment.id} item={item} />
            ))}
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Upcoming Assignments */}
      <Box sx={{ mb: 4 }}>
        <SectionHeader 
          icon={<Upcoming sx={{ color: 'primary.main' }} />} 
          title="Upcoming Assignments" 
          count={upcomingShifts.length}
          color="primary.main"
        />
        {upcomingShifts.length === 0 ? (
          <EmptyState 
            message="No upcoming shifts" 
            submessage="Check back later for new assignments" 
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {upcomingShifts.map(item => (
              <ShiftCard key={item.assignment.id} item={item} />
            ))}
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Assignment History */}
      <Box>
        <SectionHeader 
          icon={<History sx={{ color: 'grey.600' }} />} 
          title="Assignment History" 
          count={historyShifts.length}
          color="grey.700"
        />
        {historyShifts.length === 0 ? (
          <EmptyState 
            message="No past assignments" 
            submessage="Your completed shifts will appear here" 
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, opacity: 0.85 }}>
            {historyShifts.slice(0, 10).map(item => (
              <ShiftCard key={item.assignment.id} item={item} />
            ))}
            {historyShifts.length > 10 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                Showing 10 of {historyShifts.length} past assignments
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default StaffDashboard;
