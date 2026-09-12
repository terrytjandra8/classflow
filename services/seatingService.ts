import { Seat, SeatingLayout, StudentSeatingData, SeatingConstraint, LayoutPreset, TableConnectionMode, ClassroomObject } from '../types/seating';

export class SeatingService {
  private STORAGE_KEY_LAYOUTS = 'classflow_seating_layouts';

  /**
   * Generate layout grid based on preset and table mode.
   * FIXED: Properly supports up to 12 columns with correct grid positioning.
   */
  createLayout(
    name: string, 
    className: string, 
    preset: LayoutPreset, 
    rows: number, 
    cols: number, 
    hasAisle: boolean = true,
    tableMode: TableConnectionMode = 'pairs',
    aislePositions: number[] = [],
    classroomObjects: ClassroomObject[] = []
  ): SeatingLayout {
    const seats: Seat[] = [];
    const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

    // Clamp values
    const safeRows = Math.min(Math.max(rows, 1), 12);
    const safeCols = Math.min(Math.max(cols, 1), 12);

    // Compute default aisle positions if none provided
    const effectiveAislePositions = aislePositions.length > 0 
      ? aislePositions 
      : (hasAisle ? this.getDefaultAislePositions(safeCols, tableMode) : []);

    if (preset === 'exam_mode' || tableMode === 'individual') {
      // EXAM MODE: Every seat separated with wide spacing
      for (let r = 0; r < safeRows; r++) {
        const rowChar = rowLabels[r] || `R${r + 1}`;
        for (let c = 0; c < safeCols; c++) {
          seats.push({
            id: `seat_${r}_${c}`,
            label: `${rowChar}${c + 1}`,
            x: c * 2, // 2× horizontal spacing
            y: r * 2, // 2× vertical spacing
            row: r,
            col: c,
            isFrontRow: r === 0,
          });
        }
      }
    } else if (preset === 'islands' || tableMode === 'islands') {
      // ISLANDS: 2×2 groups with spacing between groups
      let islandIndex = 1;
      for (let r = 0; r < Math.ceil(safeRows / 2); r++) {
        for (let c = 0; c < Math.ceil(safeCols / 2); c++) {
          const groupId = `group_${islandIndex}`;
          const groupName = `Group ${islandIndex}`;
          const baseX = c * 3;
          const baseY = r * 3;

          seats.push({ id: `seat_g${islandIndex}_1`, label: `G${islandIndex}-1`, x: baseX, y: baseY, groupId, groupName, isFrontRow: r === 0 });
          seats.push({ id: `seat_g${islandIndex}_2`, label: `G${islandIndex}-2`, x: baseX + 1, y: baseY, groupId, groupName, isFrontRow: r === 0 });
          seats.push({ id: `seat_g${islandIndex}_3`, label: `G${islandIndex}-3`, x: baseX, y: baseY + 1, groupId, groupName });
          seats.push({ id: `seat_g${islandIndex}_4`, label: `G${islandIndex}-4`, x: baseX + 1, y: baseY + 1, groupId, groupName });
          
          islandIndex++;
        }
      }
    } else if (tableMode === 'connected_rows') {
      // CONNECTED ROWS: All desks in a row are touching, gap between rows
      for (let r = 0; r < safeRows; r++) {
        const rowChar = rowLabels[r] || `R${r + 1}`;
        let xPos = 0;
        for (let c = 0; c < safeCols; c++) {
          seats.push({
            id: `seat_${r}_${c}`,
            label: `${rowChar}${c + 1}`,
            x: xPos,
            y: r * 2, // gap between rows
            row: r,
            col: c,
            isFrontRow: r === 0,
          });
          xPos++;
          // Add aisle gap after certain columns
          if (effectiveAislePositions.includes(c)) {
            xPos++; // skip one column for aisle
          }
        }
      }
    } else {
      // PAIRS / STANDARD GRID: Group desks in pairs with aisle gaps
      for (let r = 0; r < safeRows; r++) {
        const rowChar = rowLabels[r] || `R${r + 1}`;
        let xPos = 0;
        for (let c = 0; c < safeCols; c++) {
          seats.push({
            id: `seat_${r}_${c}`,
            label: `${rowChar}${c + 1}`,
            x: xPos,
            y: r,
            row: r,
            col: c,
            isFrontRow: r === 0,
          });
          xPos++;
          // Insert aisle gap after specified positions
          if (effectiveAislePositions.includes(c)) {
            xPos++; // skip one column for aisle
          }
        }
      }
    }

    // Generate default classroom objects if none provided
    const defaultObjects = classroomObjects.length > 0 
      ? classroomObjects 
      : this.getDefaultClassroomObjects(safeCols, safeRows, preset, tableMode);

    return {
      id: `layout_${Date.now()}`,
      name,
      className,
      preset,
      rows: safeRows,
      cols: safeCols,
      spacing: 1,
      hasAisle,
      aislePositions: effectiveAislePositions,
      tableMode,
      whiteboardPosition: 'top',
      seats,
      classroomObjects: defaultObjects,
    };
  }

  /**
   * Compute default aisle positions based on column count and table mode.
   */
  private getDefaultAislePositions(cols: number, tableMode: TableConnectionMode): number[] {
    if (tableMode === 'individual') return []; // exam mode: no aisles, just spacing
    if (tableMode === 'islands') return [];
    
    const positions: number[] = [];
    if (tableMode === 'pairs') {
      // Put aisle after every 2nd column: [1, 3, 5, ...]
      for (let c = 1; c < cols - 1; c += 2) {
        positions.push(c);
      }
    } else if (tableMode === 'connected_rows') {
      // Put a single center aisle
      const mid = Math.floor(cols / 2) - 1;
      if (mid >= 0 && mid < cols - 1) positions.push(mid);
    } else {
      // Default: aisle after every 2
      for (let c = 1; c < cols - 1; c += 2) {
        positions.push(c);
      }
    }
    return positions;
  }

  /**
   * Generate default classroom objects for a layout.
   */
  private getDefaultClassroomObjects(
    cols: number, 
    rows: number, 
    preset: LayoutPreset,
    tableMode: TableConnectionMode
  ): ClassroomObject[] {
    // Compute the actual grid width
    let gridWidth = cols;
    if (preset === 'exam_mode' || tableMode === 'individual') {
      gridWidth = (cols - 1) * 2 + 1;
    } else if (preset === 'islands' || tableMode === 'islands') {
      gridWidth = Math.ceil(cols / 2) * 3;
    } else {
      const aisles = this.getDefaultAislePositions(cols, tableMode);
      gridWidth = cols + aisles.length;
    }

    return [
      {
        id: 'obj_teacher_desk',
        type: 'teacher_desk',
        label: "Teacher's Desk",
        x: Math.floor(gridWidth / 2) - 1,
        y: -3, // Extra gap above student desks (y: 0 starts student rows)
        width: 3,
        height: 1,
        orientation: 'horizontal',
        position: 'top',
      },
      {
        id: 'obj_exit_door',
        type: 'exit_door',
        label: 'Exit',
        x: -2,
        y: 0,
        width: 1,
        height: 2, // Vertical layout (spans 2 rows)
        orientation: 'vertical',
        position: 'left',
      },
    ];
  }

  /**
   * Convert SeatingStudent[] from DB to StudentSeatingData[] for canvas rendering.
   */
  toStudentSeatingData(students: import('../types/seating').SeatingStudent[]): StudentSeatingData[] {
    return students.map(s => ({
      id: s.id,
      name: s.name,
      gender: s.gender,
      participationScore: s.participation,
      assignmentsCompleted: s.syncedGrades?.assignmentsCompleted ?? 0,
      totalAssignments: s.syncedGrades?.totalAssignments ?? 10,
      lastAssessmentScore: s.syncedGrades?.lastAssessmentScore ?? 0,
      linkedProfileId: s.linked_profile_id,
    }));
  }

  /**
   * Constrained Randomization Solver.
   */
  randomizeAssignments(
    seats: Seat[], 
    students: StudentSeatingData[], 
    constraints: SeatingConstraint[]
  ): Record<string, string> {
    const assignment: Record<string, string> = {};

    const shuffle = <T>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const shuffledStudents = shuffle([...students]);
    const shuffledSeats = shuffle([...seats]);

    // 1. Process Front-Row Priority constraints first
    const frontRowConstraints = constraints.filter(c => c.type === 'front_row_priority');
    const frontRowSeats = shuffledSeats.filter(s => s.isFrontRow || s.row === 0);

    for (const c of frontRowConstraints) {
      const studentIdx = shuffledStudents.findIndex(s => s.id === c.studentId1);
      if (studentIdx !== -1 && frontRowSeats.length > 0) {
        const student = shuffledStudents.splice(studentIdx, 1)[0];
        const seat = frontRowSeats.pop()!;
        const seatIdx = shuffledSeats.findIndex(s => s.id === seat.id);
        if (seatIdx !== -1) shuffledSeats.splice(seatIdx, 1);
        assignment[seat.id] = student.id;
      }
    }

    for (let i = 0; i < shuffledStudents.length && i < shuffledSeats.length; i++) {
      assignment[shuffledSeats[i].id] = shuffledStudents[i].id;
    }

    return assignment;
  }

  /**
   * Default sample students roster for empty classes.
   */
  getDefaultStudents(): StudentSeatingData[] {
    return [
      { id: 'st_1', name: 'Alex Johnson', gender: 'male', participationScore: 12, assignmentsCompleted: 9, totalAssignments: 10, lastAssessmentScore: 92 },
      { id: 'st_2', name: 'Beatrice Smith', gender: 'female', participationScore: 8, assignmentsCompleted: 10, totalAssignments: 10, lastAssessmentScore: 88 },
      { id: 'st_3', name: 'Charles Miller', gender: 'male', participationScore: 5, assignmentsCompleted: 7, totalAssignments: 10, lastAssessmentScore: 74 },
      { id: 'st_4', name: 'Diana Prince', gender: 'female', participationScore: 15, assignmentsCompleted: 10, totalAssignments: 10, lastAssessmentScore: 98 },
      { id: 'st_5', name: 'Ethan Hunt', gender: 'male', participationScore: 6, assignmentsCompleted: 8, totalAssignments: 10, lastAssessmentScore: 81 },
      { id: 'st_6', name: 'Fiona Gallagher', gender: 'female', participationScore: 11, assignmentsCompleted: 9, totalAssignments: 10, lastAssessmentScore: 89 },
      { id: 'st_7', name: 'George Clark', gender: 'male', participationScore: 4, assignmentsCompleted: 6, totalAssignments: 10, lastAssessmentScore: 70 },
      { id: 'st_8', name: 'Hannah Abbott', gender: 'female', participationScore: 9, assignmentsCompleted: 8, totalAssignments: 10, lastAssessmentScore: 85 },
    ];
  }
}

export const seatingService = new SeatingService();
