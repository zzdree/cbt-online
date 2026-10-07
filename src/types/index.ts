export interface User {
  id: string;
  username: string;
  name: string;
  role: 'teacher' | 'admin';
  created_at: string;
}

export interface Exam {
  id: string;
  teacher_id: string;
  title: string;
  subject: string;
  token: string;
  duration_minutes: number;
  passing_grade: number;
  show_score_immediately: number; // 1 or 0
  show_review_immediately: number; // 1 or 0
  randomize_questions: number; // 1 or 0
  randomize_options: number; // 1 or 0
  is_active: number; // 1 or 0
  created_at: string;
  question_count?: number;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_key: 'A' | 'B' | 'C' | 'D' | 'E';
  option_text: string;
  image_url?: string | null;
  is_correct: number; // 1 or 0
}

export interface Question {
  id: string;
  exam_id: string;
  order_index: number;
  question_text: string;
  image_url?: string | null;
  points: number;
  explanation?: string | null;
  created_at: string;
  options?: QuestionOption[];
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_number: string;
  student_name: string;
  start_time: string;
  submit_time?: string | null;
  duration_seconds_left?: number | null;
  status: 'in_progress' | 'locked' | 'submitted';
  lockout_until?: string | null;
  violation_count: number;
  score?: number | null;
  is_passed?: number | null;
  created_at: string;
}

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
  is_hesitant: number; // 1 or 0 (Ragu-ragu)
  updated_at: string;
}

export interface ViolationLog {
  id: string;
  attempt_id: string;
  violation_type: 'tab_switch' | 'window_blur' | 'fullscreen_exit';
  occurred_at: string;
  duration_seconds: number;
}

export interface AIQuestionRequest {
  subject: string;
  topic: string;
  difficulty: 'Mudah' | 'Sedang' | 'Sulit' | 'HOTS';
  gradeLevel: 'SD' | 'SMP' | 'SMA/SMK' | 'Perguruan Tinggi';
  count: number;
  stimulusText?: string;
  includeMath?: boolean;
  includeTable?: boolean;
  model?: string;
}

export interface DraftQuestion {
  tempId: string;
  question_text: string;
  points: number;
  explanation: string;
  options: {
    key: 'A' | 'B' | 'C' | 'D' | 'E';
    text: string;
    is_correct: boolean;
  }[];
  selected: boolean;
}
