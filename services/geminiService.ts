
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, JobMatchResult, ResumeSection, ImprovedContent } from "../types";

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Diagnostic Scoring Algorithm (Calculated client-side from raw AI data)
   * This adheres to Commandment 3: AI returns raw data, code calculates score.
   */
  private calculateScore(data: any): number {
    let score = 80; // Baseline

    // Protocol 1: Skill Gap Penalty
    const missingCount = data.missingHardSkills?.length || 0;
    score -= Math.min(missingCount * 4, 30);

    // Protocol 2: Impact Density
    if (data.metrics?.totalBulletPoints > 0) {
      const metricRatio = data.metrics.bulletsWithMetrics / data.metrics.totalBulletPoints;
      if (metricRatio >= 0.5) score += 10;
      else if (metricRatio < 0.2) score -= 20;
    } else {
      score -= 30; // Critical: No evidence of achievements
    }

    // Passive Language Penalty
    score -= Math.min((data.metrics?.weakVerbsCount || 0) * 2, 15);

    // Protocol 3: Compliance Failures
    score -= (data.criticalErrors?.length || 0) * 20;
    score -= (data.formattingIssues?.length || 0) * 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  async analyzeResume(text: string): Promise<AnalysisResult> {
    const ai = this.getClient();
    const systemInstruction = `You are "PROPHET V4.1," an Enterprise ATS Parser & Auditor. Your goal is to provide an OBJECTIVE, forensic analysis of resume data.

CORE DIRECTIVES:
1. SYNONYM RECOGNITION: Recognize "ReactJS" as "React", "PostgreSQL" as "SQL", etc. If the concept is present, count it as FOUND.
2. STRUCTURE RECOGNITION: Standardize section titles (e.g., "Career History" -> "EXPERIENCE").
3. RAW DATA FOCUS: Return counts and lists only. Do not calculate an overall score.
4. NO HALLUCINATIONS: Do not invent missing data.

ANALYSIS PROTOCOLS:
Protocol 1: Role & Skill Gap Analysis. Infer target role. Generate top 10 keywords for that role. Compare.
Protocol 2: Impact & Metrics Audit. Count total bullets, bullets with metrics (%, $, #, digits), and weak verbs (Assisted, Helped, Worked on).
Protocol 3: Critical Error Scan. Flag missing contact info, missing EXPERIENCE, missing EDUCATION, or low text density/unreadable content.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Perform a Forensic Audit on the following resume text:\n\n${text}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedRole: { type: Type.STRING },
            hardSkillsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingHardSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            softSkillsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
            metrics: {
              type: Type.OBJECT,
              properties: {
                totalBulletPoints: { type: Type.NUMBER },
                bulletsWithMetrics: { type: Type.NUMBER },
                weakVerbsCount: { type: Type.NUMBER },
                sectionCount: { type: Type.NUMBER }
              },
              required: ["totalBulletPoints", "bulletsWithMetrics", "weakVerbsCount", "sectionCount"]
            },
            formattingIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            criticalErrors: { type: Type.ARRAY, items: { type: Type.STRING } },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            summaryFeedback: { type: Type.STRING },
            structuredSections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  originalContent: { type: Type.STRING }
                },
                required: ["id", "title", "content", "originalContent"]
              }
            }
          },
          required: [
            "detectedRole", "hardSkillsFound", "missingHardSkills", "metrics", 
            "formattingIssues", "criticalErrors", "strengths", "weaknesses", 
            "summaryFeedback", "structuredSections"
          ]
        }
      }
    });

    const rawData = JSON.parse(response.text || "{}");
    const overallScore = this.calculateScore(rawData);

    return { ...rawData, overallScore } as AnalysisResult;
  }

  async improveSection(title: string, content: string): Promise<ImprovedContent> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `As PROPHET V4.1, optimize this section titled "${title}". 
      "Professional" version should be clean and impactful. 
      "ATS Optimized" should be aggressive in keyword and metric density.
      
      Original: ${content}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            professional: { type: Type.STRING },
            atsOptimized: { type: Type.STRING }
          },
          required: ["professional", "atsOptimized"]
        }
      }
    });
    return JSON.parse(response.text || "{}") as ImprovedContent;
  }

  async matchJobDescription(resumeText: string, sections: ResumeSection[], jobDescription: string): Promise<JobMatchResult> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Perform a Forensic Cross-Match (V4.1). Use synonym awareness.
      Resume: ${resumeText}
      Target JD: ${jobDescription}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchPercentage: { type: Type.NUMBER },
            matchingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            matchFeedback: { type: Type.STRING },
            tailoredSections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  originalContent: { type: Type.STRING }
                },
                required: ["id", "title", "content", "originalContent"]
              }
            }
          },
          required: ["matchPercentage", "matchingKeywords", "missingKeywords", "matchFeedback", "tailoredSections"]
        }
      }
    });

    return JSON.parse(response.text || "{}") as JobMatchResult;
  }
}
