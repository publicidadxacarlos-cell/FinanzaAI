import { GoogleGenAI } from "@google/genai";

// 1. CONFIGURACIÓN DE CLAVES
const API_KEY = "AIzaSyCiS0s-KIsDOe1tJ8wWATSoRbOojFJ800I";
// Asegúrate de tener tu clave de OpenAI en el archivo .env o pegarla aquí si prefieres probar
const OPENAI_API_KEY = (import.meta as any).env?.VITE_OPENAI_API_KEY || "TU_CLAVE_OPENAI_AQUI";

// --- HELPERS DE AUDIO Y CONVERSIÓN (Completos) ---
export function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) { bytes[i] = binaryString.charCodeAt(i); }
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(numChannels, dataInt16.length / numChannels, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) { channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; }
  }
  return buffer;
}

export function createPcmBlob(data: Float32Array): any {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) { int16[i] = data[i] * 32768; }
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}

export const base64ToUint8Array = decode;

// --- CATEGORIZACIÓN CON OPENAI (Solución al problema de Google) ---
export const categorizeTransaction = async (description: string): Promise<string> => {
  if (!description) return "Varios";
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: `Clasifica este gasto: "${description}". Responde solo una palabra de estas: Comida, Ocio, Transporte, Ingresos, Vivienda, Salud o Varios.`
        }],
        temperature: 0
      })
    });

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    
    console.log("OpenAI clasificó:", text);
    const categorias = ['Comida', 'Ocio', 'Transporte', 'Ingresos', 'Vivienda', 'Salud'];
    const encontrada = categorias.find(cat => text.toLowerCase().includes(cat.toLowerCase()));
    return encontrada || "Varios";
  } catch (error) {
    console.error("Error en OpenAI:", error);
    return "Varios";
  }
};

// --- ASESOR FINANCIERO CON OPENAI ---
export const getFinancialAdvice = async (history: {role: string, text: string}[], message: string, context?: string) => {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Eres un asesor financiero experto. Contexto actual: " + (context || "Sin contexto adicional") },
          ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text })),
          { role: "user", content: message }
        ]
      })
    });
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    return "Error de conexión con el asesor de OpenAI.";
  }
};

// --- GENERACIÓN DE IMÁGENES (VisionBoard) ---
export const generateGoalImage = async (prompt: string, aspectRatio: string = "1:1") => {
  if (!OPENAI_API_KEY) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({ model: "dall-e-3", prompt: `Goal: ${prompt}`, n: 1, size: "1024x1024" })
    });
    const data = await res.json();
    return data.data?.[0]?.url || null;
  } catch { return null; }
};

// --- FUNCIONES DE SOPORTE PARA MANTENER COMPATIBILIDAD ---
export const analyzeReceipt = async (base64Image: string) => ({ total: 0, date: "", merchant: "", category: "Varios" });
export const connectLiveSession = async (onAudioData: any, onClose: any) => {
    console.warn("Live Session requiere Gemini. OpenAI no soporta este modo nativo aún.");
    return { sessionPromise: Promise.resolve(), outputAudioContext: new AudioContext() };
};
export const getMarketNews = async (query: string) => ({ response: { text: () => "Noticias no disponibles momentáneamente" } } as any);
export const editGoalImage = async (img: string, p: string) => null;
export const generateGoalVideo = async (p: string, ar: string = "16:9") => null;