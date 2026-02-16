
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
          ownerId: string
          format: string
          classCode: string | null
          wallpaper: string | null
          settings: Json
          isPublished: boolean
          isPublic: boolean
          isFavorite: boolean
          targetGrade: string | null
          subject: string | null
          gradingType: string
          steps: Json
          currentStepIndex: number
          createdAt: string
          updatedAt: string
          deletedAt: string | null
          isTrashed: boolean
          collaborators: Json
        }
        Insert: {
          id?: string
          title?: string
          description?: string | null
          topic?: string | null
          ownerId?: string
          format?: string
          classCode?: string | null
          wallpaper?: string | null
          settings?: Json
          isPublished?: boolean
          isPublic?: boolean
          isFavorite?: boolean
          targetGrade?: string | null
          subject?: string | null
          gradingType?: string
          steps?: Json
          currentStepIndex?: number
          createdAt?: string
          updatedAt?: string
          deletedAt?: string | null
          isTrashed?: boolean
          collaborators?: Json
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          topic?: string | null
          ownerId?: string
          format?: string
          classCode?: string | null
          wallpaper?: string | null
          settings?: Json
          isPublished?: boolean
          isPublic?: boolean
          isFavorite?: boolean
          targetGrade?: string | null
          subject?: string | null
          gradingType?: string
          steps?: Json
          currentStepIndex?: number
          createdAt?: string
          updatedAt?: string
          deletedAt?: string | null
          isTrashed?: boolean
          collaborators?: Json
        }
      }
      notes: {
        Row: {
          id: string
          boardId: string
          title: string | null
          content: string | null
          author: string | null
          authorId: string | null
          authorRole: string
          authorAvatar: string | null
          type: string
          color: string
          x: number
          y: number
          width: number | null
          height: number | null
          sectionId: string | null
          attachment: string | null
          isPinned: boolean
          isPlaceholder: boolean
          isWatermarked: boolean
          isDeleted: boolean
          connections: Json
          likes: number
          comments: Json
          liked_by: string[]
          createdAt: string
          imageUrl: string | null
          videoUrl: string | null
        }
        Insert: {
          id?: string
          boardId: string
          title?: string | null
          content?: string | null
          author?: string | null
          authorId?: string | null
          authorRole?: string
          authorAvatar?: string | null
          type?: string
          color?: string
          x?: number
          y?: number
          width?: number | null
          height?: number | null
          sectionId?: string | null
          attachment?: string | null
          isPinned?: boolean
          isPlaceholder?: boolean
          isWatermarked?: boolean
          isDeleted?: boolean
          connections?: Json
          likes?: number
          comments?: Json
          liked_by?: string[]
          createdAt?: string
          imageUrl?: string | null
          videoUrl?: string | null
        }
        Update: {
          id?: string
          boardId?: string
          title?: string | null
          content?: string | null
          author?: string | null
          authorId?: string | null
          authorRole?: string
          authorAvatar?: string | null
          type?: string
          color?: string
          x?: number
          y?: number
          width?: number | null
          height?: number | null
          sectionId?: string | null
          attachment?: string | null
          isPinned?: boolean
          isPlaceholder?: boolean
          isWatermarked?: boolean
          isDeleted?: boolean
          connections?: Json
          likes?: number
          comments?: Json
          liked_by?: string[]
          createdAt?: string
          imageUrl?: string | null
          videoUrl?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          fullName: string | null
          avatarUrl: string | null
          gradeLevel: string | null
          enrolledClasses: string[]
          role: string
          preferences: Json
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id: string
          email?: string | null
          fullName?: string | null
          avatarUrl?: string | null
          gradeLevel?: string | null
          enrolledClasses?: string[]
          role?: string
          preferences?: Json
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          email?: string | null
          fullName?: string | null
          avatarUrl?: string | null
          gradeLevel?: string | null
          enrolledClasses?: string[]
          role?: string
          preferences?: Json
          createdAt?: string
          updatedAt?: string
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          description: string | null
          createdAt: string
          ownerId: string
          autoEnroll: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          createdAt?: string
          ownerId: string
          autoEnroll: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          createdAt?: string
          ownerId?: string
          autoEnroll?: boolean
        }
      }
      grades: {
        Row: {
          id: string
          studentId: string
          boardId: string
          score: number | null
          feedback: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          studentId: string
          boardId: string
          score?: number | null
          feedback?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          studentId?: string
          boardId?: string
          score?: number | null
          feedback?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
    }
  }
}
