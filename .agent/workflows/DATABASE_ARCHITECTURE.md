# Classboards — Database Architecture & Frontend Mapping

> **Purpose:** This document captures the full database schema, RLS strategy, and how every table connects to the frontend code. Use this as the single source of truth before making any database or security changes.

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [Table-to-Frontend Mapping](#table-to-frontend-mapping)
3. [Key Data Flows](#key-data-flows)
4. [RLS Strategy](#rls-strategy)
5. [Critical Rules & Gotchas](#critical-rules--gotchas)

---

## Database Schema

### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | Matches `auth.uid()` from Supabase Auth |
| `email` | text | User's email address |
| `full_name` | text | Display name |
| `avatar_url` | text | Profile picture URL |
| `grade_level` | text | Student's grade level |
| `role` | text | `'student'`, `'teacher'`, or `'superadmin'` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `enrolled_classes` | _text (text[]) | **Array of CLASS NAMES** (not IDs). e.g. `{"10A", "11B"}` |
| `preferences` | jsonb | UI preferences |

### `boards`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `title` | text | Board title |
| `description` | text | |
| `topic` | text | |
| `format` | text | `'wall'`, `'grid'`, etc. |
| `created_at` | timestamptz | |
| `owner_id` | uuid (FK → profiles.id) | The teacher who created the board |
| `settings` | jsonb | Board-level settings (copy protection, etc.) |
| `wallpaper` | text | Background image/color |
| `class_code` | text | 6-char join code (e.g. `"A3F8K2"`) |
| `is_published` | bool | Whether students can see the board |
| `is_public` | bool | Whether the board is publicly accessible |
| `target_grade` | text | **A CLASS NAME** (e.g. `"10A"`, `"General"`). This links the board to a class. |
| `subject` | text | Subject name |
| `grading_type` | text | |
| `updated_at` | timestamptz | |
| `is_favorite` | bool | Teacher's personal favorite flag |
| `steps` | jsonb | Multi-step board configuration |
| `current_step_index` | int4 | |

### `notes`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `board_id` | uuid (FK → boards.id) | Which board this note belongs to |
| `content` | text | Note body content |
| `title` | text | Note title |
| `author` | text | Display name of author |
| `type` | text | `'sticky'`, `'assessment_submission'`, etc. |
| `color` | text | Note color |
| `x` | numeric | Canvas X position |
| `y` | numeric | Canvas Y position |
| `likes` | numeric | Like count |
| `created_at` | timestamptz | |
| `section_id` | text | Grid section assignment |
| `connections` | jsonb | Note-to-note connections |
| `author_id` | text | **Text, not UUID.** Stores `auth.uid()::text` |
| `attachment_url` | text | File attachment |
| `author_avatar` | text | |
| `is_placeholder` | bool | |
| `width` | float8 | |
| `height` | float8 | |
| `comments` | jsonb | |
| `liked_by` | _text (text[]) | Array of user IDs who liked |
| `author_role` | text | Role of the author at time of creation |
| `is_pinned` | bool | |
| `is_watermarked` | bool | |
| `updated_at` | timestamptz | |
| `violation_count` | int4 | |

### `classes`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `name` | text | Class name (e.g. `"10A"`). **This is what gets stored in `profiles.enrolled_classes` and `boards.target_grade`.** |
| `description` | text | |
| `created_at` | timestamptz | |
| `position` | int4 | Sort order in sidebar |
| `owner_id` | uuid (FK → profiles.id) | Teacher who created the class |
| `auto_enroll` | bool | |

### `grades`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `student_id` | uuid (FK → profiles.id) | |
| `board_id` | uuid (FK → boards.id) | |
| `score` | int4 | |
| `feedback` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `notifications`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `type` | text | |
| `content` | jsonb | |
| `is_read` | bool | |
| `created_at` | timestamptz | |

> **⚠️ WARNING:** `notifications` has **NO `user_id` column**. It is admin-only. Do not write RLS policies that reference `notifications.user_id` — it does not exist.

---

## Table-to-Frontend Mapping

### Board Fetching

| Who | Frontend Function | Query Filter | RLS Grants |
|---|---|---|---|
| **Teacher** | `boardService.getBoards('owned')` | `.eq('owner_id', user.id)` | Boards they own |
| **Student** | `boardService.getBoards()` | No `owner_id` filter (role check skips it) | Published boards for their enrolled classes |
| **Superadmin** | `boardService.getBoards('all')` | No filter | All boards |

- **File:** `services/boardService.ts`
- Students are identified by checking `profiles.role === 'student'`
- The `scope` parameter is `'owned'` (default) or `'all'` (for superadmin global views)

### Class Enrollment

- **Stored in:** `profiles.enrolled_classes` (text array of **class names**)
- **Enrollment UI:** `components/Admin/Students.tsx` — calls `handleAddClass(student, c.name)` which stores the class **name** (not ID)
- **Filtering:** `components/BoardView/AssignStudentsModal.tsx` line 38 — `s.enrolled_classes?.includes(targetGrade)` — directly compares class names

### Board-to-Class Link

```
boards.target_grade  ←→  profiles.enrolled_classes[]  ←→  classes.name
```

All three store/compare by **CLASS NAME** (e.g. `"10A"`), never by UUID.

### Student Board Visibility Flow

```
1. Student logs in
2. App.tsx calls fetchBoards() → boardService.getBoards()
3. boardService detects role='student', skips owner_id filter
4. Supabase RLS checks: boards.target_grade = ANY(profiles.enrolled_classes)
5. Only published boards for enrolled classes are returned
6. useBoardBrowser.ts line 100-106 further filters client-side:
   - Removes trashed boards
   - Requires isPublished = true
   - Requires targetGrade to be in studentClasses array
```

### Sidebar Class Display

- **File:** `components/Dashboard/Sidebar.tsx`
- Teachers see classes where `classes.owner_id = user.id` (or all for superadmin)
- Students see classes from their `profiles.enrolled_classes` array
- Class folders are shown by name, matching `boards.target_grade`

### Admin Dashboard

- **File:** `services/adminService.ts`, `components/AdminDashboard.tsx`
- Fetches all profiles, filters students by `enrolled_classes`
- Updates enrollment via `adminService.updateProfile(id, { enrolled_classes: newClasses })`

---

## Key Data Flows

### Creating a Board
```
Teacher UI → boardService.createBoard() → inserts into `boards` table
  - target_grade = selected class NAME (default: 'General')
  - owner_id = teacher's auth.uid()
  - class_code = random 6-char code
  - is_published defaults to false (board is draft)
```

### Publishing a Board
```
Teacher sets is_published = true → board becomes visible to students
  whose enrolled_classes array contains boards.target_grade
```

### Student Joining a Class (Admin Enrollment)
```
Admin UI → handleAddClass(student, className)
  → onUpdateClasses(student.id, [...current, className])
  → adminService.updateProfile(id, { enrolled_classes: newArray })
  → Supabase UPDATE profiles SET enrolled_classes = newArray
```

### Student Joining by Code
```
Student enters class_code → supabase.rpc('join_class', { p_class_code: code })
  → Server-side function adds class to enrolled_classes
  → fetchProfile() refreshes local state
  → getBoards() re-fetches with new enrollment
```

---

## RLS Strategy

### Super Admin Helper
```sql
is_super_admin() — checks profiles.role = 'superadmin' OR JWT email match
```

### Boards
- **Owner** sees their own boards (any state)
- **Superadmin** sees all boards
- **Students** see boards where:
  - `is_published = true` AND
  - (`is_public = true` OR `target_grade` is in their `enrolled_classes` OR `target_grade` is NULL/empty/'General')

### Notes
- Visible if the parent board is visible (public, owned, or published)
- Editable by: author (`author_id`), board owner, or superadmin

### Classes
- Visible to: owner, superadmin, or students enrolled in the class (by name match)
- Modifiable by: owner or superadmin

### Profiles
- All profiles readable by any authenticated user
- Only self or superadmin can update

### Grades
- Visible to: the student themselves, the board owner (teacher), or superadmin

### Notifications
- **Admin-only.** No user_id column exists. Only superadmin can read/write.

---

## Critical Rules & Gotchas

### ❌ Never Do
1. **Never reference `student_classes` table** — it does not exist
2. **Never reference `notifications.user_id`** — column does not exist
3. **Never use class UUIDs for enrollment comparisons** — enrollment stores class NAMES
4. **Never use `DROP FUNCTION ... CASCADE`** carelessly — it drops all dependent policies
5. **Never filter students by `owner_id` in board queries** — students don't own boards

### ✅ Always Do
1. **Fully qualify column names** in RLS policies (e.g. `boards.id`, not just `id`) to avoid ambiguity in subqueries
2. **Use `= ANY(array)` operator** for checking if a text value exists in a text array
3. **Handle NULL `enrolled_classes`** with `COALESCE(..., '{}'::text[])`
4. **Test RLS changes** with both teacher AND student accounts
5. **Check `is_published`** — students should never see draft boards

### Key Column Type Mismatches to Watch
| Column | Type | Common Mistake |
|---|---|---|
| `notes.author_id` | **text** | Comparing directly with `auth.uid()` (uuid) — must cast: `auth.uid()::text` |
| `profiles.enrolled_classes` | **_text** (text[]) | Treating as jsonb — use `= ANY()` not `?` or `@>` |
| `boards.target_grade` | **text** | Assuming it stores class UUID — it stores class NAME |
| `notes.liked_by` | **_text** (text[]) | Same as enrolled_classes — use array operators |

---

*Last updated: 2026-04-29*
