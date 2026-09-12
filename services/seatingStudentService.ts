import { supabase } from './supabaseClient';
import { SeatingStudent, StudentSeatingData } from '../types/seating';

/**
 * Service for managing seating_students table (separate from profiles).
 * Teachers create/manage seating students independently, with optional linking to real profiles.
 */
export const seatingStudentService = {

  /**
   * Get all seating students for a specific class owned by the current teacher.
   */
  async getStudentsByClass(className: string): Promise<SeatingStudent[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('seating_students')
      .select('*')
      .eq('owner_id', user.id)
      .eq('class_name', className)
      .order('name');

    if (error) {
      console.error('Error fetching seating students:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      gender: row.gender || 'other',
      linked_profile_id: row.linked_profile_id,
      participation: row.participation || 0,
      class_name: row.class_name,
      syncedGrades: null, // populated separately via syncPerformance
    }));
  },
  /**
   * Convert DB seating student to canvas StudentSeatingData format.
   */
  toStudentSeatingData(student: SeatingStudent): StudentSeatingData {
    return {
      id: student.id,
      name: student.name,
      gender: student.gender,
      linkedProfileId: student.linked_profile_id,
      participationScore: student.participation || 0,
      assignmentsCompleted: student.syncedGrades?.assignmentsCompleted || 0,
      totalAssignments: student.syncedGrades?.totalAssignments || 10,
      lastAssessmentScore: student.syncedGrades?.lastAssessmentScore || 0,
    };
  },

  /**
   * Add a single student to the seating roster.
   */
  async addStudent(name: string, className: string, gender: 'male' | 'female' | 'other' = 'other'): Promise<SeatingStudent | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('seating_students')
      .insert({
        owner_id: user.id,
        class_name: className,
        name: name.trim(),
        gender,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding seating student:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      gender: data.gender || 'other',
      linked_profile_id: data.linked_profile_id,
      participation: data.participation || 0,
      class_name: data.class_name,
      syncedGrades: null,
    };
  },

  /**
   * Bulk add students from a list of names (e.g. from textarea paste).
   */
  async bulkAddStudents(names: string[], className: string, defaultGender: 'male' | 'female' | 'other' = 'other'): Promise<SeatingStudent[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const validNames = names
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (validNames.length === 0) return [];

    const rows = validNames.map(name => ({
      owner_id: user.id,
      class_name: className,
      name,
      gender: defaultGender,
    }));

    const { data, error } = await supabase
      .from('seating_students')
      .insert(rows)
      .select();

    if (error) {
      console.error('Error bulk adding students:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      gender: row.gender || 'other',
      linked_profile_id: row.linked_profile_id,
      participation: row.participation || 0,
      class_name: row.class_name,
      syncedGrades: null,
    }));
  },

  /**
   * Remove a single student from the seating roster.
   */
  async removeStudent(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('seating_students')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing seating student:', error);
      return false;
    }
    return true;
  },

  /**
   * Clear all students for a specific class.
   */
  async clearRoster(className: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('seating_students')
      .delete()
      .eq('owner_id', user.id)
      .eq('class_name', className);

    if (error) {
      console.error('Error clearing roster:', error);
      return false;
    }
    return true;
  },

  /**
   * Link a seating student to a registered profile.
   */
  async linkToProfile(seatingStudentId: string, profileId: string): Promise<boolean> {
    const { error } = await supabase
      .from('seating_students')
      .update({ linked_profile_id: profileId })
      .eq('id', seatingStudentId);

    if (error) {
      console.error('Error linking profile:', error);
      return false;
    }
    return true;
  },

  /**
   * Unlink a seating student from any profile.
   */
  async unlinkProfile(seatingStudentId: string): Promise<boolean> {
    const { error } = await supabase
      .from('seating_students')
      .update({ linked_profile_id: null })
      .eq('id', seatingStudentId);

    if (error) {
      console.error('Error unlinking profile:', error);
      return false;
    }
    return true;
  },

  /**
   * Update participation score for a seating student.
   */
  async updateParticipation(seatingStudentId: string, participation: number): Promise<boolean> {
    const { error } = await supabase
      .from('seating_students')
      .update({ participation })
      .eq('id', seatingStudentId);

    if (error) {
      console.error('Error updating participation:', error);
      return false;
    }
    return true;
  },

  /**
   * Fetch synced performance data for a linked student (from grades table).
   */
  async getSyncedPerformance(profileId: string): Promise<{ assignmentsCompleted: number; totalAssignments: number; lastAssessmentScore: number } | null> {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select('score')
        .eq('student_id', profileId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error || !data || data.length === 0) return null;

      const scores = data.map((g: any) => g.score).filter((s: any) => typeof s === 'number');
      return {
        assignmentsCompleted: scores.length,
        totalAssignments: 10, // default max
        lastAssessmentScore: scores.length > 0 ? scores[0] : 0,
      };
    } catch {
      return null;
    }
  },

  /**
   * Update student name.
   */
  async updateStudentName(id: string, name: string): Promise<boolean> {
    const { error } = await supabase
      .from('seating_students')
      .update({ name: name.trim() })
      .eq('id', id);

    if (error) {
      console.error('Error updating student name:', error);
      return false;
    }
    return true;
  },

  /**
   * Update student gender.
   */
  async updateStudentGender(id: string, gender: 'male' | 'female' | 'other'): Promise<boolean> {
    const { error } = await supabase
      .from('seating_students')
      .update({ gender })
      .eq('id', id);

    if (error) {
      console.error('Error updating student gender:', error);
      return false;
    }
    return true;
  },

  /**
   * Save layout data (seats, classroom objects, assignment) for a class.
   * Tries Supabase seating_layouts table first, falls back to localStorage.
   */
  async saveClassLayout(className: string, layoutData: any): Promise<boolean> {
    const storageKey = `classflow_seating_layout_${className}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(layoutData));
    } catch {}

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return true;

      const { error } = await supabase
        .from('seating_layouts')
        .upsert(
          {
            owner_id: user.id,
            class_name: className,
            layout_data: layoutData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'owner_id,class_name' }
        );

      if (error) {
        console.warn('Supabase layout upsert warning (saved to localStorage):', error.message);
      }
      return true;
    } catch {
      return true;
    }
  },

  /**
   * Fetch saved layout data for a class.
   */
  async getClassLayout(className: string): Promise<any | null> {
    const storageKey = `classflow_seating_layout_${className}`;
    let localData: any = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) localData = JSON.parse(raw);
    } catch {}

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return localData;

      const { data, error } = await supabase
        .from('seating_layouts')
        .select('layout_data')
        .eq('owner_id', user.id)
        .eq('class_name', className)
        .maybeSingle();

      if (!error && data?.layout_data) {
        return data.layout_data;
      }
    } catch {}

    return localData;
  },

  /**
   * Fetch distinct class names specific to seating layouts and seating students.
   */
  async getSeatingClassNames(): Promise<string[]> {
    const classSet = new Set<string>();

    // 1. Check local storage keys first for immediate availability
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('classflow_seating_layout_')) {
          const className = key.replace('classflow_seating_layout_', '');
          if (className) classSet.add(className);
        }
      }
    } catch {}

    // 2. Fetch saved seating layout class names from database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: layoutData } = await supabase
          .from('seating_layouts')
          .select('class_name')
          .eq('owner_id', user.id);

        if (layoutData) {
          layoutData.forEach((row: any) => {
            if (row.class_name) classSet.add(row.class_name);
          });
        }

        const { data: studentData } = await supabase
          .from('seating_students')
          .select('class_name')
          .eq('owner_id', user.id);

        if (studentData) {
          studentData.forEach((row: any) => {
            if (row.class_name) classSet.add(row.class_name);
          });
        }
      }
    } catch (e) {
      console.error('Error fetching seating class names:', e);
    }

    const result = Array.from(classSet);
    return result.length > 0 ? result : ['Grade 9 Economics'];
  },
};
