import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { CalendarMonth, AccessTime } from '@mui/icons-material';
import { useSchedule } from '@/context/ScheduleContext';
import { format } from 'date-fns';

interface CreateShiftDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateShiftDialog: React.FC<CreateShiftDialogProps> = ({ open, onClose }) => {
  const { addShift } = useSchedule();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('15:00');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');

    if (!date || !startTime || !endTime) {
      setError('All fields are required');
      return;
    }

    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    addShift({ date, startTime, endTime });
    handleClose();
  };

  const handleClose = () => {
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setStartTime('11:00');
    setEndTime('15:00');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" fontWeight={600}>
          Create New Shift
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Set the date and time for the new shift
        </Typography>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CalendarMonth sx={{ fontSize: 20, color: 'primary.main' }} />
              <Typography fontWeight={500}>Date</Typography>
            </Box>
            <TextField
              type="date"
              fullWidth
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccessTime sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography fontWeight={500}>Start Time</Typography>
              </Box>
              <TextField
                type="time"
                fullWidth
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccessTime sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography fontWeight={500}>End Time</Typography>
              </Box>
              <TextField
                type="time"
                fullWidth
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          Create Shift
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateShiftDialog;
