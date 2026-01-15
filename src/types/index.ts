export type UserRole = 'manager' | 'staff';

export type Section = 'Bar' | 'Patio' | 'Dining Room';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}

export interface Shift {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

export interface Assignment {
  id: string;
  shiftId: string;
  staffId: string;
  section: Section;
}

export const SECTIONS: Section[] = ['Bar', 'Patio', 'Dining Room'];

export const SECTION_COLORS: Record<Section, { bg: string; text: string; border: string }> = {
  'Bar': { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
  'Patio': { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
  'Dining Room': { bg: '#E0E7FF', text: '#3730A3', border: '#6366F1' },
};
