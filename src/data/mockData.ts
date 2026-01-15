import { User, Shift, Assignment } from '@/types';

export const mockUsers: User[] = [
  { id: '1', name: 'Sarah Manager', email: 'manager@restaurant.com', role: 'manager', password: 'password123' },
  { id: '2', name: 'John Smith', email: 'john@restaurant.com', role: 'staff', password: 'password123' },
  { id: '3', name: 'Emily Chen', email: 'emily@restaurant.com', role: 'staff', password: 'password123' },
  { id: '4', name: 'Marcus Johnson', email: 'marcus@restaurant.com', role: 'staff', password: 'password123' },
  { id: '5', name: 'Lisa Rodriguez', email: 'lisa@restaurant.com', role: 'staff', password: 'password123' },
  { id: '6', name: 'David Kim', email: 'david@restaurant.com', role: 'staff', password: 'password123' },
];

export const mockShifts: Shift[] = [
  { id: 's1', date: '2026-01-15', startTime: '11:00', endTime: '15:00' },
  { id: 's2', date: '2026-01-15', startTime: '17:00', endTime: '23:00' },
  { id: 's3', date: '2026-01-16', startTime: '11:00', endTime: '15:00' },
  { id: 's4', date: '2026-01-16', startTime: '17:00', endTime: '23:00' },
  { id: 's5', date: '2026-01-17', startTime: '11:00', endTime: '15:00' },
];

export const mockAssignments: Assignment[] = [
  { id: 'a1', shiftId: 's1', staffId: '2', section: 'Bar' },
  { id: 'a2', shiftId: 's1', staffId: '3', section: 'Patio' },
  { id: 'a3', shiftId: 's1', staffId: '4', section: 'Dining Room' },
  { id: 'a4', shiftId: 's2', staffId: '5', section: 'Bar' },
  { id: 'a5', shiftId: 's2', staffId: '6', section: 'Dining Room' },
];
