
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, JobMatchResult, ResumeSection, ImprovedContent } from "../types";

export class GeminiService {
  private async callWithRetry(fn: () => Promise<any>, retries = 3, delay = 1500): Promise<any> {
    try {
      return await fn();
    } catch (error: any) {
      const isQuotaError = error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED") || error.message?.includes("Quota");
      if (retries > 0 && isQuotaError) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callWithRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  private calculateATSScore(data: any): number {
    let earnedPoints = 25; 
    const sectionsFound = data.structuredSections?.map((s: any) => s.title.toLowerCase()) || [];
    
    if (sectionsFound.some((s: string) => s.includes('experience') || s.includes('work'))) earnedPoints += 20;
    if (sectionsFound.some((s: string) => s.includes('education'))) earnedPoints += 10;
    if (sectionsFound.some((s: string) => s.includes('skills'))) earnedPoints += 15;
    
    const skillsCount = data.hardSkillsFound?.length || 0;
    earnedPoints += Math.min(skillsCount * 1.5, 20);

    const totalBullets = data.metrics?.totalBulletPoints || 0;
    const bulletsWithMetrics = data.metrics?.bulletsWithMetrics || 0;
    if (totalBullets > 0) {
      earnedPoints += Math.min((bulletsWithMetrics / totalBullets) * 20, 20);
    }

    const penaltyPoints = (data.criticalErrors?.length || 0) * 5;
    return Math.max(10, Math.min(100, Math.round(earnedPoints - penaltyPoints)));
  }

  async analyzeResume(text: string): Promise<AnalysisResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `ROLE: Professional ATS Forensic Auditor. Use gemini-3-flash-preview.
    TASK: Break down the resume into discrete sections. Extract Header, Summary, Experience, Education, Skills, etc.
    OUTPUT: Strict JSON format.`;

    return this.callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: [{ role: 'user', parts: [{ text: systemInstruction + `\n\nINPUT RESUME:\n${text}` }] }],
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedRole: { type: Type.STRING },
              hardSkillsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingHardSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
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
                    content: { type: Type.STRING },
                    originalContent: { type: Type.STRING }
                  },
                  required: ["id", "title", "content", "originalContent"]
                }
              }
            },
            required: ["detectedRole", "hardSkillsFound", "missingHardSkills", "metrics", "formattingIssues", "structuredSections"]
          }
        }
      });

      const rawData = JSON.parse(response.text || "{}");
      return { ...rawData, overallScore: this.calculateATSScore(rawData) };
    });
  }

  async bulkImproveATS(sections: ResumeSection[]): Promise<Record<string, string>> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Improve ALL resume sections for ATS compliance. Use high-impact keywords and metrics.
    Sections to improve: ${JSON.stringify(sections.map(s => ({ id: s.id, title: s.title, content: s.content })))}
    Return a JSON object where keys are section IDs and values are the new HTML content with <ul><li> tags.`;

    return this.callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        config: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    });
  }

  async improveSection(title: string, content: string): Promise<ImprovedContent> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Rewrite "${title}" for a resume. Professional version should be elegant. ATS version should use keywords and metrics. Format with <ul><li>. Content: ${content}`;

    return this.callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        config: {
          temperature: 0.7,
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
    });
  }

  async matchJobDescription(resumeText: string, sections: ResumeSection[], jobDescription: string): Promise<JobMatchResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Tailor these resume sections to this Job Description. JD: ${jobDescription}. Sections: ${JSON.stringify(sections)}`;

    return this.callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
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
            required: ["matchingKeywords", "missingKeywords", "matchFeedback", "tailoredSections"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      const tailoredMap = new Map();
      if (data.tailoredSections) {
        data.tailoredSections.forEach((s: any) => tailoredMap.set(s.id, s));
      }

      const finalTailoredSections = sections.map(original => {
        const tailored = tailoredMap.get(original.id);
        return {
          id: original.id,
          title: tailored?.title || original.title,
          content: tailored?.content || original.content,
          originalContent: original.originalContent || original.content
        };
      });

      const totalK = (data.matchingKeywords?.length || 0) + (data.missingKeywords?.length || 0);
      const matchP = totalK > 0 ? Math.round((data.matchingKeywords.length / totalK) * 100) : 0;

      return { 
        ...data, 
        tailoredSections: finalTailoredSections, 
        matchPercentage: matchP 
      };
    });
  }
}
