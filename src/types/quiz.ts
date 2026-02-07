export interface GeneratedQuestion {
  question_type: "mcq" | "vsa" | "lsa";
  question: string;
  options: string[] | null;
  correct_answer: string;
}

export interface QuizQuestion extends GeneratedQuestion {
  question_number: number;
  user_answer?: string;
  is_correct?: boolean;
}

export interface TestResult {
  id: string;
  topic: string;
  total_questions: number;
  correct_answers: number;
  score: number;
  question_types: string[];
  created_at: string;
}

export interface TestQuestionRecord {
  id: string;
  test_result_id: string;
  question_type: string;
  question: string;
  options: string[] | null;
  correct_answer: string;
  user_answer: string | null;
  is_correct: boolean;
  question_number: number;
}
