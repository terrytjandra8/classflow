export interface Seat {
  id: string;
  label: string; // e.g. "A1", "C2", "Group 1 - Seat 2"
  x: number; // grid position x or pixel position
  y: number; // grid position y or pixel position
  row?: number;
  col?: number;
  groupId?: string;
  groupName?: string;
  isFrontRow?: boolean;
}

export interface StudentSeatingData {
  id: string;
  name: string;
  avatar?: string;
  gender?: 'male' | 'female' | 'other';
  participationScore: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  lastAssessmentScore: number;
}

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

export type LayoutPreset = 'rows_cols' | 'islands' | 'u_shape' | 'custom';

export interface SeatingLayout {
  id: string;
  name: string;
  className: string;
  preset: LayoutPreset;
  rows: number;
  cols: number;
  spacing: number; // aisle width/custom spacing
  hasAisle: boolean;
  whiteboardPosition: 'top' | 'bottom';
  seats: Seat[];
}

export interface SeatingAssignment {
  layoutId: string;
  seatIdToStudentId: Record<string, string>; // seatId -> studentId
}
