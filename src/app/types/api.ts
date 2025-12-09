// Tipe Generic untuk Response Elysia
export interface ApiResponse<T> {
  status: 'success' | 'error'
  data?: T
  message?: string
}

// Tipe User/Member di Roster
export interface RosterMember {
  cid: string
  name: string
  ratingId: number
  ratingShort: string
  rosterStatus: string
  joinDate: string | Date
  division?: string | null
  subdivision?: string | null
  region?: string | null
  userCertificates: { certificate: { code: string } }[]
  trainingsAsStudent: { status: string; soloDetail?: { position: string; validUntil: Date } }[]
}

// Tipe Soal
export interface Question {
  id: string
  text: string
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY'
  points: number
  options?: Option[]
}

export interface Option {
  id: string
  text: string
  isCorrect?: boolean // Optional karena user biasa gak boleh lihat ini
}

// Tipe Exam
export interface ExamDetail {
  id: string
  title: string
  passingScore: number
  questionCount: number
  isSelection: boolean
  module?: {
    title: string
    content: string | null
    type: 'TEXT' | 'SLIDE' | 'EXAM'
  } | null
  questions: Question[]
}

export interface ExamSubmission {
  id: string
  score: number
  status: 'PASSED' | 'FAILED' | 'PENDING_REVIEW' | 'IN_PROGRESS'
  startedAt: Date
  completedAt?: Date | null
  generatedCode?: string | null
  exam: {
    title: string
  }
}