import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateQuestionsFromText(text: string) {
  const prompt = `
    Analyze the following text extracted from an exam paper PDF. 
    Extract and generate a question bank in JSON format.
    Each question should have:
    - question: The question text
    - options: An array of 4 multiple-choice options
    - correctAnswer: The correct option
    - explanation: A brief explanation of why it's correct

    Text:
    ${text}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}
