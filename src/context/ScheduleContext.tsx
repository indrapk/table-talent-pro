import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shift, Assignment, Section } from '@/types';
import { useAuth } from './AuthContext';

interface DbShift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface DbAssignment {
  id: string;
  shift_id: string;
  staff_id: string;
  section: Section;
  created_at: string;
  updated_at: string;
}

interface ScheduleContextType {
  shifts: Shift[];
  assignments: Assignment[];
  isLoading: boolean;
  addShift: (shift: Omit<Shift, 'id'>) => Promise<{ success: boolean; shift?: Shift; error?: string }>;
  checkShiftOverlap: (date: string, startTime: string, endTime: string, excludeShiftId?: string) => boolean;
  updateShift: (id: string, updates: Partial<Shift>) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  assignStaff: (shiftId: string, staffId: string, section: Section) => Promise<{ success: boolean; error?: string }>;
  unassignStaff: (assignmentId: string) => Promise<void>;
  getAssignment: (shiftId: string, staffId: string) => Assignment | undefined;
  getStaffAssignmentForShift: (shiftId: string, staffId: string) => Assignment | undefined;
  isStaffAssignedToShift: (shiftId: string, staffId: string) => boolean;
  getAssignmentsForShift: (shiftId: string) => Assignment[];
  getAssignmentsForStaff: (staffId: string) => Assignment[];
  refreshData: () => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

const mapDbShiftToShift = (dbShift: DbShift): Shift => ({
  id: dbShift.id,
  date: dbShift.date,
  startTime: dbShift.start_time.substring(0, 5), // Remove seconds
  endTime: dbShift.end_time.substring(0, 5),
});

const mapDbAssignmentToAssignment = (dbAssignment: DbAssignment): Assignment => ({
  id: dbAssignment.id,
  shiftId: dbAssignment.shift_id,
  staffId: dbAssignment.staff_id,
  section: dbAssignment.section,
});

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchShifts = useCallback(async () => {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching shifts:', error);
      return [];
    }
    return (data as DbShift[]).map(mapDbShiftToShift);
  }, []);

  const fetchAssignments = useCallback(async () => {
    const { data, error } = await supabase
      .from('assignments')
      .select('*');
    
    if (error) {
      console.error('Error fetching assignments:', error);
      return [];
    }
    return (data as DbAssignment[]).map(mapDbAssignmentToAssignment);
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    const [shiftsData, assignmentsData] = await Promise.all([
      fetchShifts(),
      fetchAssignments(),
    ]);
    setShifts(shiftsData);
    setAssignments(assignmentsData);
    setIsLoading(false);
  }, [fetchShifts, fetchAssignments]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    } else {
      setShifts([]);
      setAssignments([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, refreshData]);

  const checkShiftOverlap = useCallback((date: string, startTime: string, endTime: string, excludeShiftId?: string): boolean => {
    return shifts.some(shift => {
      if (shift.date !== date) return false;
      if (excludeShiftId && shift.id === excludeShiftId) return false;
      
      // Check if time ranges overlap
      // Overlap occurs when: newStart < existingEnd AND newEnd > existingStart
      return startTime < shift.endTime && endTime > shift.startTime;
    });
  }, [shifts]);

  const addShift = useCallback(async (shiftData: Omit<Shift, 'id'>): Promise<{ success: boolean; shift?: Shift; error?: string }> => {
    // Check for overlapping shifts
    if (checkShiftOverlap(shiftData.date, shiftData.startTime, shiftData.endTime)) {
      return { 
        success: false, 
        error: 'A shift already exists during this time. Please choose a different time slot.' 
      };
    }

    const { data, error } = await supabase
      .from('shifts')
      .insert({
        date: shiftData.date,
        start_time: shiftData.startTime,
        end_time: shiftData.endTime,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding shift:', error);
      return { success: false, error: 'Failed to create shift. You may not have permission.' };
    }

    const newShift = mapDbShiftToShift(data as DbShift);
    setShifts(prev => [...prev, newShift]);
    return { success: true, shift: newShift };
  }, [checkShiftOverlap]);

  const updateShift = useCallback(async (id: string, updates: Partial<Shift>) => {
    const dbUpdates: Partial<DbShift> = {};
    if (updates.date) dbUpdates.date = updates.date;
    if (updates.startTime) dbUpdates.start_time = updates.startTime;
    if (updates.endTime) dbUpdates.end_time = updates.endTime;

    const { error } = await supabase
      .from('shifts')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating shift:', error);
      return;
    }

    setShifts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteShift = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting shift:', error);
      return;
    }

    setShifts(prev => prev.filter(s => s.id !== id));
    setAssignments(prev => prev.filter(a => a.shiftId !== id));
  }, []);

  const isStaffAssignedToShift = useCallback((shiftId: string, staffId: string) => {
    return assignments.some(a => a.shiftId === shiftId && a.staffId === staffId);
  }, [assignments]);

  const getStaffAssignmentForShift = useCallback((shiftId: string, staffId: string) => {
    return assignments.find(a => a.shiftId === shiftId && a.staffId === staffId);
  }, [assignments]);

  const assignStaff = useCallback(async (shiftId: string, staffId: string, section: Section) => {
    // Validation: Check if staff is already assigned to this shift
    if (isStaffAssignedToShift(shiftId, staffId)) {
      return { 
        success: false, 
        error: 'Staff member is already assigned to a section in this shift. Remove existing assignment first.' 
      };
    }

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        shift_id: shiftId,
        staff_id: staffId,
        section,
      })
      .select()
      .single();

    if (error) {
      console.error('Error assigning staff:', error);
      return { success: false, error: error.message };
    }

    const newAssignment = mapDbAssignmentToAssignment(data as DbAssignment);
    setAssignments(prev => [...prev, newAssignment]);
    return { success: true };
  }, [isStaffAssignedToShift]);

  const unassignStaff = useCallback(async (assignmentId: string) => {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('Error unassigning staff:', error);
      return;
    }

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
        isLoading,
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
        refreshData,
        checkShiftOverlap,
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
