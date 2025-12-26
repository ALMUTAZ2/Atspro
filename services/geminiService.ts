
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, JobMatchResult, ResumeSection } from "../types";

export interface ImprovedContent {
  professional: string;
  atsOptimized: string;
}

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyzeResume(text: string): Promise<AnalysisResult> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are an elite ATS Strategy Expert. 
      
      CRITICAL INSTRUCTIONS:
      1. TITLE STANDARDIZATION: Convert all headers to standard ATS titles (e.g., "Experience", "Education", "Skills").
      2. DEFAULT OPTIMIZATION: The "content" field in structuredSections must be PROFESSIONALLY REWRITTEN for high impact and ATS compatibility immediately. Use action verbs.
      3. PRESERVE ORIGINAL: Return the exact original text from the resume in a new field if possible, but mainly focus on making the "content" field ready for the editor.
      4. PAGE BALANCE: Ensure descriptions are dense and concise to help fit content into 1 or 2 pages without large gaps.
      
      Resume Text:
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            sectionsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
            structuredSections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  content: { type: Type.STRING, description: "The AI-optimized version of this section" },
                  originalContent: { type: Type.STRING, description: "The verbatim original text" }
                },
                required: ["id", "title", "content", "originalContent"]
              }
            },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            formattingIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedImprovements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sectionId: { type: Type.STRING },
                  original: { type: Type.STRING },
                  professional: { type: Type.STRING },
                  atsOptimized: { type: Type.STRING }
                },
                required: ["sectionId", "original", "professional", "atsOptimized"]
              }
            }
          },
          required: ["overallScore", "sectionsFound", "structuredSections", "missingKeywords", "formattingIssues", "skills", "strengths", "weaknesses", "suggestedImprovements"]
        }
      }
    });

    return JSON.parse(response.text || "{}") as AnalysisResult;
  }

  async improveSection(title: string, content: string): Promise<ImprovedContent> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Fine-tune this "${title}" section for maximum impact.
      - Use strong verbs (Led, Developed, Optimized).
      - Ensure 100% ATS compliance.
      - Keep it extremely concise to help with page balancing.
      
      Original:
      ${content}`,
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
      contents: `Tailor these resume sections to this JD.
      
      STRATEGY:
      1. Keyword Injection: Naturally weave JD keywords into the experience descriptions.
      2. Page Optimization: If the tailored version is much longer, trim it to maintain the original page count.
      
      Job Description:
      ${jobDescription}

      Original Sections:
      ${JSON.stringify(sections)}`,
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
