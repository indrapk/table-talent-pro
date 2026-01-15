import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Shift, Assignment, Section } from '@/types';
import { mockShifts, mockAssignments } from '@/data/mockData';

const SHIFTS_STORAGE_KEY = 'restaurant_shifts';
const ASSIGNMENTS_STORAGE_KEY = 'restaurant_assignments';

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = <T,>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save to localStorage:`, error);
  }
};

interface ScheduleContextType {
  shifts: Shift[];
  assignments: Assignment[];
  addShift: (shift: Omit<Shift, 'id'>) => Shift;
  updateShift: (id: string, updates: Partial<Shift>) => void;
  deleteShift: (id: string) => void;
  assignStaff: (shiftId: string, staffId: string, section: Section) => { success: boolean; error?: string };
  unassignStaff: (assignmentId: string) => void;
  getAssignment: (shiftId: string, staffId: string) => Assignment | undefined;
  getStaffAssignmentForShift: (shiftId: string, staffId: string) => Assignment | undefined;
  isStaffAssignedToShift: (shiftId: string, staffId: string) => boolean;
  getAssignmentsForShift: (shiftId: string) => Assignment[];
  getAssignmentsForStaff: (staffId: string) => Assignment[];
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shifts, setShifts] = useState<Shift[]>(() => loadFromStorage(SHIFTS_STORAGE_KEY, mockShifts));
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadFromStorage(ASSIGNMENTS_STORAGE_KEY, mockAssignments));

  // Persist to localStorage whenever data changes
  useEffect(() => {
    saveToStorage(SHIFTS_STORAGE_KEY, shifts);
  }, [shifts]);

  useEffect(() => {
    saveToStorage(ASSIGNMENTS_STORAGE_KEY, assignments);
  }, [assignments]);

  const addShift = useCallback((shiftData: Omit<Shift, 'id'>) => {
    const newShift: Shift = {
      ...shiftData,
      id: `s${Date.now()}`,
    };
    setShifts(prev => [...prev, newShift]);
    return newShift;
  }, []);

  const updateShift = useCallback((id: string, updates: Partial<Shift>) => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteShift = useCallback((id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
    setAssignments(prev => prev.filter(a => a.shiftId !== id));
  }, []);

  const isStaffAssignedToShift = useCallback((shiftId: string, staffId: string) => {
    return assignments.some(a => a.shiftId === shiftId && a.staffId === staffId);
  }, [assignments]);

  const getStaffAssignmentForShift = useCallback((shiftId: string, staffId: string) => {
    return assignments.find(a => a.shiftId === shiftId && a.staffId === staffId);
  }, [assignments]);

  const assignStaff = useCallback((shiftId: string, staffId: string, section: Section) => {
    // Validation: Check if staff is already assigned to this shift
    if (isStaffAssignedToShift(shiftId, staffId)) {
      return { 
        success: false, 
        error: 'Staff member is already assigned to a section in this shift. Remove existing assignment first.' 
      };
    }

    const newAssignment: Assignment = {
      id: `a${Date.now()}`,
      shiftId,
      staffId,
      section,
    };
    setAssignments(prev => [...prev, newAssignment]);
    return { success: true };
  }, [isStaffAssignedToShift]);

  const unassignStaff = useCallback((assignmentId: string) => {
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
  }, []);

  const getAssignment = useCallback((shiftId: string, staffId: string) => {
    return assignments.find(a => a.shiftId === shiftId && a.staffId === staffId);
  }, [assignments]);

  const getAssignmentsForShift = useCallback((shiftId: string) => {
    return assignments.filter(a => a.shiftId === shiftId);
  }, [assignments]);

  const getAssignmentsForStaff = useCallback((staffId: string) => {
    return assignments.filter(a => a.staffId === staffId);
  }, [assignments]);

  return (
    <ScheduleContext.Provider
      value={{
        shifts,
        assignments,
        addShift,
        updateShift,
        deleteShift,
        assignStaff,
        unassignStaff,
        getAssignment,
        getStaffAssignmentForShift,
        isStaffAssignedToShift,
        getAssignmentsForShift,
        getAssignmentsForStaff,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
