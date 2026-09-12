import { Seat, SeatingLayout, StudentSeatingData, SeatingConstraint, LayoutPreset } from '../types/seating';

export class SeatingService {
  private STORAGE_KEY_LAYOUTS = 'classflow_seating_layouts';
  private STORAGE_KEY_ASSIGNMENTS = 'classflow_seating_assignments';
  private STORAGE_KEY_CONSTRAINTS = 'classflow_seating_constraints';

  // Sample Mock Students for Demonstration
  getDefaultStudents(): StudentSeatingData[] {
    return [
      { id: 'st_1', name: 'Andi Pratama', gender: 'male', participationScore: 4, assignmentsCompleted: 8, totalAssignments: 10, lastAssessmentScore: 78 },
      { id: 'st_2', name: 'Budi Santoso', gender: 'male', participationScore: 7, assignmentsCompleted: 10, totalAssignments: 10, lastAssessmentScore: 92 },
      { id: 'st_3', name: 'Citra Dewi', gender: 'female', participationScore: 9, assignmentsCompleted: 9, totalAssignments: 10, lastAssessmentScore: 88 },
      { id: 'st_4', name: 'Doni Wijaya', gender: 'male', participationScore: 3, assignmentsCompleted: 6, totalAssignments: 10, lastAssessmentScore: 64 },
      { id: 'st_5', name: 'Eka Putri', gender: 'female', participationScore: 8, assignmentsCompleted: 9, totalAssignments: 10, lastAssessmentScore: 85 },
      { id: 'st_6', name: 'Fajar Nugroho', gender: 'male', participationScore: 5, assignmentsCompleted: 7, totalAssignments: 10, lastAssessmentScore: 73 },
      { id: 'st_7', name: 'Gita Lestari', gender: 'female', participationScore: 10, assignmentsCompleted: 10, totalAssignments: 10, lastAssessmentScore: 96 },
      { id: 'st_8', name: 'Hadi Kurniawan', gender: 'male', participationScore: 2, assignmentsCompleted: 5, totalAssignments: 10, lastAssessmentScore: 60 },
      { id: 'st_9', name: 'Indah Permata', gender: 'female', participationScore: 6, assignmentsCompleted: 8, totalAssignments: 10, lastAssessmentScore: 79 },
      { id: 'st_10', name: 'Joko Susilo', gender: 'male', participationScore: 8, assignmentsCompleted: 9, totalAssignments: 10, lastAssessmentScore: 84 },
      { id: 'st_11', name: 'Karin Maharani', gender: 'female', participationScore: 9, assignmentsCompleted: 10, totalAssignments: 10, lastAssessmentScore: 91 },
      { id: 'st_12', name: 'Leo Saputra', gender: 'male', participationScore: 4, assignmentsCompleted: 7, totalAssignments: 10, lastAssessmentScore: 70 },
      { id: 'st_13', name: 'Maya Sari', gender: 'female', participationScore: 7, assignmentsCompleted: 8, totalAssignments: 10, lastAssessmentScore: 82 },
      { id: 'st_14', name: 'Nico Rizky', gender: 'male', participationScore: 5, assignmentsCompleted: 8, totalAssignments: 10, lastAssessmentScore: 76 },
      { id: 'st_15', name: 'Olivia Tan', gender: 'female', participationScore: 9, assignmentsCompleted: 10, totalAssignments: 10, lastAssessmentScore: 94 },
      { id: 'st_16', name: 'Paul Hendra', gender: 'male', participationScore: 6, assignmentsCompleted: 7, totalAssignments: 10, lastAssessmentScore: 75 },
    ];
  }

  // Generate layout grid based on preset
  createLayout(name: string, className: string, preset: LayoutPreset, rows: number, cols: number, hasAisle: boolean = true): SeatingLayout {
    const seats: Seat[] = [];
    const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    if (preset === 'rows_cols') {
      let seatNum = 1;
      for (let r = 0; r < rows; r++) {
        const rowChar = rowLabels[r] || `R${r + 1}`;
        for (let c = 0; c < cols; c++) {
          // Add extra gap if aisle is enabled and in middle column
          const aisleOffset = (hasAisle && c >= Math.floor(cols / 2)) ? 1 : 0;
          seats.push({
            id: `seat_${r}_${c}`,
            label: `${rowChar}${c + 1}`,
            x: c + aisleOffset,
            y: r,
            row: r,
            col: c,
            isFrontRow: r === 0,
          });
          seatNum++;
        }
      }
    } else if (preset === 'islands') {
      // Create 2x2 groups/islands
      const islandsCount = Math.ceil((rows * cols) / 4);
      let islandIndex = 1;
      for (let r = 0; r < Math.ceil(rows / 2); r++) {
        for (let c = 0; c < Math.ceil(cols / 2); c++) {
          const groupId = `group_${islandIndex}`;
          const groupName = `Group ${islandIndex}`;
          
          // 4 seats per island
          const basePos = { x: c * 3, y: r * 3 };
          seats.push({ id: `seat_g${islandIndex}_1`, label: `G${islandIndex}-1`, x: basePos.x, y: basePos.y, groupId, groupName, isFrontRow: r === 0 });
          seats.push({ id: `seat_g${islandIndex}_2`, label: `G${islandIndex}-2`, x: basePos.x + 1, y: basePos.y, groupId, groupName, isFrontRow: r === 0 });
          seats.push({ id: `seat_g${islandIndex}_3`, label: `G${islandIndex}-3`, x: basePos.x, y: basePos.y + 1, groupId, groupName, isFrontRow: r === 0 });
          seats.push({ id: `seat_g${islandIndex}_4`, label: `G${islandIndex}-4`, x: basePos.x + 1, y: basePos.y + 1, groupId, groupName, isFrontRow: r === 0 });
          
          islandIndex++;
        }
      }
    }

    return {
      id: `layout_${Date.now()}`,
      name,
      className,
      preset,
      rows,
      cols,
      spacing: 1,
      hasAisle,
      whiteboardPosition: 'top',
      seats,
    };
  }

  // Constrained Randomization Solver
  randomizeAssignments(
    seats: Seat[], 
    students: StudentSeatingData[], 
    constraints: SeatingConstraint[]
  ): Record<string, string> {
    const assignment: Record<string, string> = {}; // seatId -> studentId
    const unassignedStudents = [...students];
    const availableSeats = [...seats];

    // Helper: Shuffle array randomly
    const shuffle = <T>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const shuffledStudents = shuffle(unassignedStudents);
    const shuffledSeats = shuffle(availableSeats);

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

    // 2. Assign remaining students to remaining seats
    for (let i = 0; i < shuffledStudents.length && i < shuffledSeats.length; i++) {
      assignment[shuffledSeats[i].id] = shuffledStudents[i].id;
    }

    return assignment;
  }
}

export const seatingService = new SeatingService();
