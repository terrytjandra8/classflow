
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      boards: {
        Row: {
          id: string
          title: string
          description: string | null
          topic: string | null
          owner_id: string
          format: string
          class_code: string | null
          wallpaper: string | null
          settings: Json & { editTimeLimit?: number }
          is_published: boolean
          is_public: boolean
          is_favorite: boolean
          target_grade: string | null
          subject: string | null
          grading_type: string
          steps: Json
          current_step_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title?: string
          description?: string | null
          topic?: string | null
          owner_id?: string
          format?: string
          class_code?: string | null
          wallpaper?: string | null
          settings?: Json & { editTimeLimit?: number }
          is_published?: boolean
          is_public?: boolean
          is_favorite?: boolean
          target_grade?: string | null
          subject?: string | null
          grading_type?: string
          steps?: Json
          current_step_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          topic?: string | null
          owner_id?: string
          format?: string
          class_code?: string | null
          wallpaper?: string | null
          settings?: Json & { editTimeLimit?: number }
          is_published?: boolean
          is_public?: boolean
          is_favorite?: boolean
          target_grade?: string | null
          subject?: string | null
          grading_type?: string
          steps?: Json
          current_step_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          board_id: string
          title: string | null
          content: string | null
          author: string | null
          author_id: string | null
          author_role: string
          author_avatar: string | null
          type: string
          color: string
          x: number
          y: number
          width: number | null
          height: number | null
          section_id: string | null
          attachment_url: string | null
          is_pinned: boolean
          is_placeholder: boolean
          is_watermarked: boolean // Added
          connections: Json
          likes: number
          comments: Json
          liked_by: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          board_id: string
          title?: string | null
          content?: string | null
          author?: string | null
          author_id?: string | null
          author_role?: string
          author_avatar?: string | null
          type?: string
          color?: string
          x?: number
          y?: number
          width?: number | null
          height?: number | null
          section_id?: string | null
          attachment_url?: string | null
          is_pinned?: boolean
          is_placeholder?: boolean
          is_watermarked?: boolean // Added
          connections?: Json
          likes?: number
          comments?: Json
          liked_by?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          title?: string | null
          content?: string | null
          author?: string | null
          author_id?: string | null
          author_role?: string
          author_avatar?: string | null
          type?: string
          color?: string
          x?: number
          y?: number
          width?: number | null
          height?: number | null
          section_id?: string | null
          attachment_url?: string | null
          is_pinned?: boolean
          is_placeholder?: boolean
          is_watermarked?: boolean // Added
          connections?: Json
          likes?: number
          comments?: Json
          liked_by?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          grade_level: string | null
          enrolled_classes: string[]
          role: string
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          grade_level?: string | null
          enrolled_classes?: string[]
          role?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          grade_level?: string | null
          enrolled_classes?: string[]
          role?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      grades: {
        Row: {
          id: string
          student_id: string
          board_id: string
          score: number | null
          feedback: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          board_id: string
          score?: number | null
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          board_id?: string
          score?: number | null
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
