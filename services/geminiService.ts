
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AnalysisResult, JobMatchResult, ResumeSection, ImprovedContent } from "../types";

export class GeminiService {
  private getApiKey(): string {
    // محاولة جلب المفتاح من عدة مصادر محتملة في Vercel
    const key = process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!key) {
      console.error("API Key is missing in environment variables.");
      throw new Error("API Key is missing. Please check your configuration.");
    }
    return key;
  }

  private getClient() {
    const apiKey = this.getApiKey();
    return new GoogleGenAI({ apiKey });
  }

  private calculateATSScore(data: any): number {
    let score = 20; 
    const sections = data?.structuredSections?.length || 0;
    if (sections >= 4) score += 15;
    
    const hardSkills = data?.hardSkillsFound?.length || 0;
    score += Math.min(hardSkills * 2, 25);

    const metrics = data?.metrics || { totalBulletPoints: 0, bulletsWithMetrics: 0 };
    const total = metrics.totalBulletPoints || 0;
    const impact = metrics.bulletsWithMetrics || 0;
    
    if (total > 0) {
      const ratio = impact / total;
      score += Math.min(ratio * 30, 30);
    }

    const errors = (data?.criticalErrors?.length || 0) * 10;
    const formatting = (data?.formattingIssues?.length || 0) * 5;
    
    return Math.max(5, Math.min(100, Math.round(score - errors - formatting)));
  }

  async analyzeResume(text: string): Promise<AnalysisResult> {
    const ai = this.getClient();
    const systemInstruction = `
      ROLE: High-Fidelity Professional Resume Parser.
      STRICT MANDATE: 
      1. YOU MUST EXTRACT 100% OF THE INPUT TEXT. DO NOT SUMMARIZE OR OMIT ANYTHING.
      2. If text doesn't fit a standard section, put it in a section called "Additional Data".
      3. Use <ul><li> HTML tags for all list items.
      4. Ensure names, dates, and numbers are preserved with absolute accuracy.
    `;

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\nRESUME CONTENT TO PARSE:\n${text}` }] }],
        config: {
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
              summaryFeedback: { type: Type.STRING },
              structuredSections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING }
                  },
                  required: ["id", "title", "content"]
                }
              }
            },
            required: ["detectedRole", "metrics", "structuredSections", "summaryFeedback"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      
      const sanitized: AnalysisResult = {
        detectedRole: data.detectedRole || "Unknown Professional",
        hardSkillsFound: data.hardSkillsFound || [],
        missingHardSkills: data.missingHardSkills || [],
        softSkillsFound: data.softSkillsFound || [],
        metrics: {
          totalBulletPoints: data.metrics?.totalBulletPoints ?? 0,
          bulletsWithMetrics: data.metrics?.bulletsWithMetrics ?? 0,
          weakVerbsCount: data.metrics?.weakVerbsCount ?? 0,
          sectionCount: data.metrics?.sectionCount ?? 0
        },
        formattingIssues: data.formattingIssues || [],
        criticalErrors: data.criticalErrors || [],
        strengths: [],
        weaknesses: [],
        summaryFeedback: data.summaryFeedback || "Analysis complete.",
        structuredSections: data.structuredSections || [],
      };

      sanitized.overallScore = this.calculateATSScore(sanitized);
      return sanitized;
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      throw new Error("حدث خطأ في قراءة الملف. تأكد من أن النص واضح.");
    }
  }

  async bulkImproveATS(sections: ResumeSection[]): Promise<Record<string, string>> {
    const ai = this.getClient();
    const prompt = `
      TASK: REWRITE EVERY SECTION FOR ATS SUCCESS.
      RULES:
      1. Keep all facts, names, and dates.
      2. Use strong action verbs (Led, Developed, Optimized).
      3. Use clean HTML <ul><li> formatting.
      4. DO NOT DELETE ANY INFORMATION.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: [{ role: 'user', parts: [{ text: `${prompt}\n\nSections JSON: ${JSON.stringify(sections.map(s => ({ id: s.id, content: s.content })))}` }] }],
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                improvedContent: { type: Type.STRING }
              },
              required: ["id", "improvedContent"]
            }
          }
        }
      });

      const data = JSON.parse(response.text || "[]");
      const mapping: Record<string, string> = {};
      data.forEach((item: any) => {
        mapping[item.id] = item.improvedContent;
      });
      return mapping;
    } catch (error) {
      console.error("Bulk Improvement Error:", error);
      throw new Error("فشل التحسين التلقائي. يرجى المحاولة لاحقاً.");
    }
  }

  async improveSection(title: string, content: string): Promise<ImprovedContent> {
    const ai = this.getClient();
    const prompt = `Improve "${title}" for ATS. Return JSON with 'professional' and 'atsOptimized'. Content: ${content}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Section Improvement Error:", error);
      throw error;
    }
  }

  async matchJobDescription(resumeText: string, sections: ResumeSection[], jobDescription: string): Promise<JobMatchResult> {
    const ai = this.getClient();
    const prompt = `Tailor resume to JD. Resume: ${resumeText}\n\nJD: ${jobDescription}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
                    content: { type: Type.STRING }
                  },
                  required: ["id", "title", "content"]
                }
              }
            },
            required: ["matchPercentage", "matchFeedback", "tailoredSections"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("JD Match Error:", error);
      throw error;
    }
  }
}
