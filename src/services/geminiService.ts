import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please set it in your Vercel project settings.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function transcribeAudio(base64Data: string, mimeType: string): Promise<{ text: string, language: string }> {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: "Transcribe the following audio accurately in its ORIGINAL language (e.g., if the audio is in Bengali, write the transcription in Bengali script). Do NOT translate it to English. Fix any grammatical errors, correct spelling mistakes, and ensure the text flows naturally. Add proper punctuation, and detect the language. Return the result as a JSON object with 'text' and 'language' fields.",
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "The transcribed text with punctuation." },
            language: { type: Type.STRING, description: "The detected language of the audio." },
          },
          required: ["text", "language"],
        },
      },
    });

    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to transcribe audio", e);
    throw new Error("Failed to transcribe audio. Please try again.");
  }
}

export async function transcribeUrl(url: string): Promise<{ text: string, language: string }> {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Transcribe or extract the main spoken/written content from this URL in its ORIGINAL language (e.g., if it is in Bengali, write in Bengali script). Do NOT translate it. Fix any grammatical errors, correct spelling mistakes, and ensure the text flows naturally. Add proper punctuation and detect the language. Return the result as a JSON object with 'text' and 'language' fields.\n\nURL: ${url}`,
      config: {
        tools: [{ urlContext: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "The transcribed or extracted text with punctuation." },
            language: { type: Type.STRING, description: "The detected language." },
          },
          required: ["text", "language"],
        },
      },
    });

    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to transcribe URL", e);
    throw new Error("Failed to transcribe URL. Make sure the link is accessible.");
  }
}

export async function translateToBengali(text: string): Promise<string> {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text into Bengali accurately. Only return the translated Bengali text, nothing else:\n\n${text}`,
    });
    return response.text?.trim() || "";
  } catch (e) {
    console.error("Failed to translate text", e);
    throw new Error("Failed to translate text to Bengali.");
  }
}

export async function getBengaliPronunciation(text: string): Promise<string> {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide the Bengali pronunciation (transliteration in Bengali script) for the following text. Do not translate the meaning, just write how it sounds using Bengali letters. Only return the Bengali pronunciation text, nothing else:\n\n${text}`,
    });
    return response.text?.trim() || "";
  } catch (e) {
    console.error("Failed to get Bengali pronunciation", e);
    throw new Error("Failed to get Bengali pronunciation.");
  }
}

export async function fixTextErrors(text: string): Promise<string> {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Review the following text and fix any spelling, grammar, or punctuation errors. Keep the original language and meaning intact. Only return the corrected text, nothing else:\n\n${text}`,
    });
    return response.text?.trim() || text;
  } catch (e) {
    console.error("Failed to fix text", e);
    throw new Error("Failed to correct text.");
  }
}

export async function extractKeywords(text: string): Promise<string[]> {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract the most important keywords from the following text. Return a JSON array of strings. Text:\n\n${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    const jsonStr = response.text?.trim() || "[]";
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to extract keywords", e);
    return [];
  }
}
