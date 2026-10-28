export type StrictnessLevel = 'lenient' | 'standard' | 'strict';

export interface EvaluationParameter {
  id: string;
  name: string;
  weight: number; // Maximum marks allocated to this parameter
  description: string;
}

export interface EvaluationPreset {
  id: string;
  name: string;
  description: string;
  defaultTotalMarks: number;
  parameters: EvaluationParameter[];
  isCustom?: boolean;
}

export interface SampleQA {
  id: string;
  title: string;
  category: string;
  question: string;
  modelAnswer?: string;
  studentAnswer: string;
  totalMarks: number;
  presetId: string;
}

export interface ParameterVerdict {
  parameterId: string;
  parameterName: string;
  marksAwarded: number;
  maxMarks: number;
  percentage: number;
  tier: 'Superior' | 'Proficient' | 'Competent' | 'Developing' | 'Deficient';
  strengths: string[];
  flaws: string[];
  recommendation: string;
}

export interface EvaluationResult {
  id: string;
  timestamp: number;
  question: string;
  studentAnswer: string;
  modelAnswer?: string;
  totalMarks: number;
  totalAwarded: number;
  percentage: number;
  letterGrade: string; // e.g., 'A+', 'A', 'B+', 'B', 'C', 'F'
  gradeBand?: 'Excellent' | 'Good' | 'Needs work';
  verdictSummary: string;
  executiveCritique: string;
  parameters: ParameterVerdict[];
  keyStrengths: string[];
  criticalDeficits: string[];
  improvedAnswerSnippet: string;
  fullMarkAnswer?: string;
  tips?: string[];
  modelUsed: string;
  strictness: StrictnessLevel;
  starred?: boolean;
  notes?: string;
}

export interface AnswerImage {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  base64: string;
  sizeKb: number;
}

export interface EvaluationRequest {
  question: string;
  modelAnswer?: string;
  studentAnswer: string;
  totalMarks: number;
  parameters: EvaluationParameter[];
  strictness: StrictnessLevel;
  additionalInstructions?: string;
  model: string;
  apiKey: string;
  images?: AnswerImage[];
}
