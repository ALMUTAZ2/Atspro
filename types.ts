
export interface ResumeSection {
  id: string;
  title: string;
  content: string;
  originalContent?: string; // لتمكين المستخدم من العودة للنص الأصلي
}

export interface Improvement {
  sectionId: string;
  original: string;
  professional: string;
  atsOptimized: string;
}

export interface AnalysisResult {
  overallScore: number;
  sectionsFound: string[];
  structuredSections: ResumeSection[];
  missingKeywords: string[];
  formattingIssues: string[];
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestedImprovements: Improvement[];
}

export interface JobMatchResult {
  matchPercentage: number;
  matchingKeywords: string[];
  missingKeywords: string[];
  matchFeedback: string;
  tailoredSections?: ResumeSection[]; 
}

export enum AppStep {
  UPLOAD = 'UPLOAD',
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR'
}
