# Classboards Project Overview

This document serves as a comprehensive reference for the Classboards platform architecture, features, and security model to optimize AI context usage and maintain consistency across development sessions.

## 🚀 Core Features

### 1. Board Management
- **Dynamic Board Views**: Supports multiple layouts (Grid, List, etc.).
- **Board Formats**: 
  - `standard`: General purpose interactive boards.
  - `quiz`: Synchronized classroom quizzes with real-time student participation.
  - `assessment`: Formal student evaluations with reading and active phases.
- **Global View**: Super Admin access to every board in the database, bypassing ownership filters.
- **Trash System**: Soft-delete functionality with a "Global Trash" for superadmins to restore or hard-delete content school-wide.

### 2. Activities & Interaction
- **Real-time Notes**: Collaborative note-taking with support for text, images, and attachments.
- **Interactive Quizzes**: Teachers control question flow; students participate via the `StudentGame` interface.
- **Polls & Assessments**: Tools for gathering feedback and conducting formal testing.

### 3. User & Class Management
- **Role-Based Access Control (RBAC)**: Distinct flows for `Super Admin`, `Teacher`, and `Student`.
- **Class Folders**: Automatic organization of boards based on `targetGrade`.
- **Student Enrollment**: Students see boards matching their `enrolled_classes` (stored as an array of strings in their profile).
- **Join Codes**: Simple alphanumeric codes for students to join specific classes/boards.

## 🛠️ Technical Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS.
- **Icons**: Lucide React.
- **Backend/Database**: Supabase (PostgreSQL + Auth + Realtime).
- **State Management**: React Hooks (useState, useEffect, useMemo, useRef) with localized logic in custom hooks (e.g., `useBoardBrowser`, `useDashboardLogic`).

## 🔐 Security & RLS (Row Level Security)

### The "Nuclear" RLS Policy (V13)
All database security is consolidated into a single SQL file (`RLS Policy/consolidated_rls_final.sql`).
- **Super Admin Bypass**: Universal access granted based on a hardcoded email (`terry.tjandra@integrated.ipeka.sch.id`) and `profiles.role = 'superadmin'`.
- **Student Visibility**: Enforced via `profiles.enrolled_classes` array comparison against `boards.target_grade`.
- **Note Protection**: Standardized ownership checks and collaborator access lists.

## 📂 Key File Map

| Path | Purpose |
| :--- | :--- |
| `/App.tsx` | Root component, auth state, and high-level board fetching logic. |
| `/services/boardService.ts` | Centralized data fetching for boards with Super Admin bypass logic. |
| `/services/classService.ts` | Handles class group retrieval and enrollment. |
| `/components/Dashboard/` | Main teacher/admin interface. |
| `/components/StudentDashboard/` | Simplified board browser for students. |
| `/components/BoardView/` | The core interactive canvas where boards are rendered. |
| `/utils/mappers.ts` | Transforms raw database rows into frontend types. |

## 💡 Critical Implementation Details

- **Super Admin Definition**: Always check both the hardcoded email in `constants.ts` and the `profiles.role` column.
- **Data Flow**: `App.tsx` fetches `boards` -> passed to `Dashboard` -> passed to `Home` -> managed by `useBoardBrowser`.
- **Lazy Loading**: "Global View" uses a lazy-loading pattern via `onFetchGlobal` to avoid massive initial payloads while ensuring admins can see all data on demand.
- **Draft Protection**: Students are blocked from seeing boards where `isPublished` is false, unless an active Quiz or Assessment session is in progress.

---
*Last Updated: April 29, 2026*
