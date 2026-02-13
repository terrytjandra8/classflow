
import { GoogleGenAI, Type } from "@google/genai";
import { Note, Board, GeneratedIdea, ColumnAnalyticsData } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instructions for educational context
const EDU_SYSTEM_INSTRUCTION = "You are an expert educational assistant designed to help teachers create engaging classroom activities. Your tone should be encouraging, professional, and age-appropriate for students.";

export const geminiService = {
  // Generate a list of ideas based on topic and grade
  async generateRecipeIdeas(recipeId: string, topic: string, grade: string): Promise<GeneratedIdea[]> {
      const prompt = `Generate 3 distinct activity ideas for a "${recipeId}" board about "${topic}" for grade level "${grade}". 
      Return JSON format.`;

      try {
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt,
              config: {
                  systemInstruction: EDU_SYSTEM_INSTRUCTION,
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              title: { type: Type.STRING },
                              description: { type: Type.STRING },
                              prompt: { type: Type.STRING },
                              type: { type: Type.STRING, enum: ['question', 'debate'] }
                          }
                      }
                  }
              }
          });
          return JSON.parse(response.text || '[]');
      } catch (e) {
          console.error("AI Error:", e);
          return [];
      }
  },

  // Generate a simulated student post based on the topic
  async generateStudentPost(topic: string): Promise<Partial<Note>> {
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `Write a short student response about "${topic}". Keep it under 20 words.`,
          });
          
          return {
            title: "Simulated Student",
            content: response.text || "Interesting topic!",
            author: "AI Student",
            color: "bg-white" as any,
            type: 'text',
            likes: 0,
            createdAt: Date.now()
          };
      } catch (e) {
          return { content: "AI Error", author: "System", type: 'text', color: "bg-white" as any, likes: 0, createdAt: Date.now() };
      }
  },

  // Generate a full board structure from a recipe
  async generateBoardFromRecipe(recipeId: string, topic: string): Promise<{ board: Partial<Board>, notes: Note[] }> {
      // Placeholder for complex generation if needed
      return { board: {}, notes: [] };
  },

  // Summarize the current board
  async summarizeBoard(notes: Note[], topic: string): Promise<string> {
      const content = notes.map(n => n.content).join("\n");
      const prompt = `Summarize the following student responses about "${topic}" into a concise paragraph highlighting key themes:\n\n${content}`;
      
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt,
          });
          return response.text || "Could not generate summary.";
      } catch (e) {
          console.error(e);
          return "Error generating summary.";
      }
  },

  // Core Analysis Logic
  async analyzeBoard(boardTitle: string, notes: Note[], gradeLevel?: string): Promise<ColumnAnalyticsData> {
      const content = notes.map(n => `- ${n.content}`).join("\n");
      const prompt = `Analyze these student responses for the activity "${boardTitle}".
      Provide a JSON analysis with:
      1. A brief summary (English and Indonesian).
      2. Sentiment counts (positive, neutral, negative).
      3. Key themes (English and Indonesian label, plus count).
      4. Potential misconceptions identified (English and Indonesian).
      5. One actionable insight for the teacher (English and Indonesian).
      
      Student Responses:
      ${content}`;

      try {
          const response = await ai.models.generateContent({
              model: 'gemini-3-pro-preview',
              contents: prompt,
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          summary: { 
                              type: Type.OBJECT, 
                              properties: { en: { type: Type.STRING }, id: { type: Type.STRING } } 
                          },
                          sentiment: {
                              type: Type.OBJECT,
                              properties: {
                                  positive: { type: Type.NUMBER },
                                  neutral: { type: Type.NUMBER },
                                  negative: { type: Type.NUMBER }
                              }
                          },
                          themes: {
                              type: Type.ARRAY,
                              items: {
                                  type: Type.OBJECT,
                                  properties: {
                                      label: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, id: { type: Type.STRING } } },
                                      count: { type: Type.NUMBER }
                                  }
                              }
                          },
                          misconceptions: {
                              type: Type.ARRAY,
                              items: {
                                  type: Type.OBJECT,
                                  properties: { en: { type: Type.STRING }, id: { type: Type.STRING } }
                              }
                          },
                          actionable_insight: {
                              type: Type.OBJECT,
                              properties: { en: { type: Type.STRING }, id: { type: Type.STRING } }
                          }
                      }
                  }
              }
          });
          
          const data = JSON.parse(response.text || '{}');
          return {
              ...data,
              last_analyzed: Date.now()
          };
      } catch (e) {
          console.error("Analysis Failed", e);
          throw e;
      }
  },

  // Specialized Column Analysis
  async analyzeColumn(columnTitle: string, notes: Note[], gradeLevel?: string): Promise<ColumnAnalyticsData> {
      return this.analyzeBoard(`Column: ${columnTitle}`, notes, gradeLevel);
  },

  // Generate an image using AI
  async generateImage(prompt: string): Promise<string | null> {
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: {
                  parts: [{ text: prompt }]
              },
              config: {
                  imageConfig: {
                      aspectRatio: "1:1" // Square images for notes
                  }
              }
          });

          // Check parts for inline data
          for (const part of response.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                  return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              }
          }
          return null;
      } catch (e) {
          console.error("Image Gen Failed", e);
          return null;
      }
  },

  // Search for GIFs (Stubbed as Gemini doesn't search Giphy directly)
  async searchGifs(query: string): Promise<{ url: string; title: string }[]> {
      return []; 
  }
};
