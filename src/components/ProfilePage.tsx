import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Divider,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Person,
  Email,
  Badge,
  CalendarMonth,
  AccessTime,
  Place,
  ArrowBack,
  Today,
  Upcoming,
  History,
  EventAvailable,
} from '@mui/icons-material';
import { format, parseISO, isAfter, isBefore, isToday as isDateToday, startOfDay } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useSchedule } from '@/context/ScheduleContext';
import { SECTION_COLORS } from '@/types';

interface ProfilePageProps {
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { profile } = useAuth();
  const { shifts, getAssignmentsForStaff } = useSchedule();

  const myAssignments = useMemo(() => {
    if (!profile) return [];
    return getAssignmentsForStaff(profile.user_id);
  }, [profile, getAssignmentsForStaff]);

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    
    const allShifts = myAssignments
      .map(assignment => {
        const shift = shifts.find(s => s.id === assignment.shiftId);
        if (!shift) return null;
        return { assignment, shift };
      })
      .filter(item => item !== null);

    const todayCount = allShifts.filter(item => isDateToday(parseISO(item!.shift.date))).length;
    const upcomingCount = allShifts.filter(item => {
      const shiftDate = parseISO(item!.shift.date);
      return isAfter(shiftDate, today) && !isDateToday(shiftDate);
    }).length;
    const historyCount = allShifts.filter(item => isBefore(parseISO(item!.shift.date), today)).length;

    // Calculate section breakdown
    const sectionCounts: Record<string, number> = {};
    allShifts.forEach(item => {
      const section = item!.assignment.section;
      sectionCounts[section] = (sectionCounts[section] || 0) + 1;
    });

    return { todayCount, upcomingCount, historyCount, totalShifts: allShifts.length, sectionCounts };
  }, [myAssignments, shifts]);

  const upcomingShifts = useMemo(() => {
    const today = startOfDay(new Date());
    
    return myAssignments
      .map(assignment => {
        const shift = shifts.find(s => s.id === assignment.shiftId);
        if (!shift) return null;
        return { assignment, shift };
      })
      .filter(item => {
        if (!item) return false;
        const shiftDate = parseISO(item.shift.date);
        return isAfter(shiftDate, today) || isDateToday(shiftDate);
      })
      .sort((a, b) => {
        const dateCompare = a!.shift.date.localeCompare(b!.shift.date);
        if (dateCompare !== 0) return dateCompare;
        return a!.shift.startTime.localeCompare(b!.shift.startTime);
      })
      .slice(0, 5);
  }, [myAssignments, shifts]);

  if (!profile) {
    return null;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={onBack}
        sx={{ mb: 3 }}
        color="primary"
      >
        Back to Dashboard
      </Button>

      {/* Profile Header Card */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Avatar
            src={profile.avatar_url || undefined}
            sx={{
              width: 140,
              height: 140,
              fontSize: '3.5rem',
              fontWeight: 600,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              border: '4px solid rgba(255, 255, 255, 0.4)',
            }}
          >
            {profile.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>
              {profile.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip
                label={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              />
              <Chip
                label={profile.is_active ? 'Active' : 'Inactive'}
                sx={{
                  bgcolor: profile.is_active ? 'success.main' : 'error.main',
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.9 }}>
              <Email sx={{ fontSize: 20 }} />
              <Typography variant="body1">{profile.email}</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Stats Grid */}
      <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
        Assignment Overview
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: 'success.light',
              border: '1px solid',
              borderColor: 'success.main',
              textAlign: 'center',
            }}
          >
            <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48, mx: 'auto', mb: 1 }}>
              <Today />
            </Avatar>
            <Typography variant="h3" fontWeight={700} color="success.dark">
              {stats.todayCount}
            </Typography>
            <Typography variant="body2" color="success.dark" fontWeight={500}>
              Today's Shifts
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: 'primary.main',
              textAlign: 'center',
              color: 'white',
            }}
          >
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48, mx: 'auto', mb: 1 }}>
              <Upcoming />
            </Avatar>
            <Typography variant="h3" fontWeight={700}>
              {stats.upcomingCount}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }} fontWeight={500}>
              Upcoming Shifts
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: 'grey.100',
              border: '1px solid',
              borderColor: 'grey.300',
              textAlign: 'center',
            }}
          >
            <Avatar sx={{ bgcolor: 'grey.400', width: 48, height: 48, mx: 'auto', mb: 1 }}>
              <History />
            </Avatar>
            <Typography variant="h3" fontWeight={700} color="text.primary">
              {stats.historyCount}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Completed Shifts
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: 'secondary.light',
              border: '1px solid',
              borderColor: 'secondary.main',
              textAlign: 'center',
            }}
          >
            <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48, mx: 'auto', mb: 1 }}>
              <EventAvailable />
            </Avatar>
            <Typography variant="h3" fontWeight={700} color="secondary.dark">
              {stats.totalShifts}
            </Typography>
            <Typography variant="body2" color="secondary.dark" fontWeight={500}>
              Total Shifts
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Two Column Layout */}
      <Grid container spacing={3}>
        {/* Profile Details */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" />
              Profile Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Full Name
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {profile.name}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Email Address
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {profile.email}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Role
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    icon={<Badge />}
                    label={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Account Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={profile.is_active ? 'Active' : 'Inactive'}
                    color={profile.is_active ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </Box>

              {Object.keys(stats.sectionCounts).length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Section Experience
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                    {Object.entries(stats.sectionCounts).map(([section, count]) => {
                      const colors = SECTION_COLORS[section as keyof typeof SECTION_COLORS];
                      return (
                        <Chip
                          key={section}
                          label={`${section}: ${count}`}
                          size="small"
                          sx={{
                            bgcolor: colors?.bg,
                            color: colors?.text,
                            border: '1px solid',
                            borderColor: colors?.border,
                            fontWeight: 600,
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Upcoming Shifts */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarMonth color="primary" />
              Upcoming Shifts
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {upcomingShifts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CalendarMonth sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                <Typography color="text.secondary">No upcoming shifts scheduled</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {upcomingShifts.map((item) => {
                  if (!item) return null;
                  const { assignment, shift } = item;
                  const colors = SECTION_COLORS[assignment.section];
                  const shiftDate = parseISO(shift.date);
                  const isToday = isDateToday(shiftDate);

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
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {format(shiftDate, 'EEE, MMM d')}
                              </Typography>
                              {isToday && (
                                <Chip label="Today" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {shift.startTime} - {shift.endTime}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Place sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
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
                              fontWeight: 600,
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
