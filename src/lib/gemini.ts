import { GoogleGenAI } from "@google/genai";

export const extractJSON = (text: string) => {
  try {
    const startBracket = text.indexOf('[');
    const startBrace = text.indexOf('{');
    
    let start = -1;
    let charOpen = '';
    let charClose = '';
    
    if (startBracket !== -1 && (startBrace === -1 || startBracket < startBrace)) {
      start = startBracket;
      charOpen = '[';
      charClose = ']';
    } else if (startBrace !== -1) {
      start = startBrace;
      charOpen = '{';
      charClose = '}';
    }
    
    if (start === -1) return text.replace(/```json\n?|```/g, '').trim();

    let count = 0;
    let inString = false;
    let escaped = false;
    
    for (let i = start; i < text.length; i++) {
      const char = text[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === charOpen) {
          count++;
        } else if (char === charClose) {
          count--;
          if (count === 0) {
            return text.substring(start, i + 1);
          }
        }
      }
    }
    
    return text.substring(start).trim();
  } catch (e) {
    return text.replace(/```json\n?|```/g, '').trim();
  }
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API Key Rotation Management
let apiKeys: string[] = [];
let uiKeys: string[] = [];
let currentKeyIndex = 0;

export const setUIKeys = (keys: string[]) => {
  uiKeys = keys;
  // Reset index when keys change to avoid out of bounds
  currentKeyIndex = 0;
};

const initKeys = () => {
  // Always refresh env keys but keep ui keys
  const envKeys = Object.keys(process.env)
    .filter(k => k.startsWith('GEMINI_API_KEY'))
    .sort((a, b) => {
      if (a === 'GEMINI_API_KEY') return -1;
      if (b === 'GEMINI_API_KEY') return 1;
      return a.localeCompare(b);
    })
    .map(k => process.env[k])
    .filter(Boolean) as string[];
    
  // Combine env keys and UI keys, removing duplicates
  apiKeys = Array.from(new Set([...envKeys, ...uiKeys]));
  
  if (apiKeys.length === 0) {
    console.error("CRITICAL: No GEMINI_API_KEY found.");
  }
};

const rotateKey = () => {
  if (apiKeys.length <= 1) return false;
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  console.warn(`[Quota Exceeded] Rotating to API Key #${currentKeyIndex + 1}`);
  return true;
};

const withRetry = async <T>(fn: (apiKey: string) => Promise<T>, retries = 5, delay = 2000): Promise<T> => {
  initKeys();
  
  try {
    if (apiKeys.length === 0) throw new Error("GEMINI_API_KEY is not configured.");
    return await fn(apiKeys[currentKeyIndex]);
  } catch (error: any) {
    const isRateLimit = 
      error?.status === 429 || 
      error?.code === 429 || 
      error?.message?.includes('429') || 
      error?.message?.includes('RESOURCE_EXHAUSTED') ||
      (error?.response?.status === 429);

    if (isRateLimit) {
      // Try rotating first
      if (rotateKey()) {
        console.log("Retrying immediately with new API key...");
        return withRetry(fn, retries, delay);
      }
      
      // If no more keys to rotate, do normal exponential backoff
      if (retries > 0) {
        const jitter = Math.random() * 1000;
        const nextDelay = delay + jitter;
        console.warn(`Rate limit hit (all keys exhausted). Retrying in ${Math.round(nextDelay)}ms... (${retries} retries left)`);
        await sleep(nextDelay);
        return withRetry(fn, retries - 1, delay * 2);
      }
    }
    throw error;
  }
};

export const getGeminiResponse = async (
  prompt: string,
  systemInstruction: string,
  modelName: string = "gemini-3-flash-preview",
  responseMimeType: string = "text/plain"
) => {
  return withRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType,
      },
    });
    return response.text;
  });
};

export const analyzeImage = async (
  base64Data: string,
  mimeType: string,
  prompt: string,
  modelName: string = "gemini-3-flash-preview"
) => {
  return withRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
    });
    return response.text;
  });
};

export const generateImage = async (
  prompt: string,
  modelName: string = "gemini-2.5-flash-image",
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "16:9"
) => {
  return withRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        imageConfig: {
          aspectRatio: aspectRatio
        }
      }
    });

    // Find the image part in candidates
    const candidates = response.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    // If no image in candidates, try directly in response (some SDK versions)
    if ((response as any).inlineData) {
      const data = (response as any).inlineData;
      return `data:${data.mimeType};base64,${data.data}`;
    }

    throw new Error("Dạ sếp ơi, AI không trả về ảnh (có thể do nội dung nhạy cảm hoặc lỗi model). Sếp thử đổi prompt hoặc thử lại giúp em nhé!");
  });
};

export const getGeminiImageOCR = async (
  base64Data: string,
  mimeType: string,
  modelName: string = "gemini-3-flash-preview"
) => {
  return withRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { text: "Extract all text from this image. Return only the extracted text, no explanations." },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
    });
    return response.text;
  });
};
