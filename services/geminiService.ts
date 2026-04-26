
import { GoogleGenAI } from "@google/genai";

export async function getERPInsights(data: any, query: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const systemInstruction = `
    You are ForgeERP AI, a professional ERP consultant. 
    You have access to the current state of the manufacturing company's ledgers, inventory, and BOMs.
    Answer user queries based ONLY on the provided JSON data. 
    If a query is about production feasibility, calculate it based on stock.
    Keep answers concise, professional, and actionable.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context: ${JSON.stringify(data)}\n\nUser Query: ${query}`,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I couldn't analyze the data at this moment.";
  }
}
