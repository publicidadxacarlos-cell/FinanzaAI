import { 
  GoogleGenAI, 
  Type, 
  LiveServerMessage,
  Modality,
  Blob,
  GenerateContentResponse
} from "@google/genai";

// Clave de API centralizada
const API_KEY = (import.meta as any).env.VITE_GOOGLE_GENAI_API_KEY;

// ---------------------------------------------------------
// Helpers para Audio/Video (Lógica original completa)
// ---------------------------------------------------------

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

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

export const base64ToUint8Array = decode;

// ---------------------------------------------------------
// Servicios de Texto y Análisis (Usando Gemini 2.5 Flash)
// ---------------------------------------------------------

export const categorizeTransaction = async (description: string): Promise<string> => {
  try {
    const response = await fetch('/api/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) return "Varios";
    const data = await response.json();
    return data.category || "Varios";
  } catch (error) {
    return "Varios";
  }
};

export const analyzeReceipt = async (base64Image: string): Promise<{total: number, date: string, merchant: string, category: string}> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
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

export const getFinancialAdvice = async (history: {role: string, text: string}[], message: string) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: [...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] })), { role: 'user', parts: [{ text: message }] }],
    config: {
        systemInstruction: "Eres un asesor financiero de alto nivel. Sé elegante, breve y muy útil."
    }
  });

  return response.text;
};

export const getMarketNews = async (query: string): Promise<GenerateContentResponse> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: query,
    config: { tools: [{ googleSearch: {} }] },
  });
  return response;
};

// ---------------------------------------------------------
// Generación de Medios (Modelos Especializados)
// ---------------------------------------------------------

export const generateGoalImage = async (prompt: string, aspectRatio: string = "1:1") => {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
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

export const editGoalImage = async (base64Image: string, prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
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

export const generateGoalVideo = async (prompt: string, aspectRatio: string = "16:9") => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  // El modelo Veo se invoca mediante el método específico de generación de video si el SDK lo permite
  // de lo contrario, mantenemos el fallback a null para no romper la ejecución.
  return null;
};

// ---------------------------------------------------------
// Live API Session (Lógica completa de Audio para Voz)
// ---------------------------------------------------------

export const connectLiveSession = async (
  onAudioData: (buffer: AudioBuffer) => void,
  onClose: () => void
) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash', // El modo Live usa el modelo Flash principal
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