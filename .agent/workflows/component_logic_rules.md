# Component & Logic Rules

This document outlines the specific logic responsibilities and "rules of engagement" for the primary component folders in Classboards.

## 📁 `components/Dashboard/`
The central hub for teachers and administrators.

- **`index.tsx`**: 
  - **Rule**: Acts only as a layout wrapper and tab switcher. 
  - **Logic**: Receives `isSuperAdmin` and `isStudent` from `App.tsx` and passes them to `useDashboardLogic`.
- **`Home.tsx`**: 
  - **Rule**: Displays the board browser. 
  - **Logic**: Manages the interaction between the Sidebar and the Board Grid. Passes `onFetchGlobal` for lazy-loading.
- **`Sidebar.tsx`**:
  - **Rule**: Controls the `sidebarFilter` state.
  - **Logic**: Only renders "Global View" and "Global Trash" if `isSuperAdmin` is true.
- **`logic/useBoardBrowser.ts`**:
  - **Rule**: The "Brain" of the dashboard.
  - **Logic**: 
    - If `isStudent`: Strict filter (Published only + Enrolled classes only).
    - If `isSuperAdmin` + "Global View": Bypasses all ownership checks.
    - Otherwise: Filters by `owner_id` or `collaborators`.
- **`logic/useDashboardLogic.ts`**:
  - **Rule**: Handles environment sync.
  - **Logic**: Fetches classes, syncs hash-based routing (e.g., `#/home`), and manages localStorage for tab persistence.

## 📁 `components/BoardView/`
The interactive canvas for a single board.

- **`BoardView.tsx`**:
  - **Rule**: Must handle real-time Supabase subscriptions.
  - **Logic**: Syncs note positions, quiz states, and content updates across all connected clients.
- **`Layouts/`**:
  - **Rule**: Visual-only components (GridLayout, ListLayout).
  - **Logic**: Purely functional rendering of note arrays.
- **Security Rule**: Draft boards (`isPublished = false`) must trigger a "Waiting for Teacher" screen for students unless a Quiz or Assessment is active.

## 📁 `components/Activities/`
Interactive classroom tools.

- **`Quiz/`**:
  - **Rule**: Must remain synchronized.
  - **Logic**: Uses a single source of truth for `currentQuestionIndex`. The `StudentGame.tsx` component is reactive to state changes made in the teacher's view.
- **`Assessment/`**:
  - **Rule**: Two-phase execution (Reading vs. Active).
  - **Logic**: Controls student input permissions based on the `assessmentConfig.status`.

## 📁 `components/Admin/`
Global system controls.

- **`SystemDashboard.tsx`**:
  - **Rule**: Super Admin exclusive.
  - **Logic**: Manages global feature toggles (like "Maintenance Mode") and school-wide settings.

## 📁 `components/StudentDashboard.tsx`
Simplified board browser for students.

- **Rule**: Must be highly performant and restrictive.
- **Logic**: Only displays boards that are `isPublished` AND where the board's `targetGrade` exists in the student's `enrolled_classes` array.

## 📁 `ui/`
Atomic UI components.

- **Rule**: Must be stateless and theme-aware (Light/Dark mode).
- **Components**: `Avatar`, `Button`, `Input`, `Logo`, etc.

## ⚙️ Service Layer (`services/`)
- **`boardService.ts`**: Handles all Supabase queries. 
  - **Rule**: For superadmins, queries must bypass `owner_id` checks when `scope='all'` is requested.
- **`profileService.ts`**: Manages user profile data. 
  - **Rule**: Hardcoded Super Admin email check is the final source of truth for permissions.

---
*Last Updated: April 29, 2026*
