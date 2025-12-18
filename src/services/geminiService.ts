
import { 
  GoogleGenAI, 
  Type, 
  LiveServerMessage,
  Modality,
  Blob,
  GenerateContentResponse
} from "@google/genai";

// ---------------------------------------------------------
// Helpers para Audio/Video
// ---------------------------------------------------------

// Guideline: Manual implementation of base64 encoding
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Guideline: Manual implementation of base64 decoding
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Creates a PCM Blob from Float32Array for Live API input.
 */
export function createPcmBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

/**
 * Alias for supporting existing code in Assistant.tsx
 */
export const base64ToUint8Array = decode;

// ---------------------------------------------------------
// Servicios de Texto y Análisis
// ---------------------------------------------------------

/**
 * Categorizes a transaction description using Gemini 3 Flash.
 */
export const categorizeTransaction = async (description: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Categoriza en una palabra: "${description}". Ej: Comida, Ocio, Salud.`,
  });
  return response.text?.trim() || "Varios";
};

/**
 * Analyzes a receipt image using Gemini 3 Flash and returns structured data.
 */
export const analyzeReceipt = async (base64Image: string): Promise<{total: number, date: string, merchant: string, category: string}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: "Analiza el recibo. Extrae: total (número), date (YYYY-MM-DD), merchant (nombre), category (una palabra)." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          total: { type: Type.NUMBER },
          date: { type: Type.STRING },
          merchant: { type: Type.STRING },
          category: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

/**
 * Provides financial advice based on chat history using Gemini 3 Pro.
 */
export const getFinancialAdvice = async (history: {role: string, text: string}[], message: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] })), { role: 'user', parts: [{ text: message }] }],
    config: {
        systemInstruction: "Eres un asesor financiero de alto nivel. Sé elegante, breve y muy útil."
    }
  });

  return response.text;
};

/**
 * Fetches market news using Gemini 3 Pro with Google Search grounding.
 */
export const getMarketNews = async (query: string): Promise<GenerateContentResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return response;
};

// ---------------------------------------------------------
// Generación de Medios
// ---------------------------------------------------------

/**
 * Generates a goal image using Gemini 2.5 Flash Image.
 */
export const generateGoalImage = async (prompt: string, aspectRatio: string = "1:1") => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: (aspectRatio === "1:1" || aspectRatio === "3:4" || aspectRatio === "4:3" || aspectRatio === "9:16" || aspectRatio === "16:9") ? aspectRatio : "1:1" as any
          }
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
};

/**
 * Edits an existing goal image using Gemini 2.5 Flash Image.
 */
export const editGoalImage = async (base64Image: string, prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: prompt }
      ]
    }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return null;
};

/**
 * Generates a video for a goal using Veo 3.1 Fast.
 */
export const generateGoalVideo = async (prompt: string, aspectRatio: string = "16:9") => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: (aspectRatio === '16:9' || aspectRatio === '9:16') ? aspectRatio : '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  // Return URL with API key appended for direct playback
  return `${downloadLink}&key=${process.env.API_KEY}`;
};

// ---------------------------------------------------------
// Live API Session
// ---------------------------------------------------------

/**
 * Establishes a Gemini Live session for voice interaction.
 */
export const connectLiveSession = async (
  onAudioData: (buffer: AudioBuffer) => void,
  onClose: () => void
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: () => console.log("Live connection opened"),
      onmessage: async (message: LiveServerMessage) => {
        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64EncodedAudioString) {
          const audioBuffer = await decodeAudioData(
            decode(base64EncodedAudioString),
            outputAudioContext,
            24000,
            1
          );
          onAudioData(audioBuffer);
        }
      },
      onerror: (e) => console.error("Live session error", e),
      onclose: () => {
        console.log("Live session closed");
        onClose();
      }
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      }
    }
  });

  return { sessionPromise, outputAudioContext };
};
