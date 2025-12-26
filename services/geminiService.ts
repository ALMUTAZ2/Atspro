
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, JobMatchResult, ResumeSection, ImprovedContent } from "../types";

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private async callWithRetry(fn: () => Promise<any>, retries = 3, delay = 2000): Promise<any> {
    try {
      return await fn();
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      const errorMsg = error.message || "";
      const shouldRetry = errorMsg.includes("500") || errorMsg.includes("429") || errorMsg.includes("xhr") || errorMsg.includes("Proxy");
      
      if (retries > 0 && shouldRetry) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callWithRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  private calculateATSScore(data: any): number {
    let score = 30; // base for valid structure
    const sections = data.structuredSections || [];
    if (sections.length > 3) score += 20;
    if (data.hardSkillsFound?.length > 5) score += 20;
    if (data.metrics?.bulletsWithMetrics > 0) score += 20;
    score -= (data.criticalErrors?.length || 0) * 10;
    return Math.max(10, Math.min(98, score));
  }

  async analyzeResume(text: string): Promise<AnalysisResult> {
    const ai = this.getClient();
    const prompt = `
      You are an elite ATS forensic auditor. 
      CRITICAL: Extract EVERY detail. If a section has multiple bullet points, extract ALL of them exactly. 
      DO NOT summarize. DO NOT truncate. 
      Output as JSON. 
      Resume Text: ${text}
    `;

    return this.callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
                }
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
                  required: ["id", "title", "content"]
                }
              }
            },
            required: ["detectedRole", "hardSkillsFound", "structuredSections"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      return { ...data, overallScore: this.calculateATSScore(data) };
    });
  }

  async bulkImproveATS(sections: ResumeSection[]): Promise<Record<string, string>> {
    const ai = this.getClient();
    const prompt = `Optimize these resume sections for ATS. Return JSON mapping ID to improved HTML content. 
    Sections: ${JSON.stringify(sections.map(s => ({id: s.id, content: s.content})))}`;

    return this.callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        config: { temperature: 0.2, responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    });
  }

  async improveSection(title: string, content: string): Promise<ImprovedContent> {
    const ai = this.getClient();
    const prompt = `Rewrite "${title}" for ATS. Return JSON { "professional": "...", "atsOptimized": "..." }. Content: ${content}`;

    return this.callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        config: { temperature: 0.3, responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    });
  }

  async matchJobDescription(resumeText: string, sections: ResumeSection[], jobDescription: string): Promise<JobMatchResult> {
    const ai = this.getClient();
    const prompt = `Match this resume to the JD. Return JSON with matchPercentage, matchingKeywords, missingKeywords, matchFeedback, and tailoredSections.
    JD: ${jobDescription}
    Resume: ${resumeText}`;

    return this.callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        config: { temperature: 0.2, responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    });
  }
}
