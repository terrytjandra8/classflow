// ========================================
// Seating Module Types
// ========================================

// --- Seat (a physical position on the canvas) ---
export interface Seat {
  id: string;
  label: string; // e.g. "A1", "C2", "Group 1 - Seat 2"
  x: number; // grid position x
  y: number; // grid position y
  row?: number;
  col?: number;
  groupId?: string;
  groupName?: string;
  isFrontRow?: boolean;
}

// --- Seating Student (from seating_students table — NOT profiles) ---
export interface SeatingStudent {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  linked_profile_id?: string | null; // optional link to a registered profile
  participation: number;
  class_name: string;
  // Synced data (populated when linked_profile_id is set)
  syncedGrades?: {
    assignmentsCompleted: number;
    totalAssignments: number;
    lastAssessmentScore: number;
  } | null;
}

// --- Legacy type kept for backwards compat (internal canvas rendering) ---
export interface StudentSeatingData {
  id: string;
  name: string;
  avatar?: string;
  gender?: 'male' | 'female' | 'other';
  participationScore: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  lastAssessmentScore: number;
  linkedProfileId?: string | null;
}

// --- Classroom Objects (furniture, doors, etc.) ---
export type ClassroomObjectType = 
  | 'teacher_desk'
  | 'exit_door'
  | 'window'
  | 'cabinet'
  | 'projector'
  | 'custom';

export interface ClassroomObject {
  id: string;
  type: ClassroomObjectType;
  label: string;
  x: number; // grid column position
  y: number; // grid row position
  width: number; // span in columns
  height: number; // span in rows
  orientation?: 'horizontal' | 'vertical'; // orientation format
  position?: 'top' | 'bottom' | 'left' | 'right'; // edge alignment for doors/windows
}

// --- Constraints ---
export type ConstraintType = 
  | 'keep_apart' 
  | 'keep_together' 
  | 'front_row_priority' 
  | 'avoid_behind' 
  | 'avoid_beside' 
  | 'gender_balance';

export interface SeatingConstraint {
  id: string;
  type: ConstraintType;
  studentId1: string;
  studentId2?: string; // Optional for single-student constraints like front_row_priority
}

// --- Layout Presets & Table Modes ---
export type LayoutPreset = 'rows_cols' | 'exam_mode' | 'islands' | 'paired_tables' | 'u_shape' | 'custom';

export type TableConnectionMode = 'individual' | 'pairs' | 'connected_rows' | 'islands';

// --- Seating Layout ---
export interface SeatingLayout {
  id: string;
  name: string;
  className: string;
  preset: LayoutPreset;
  rows: number;
  cols: number;
  spacing: number; // aisle width/custom spacing
  hasAisle: boolean;
  aislePositions: number[]; // column indices after which an aisle is placed
  tableMode: TableConnectionMode;
  whiteboardPosition: 'top' | 'bottom';
  seats: Seat[];
  classroomObjects: ClassroomObject[];
}

// --- Seating Assignment ---
export interface SeatingAssignment {
  layoutId: string;
  seatIdToStudentId: Record<string, string>; // seatId -> studentId
}
