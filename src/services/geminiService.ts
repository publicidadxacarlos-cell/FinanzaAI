import { GoogleGenAI } from "@google/genai";

// 1. CONFIGURACIÓN DE CLAVES (LEER DE .ENV PARA SEGURIDAD)
const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
const OPENAI_API_KEY = (import.meta as any).env?.VITE_OPENAI_API_KEY || "";

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

// --- CATEGORIZACIÓN CON OPENAI (Lista ampliada) ---
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
          content: `Clasifica este gasto: "${description}". Responde solo una palabra de estas: Comida, Ocio, Transporte, Ingresos, Vivienda, Salud, Suscripciones, Compras, Viajes, Mascotas o Varios.`
        }],
        temperature: 0
      })
    });

    const data = await response.json();
    const text = data.choices[0].message.content.trim().replace('.', '');
    
    console.log("OpenAI clasificó:", text);
    // Esta lista debe coincidir con la del prompt de arriba
    const categorias = ['Comida', 'Ocio', 'Transporte', 'Ingresos', 'Vivienda', 'Salud', 'Suscripciones', 'Compras', 'Viajes', 'Mascotas'];
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
          { role: "system", content: "Eres un asesor financiero experto. Da consejos breves y útiles. Contexto: " + (context || "") },
          ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text })),
          { role: "user", content: message }
        ]
      })
    });
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    return "Error de conexión con el asesor.";
  }
};

// --- GENERACIÓN DE IMÁGENES REALISTAS (VisionBoard) ---
export const generateGoalImage = async (prompt: string, aspectRatio: string = "1:1") => {
  if (!OPENAI_API_KEY) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({ 
        model: "dall-e-3", 
        // Prompt optimizado para realismo
        prompt: `A professional, high-quality photorealistic 4k photography of ${prompt}. Cinematic lighting, realistic textures, real-life style, no cartoons, no text.`, 
        n: 1, 
        size: "1024x1024" 
      })
    });
    const data = await res.json();
    return data.data?.[0]?.url || null;
  } catch { return null; }
};

// --- SOPORTE Y COMPATIBILIDAD ---
export const analyzeReceipt = async (base64Image: string) => ({ total: 0, date: "", merchant: "", category: "Varios" });
export const connectLiveSession = async (onAudioData: any, onClose: any) => {
  return { sessionPromise: Promise.resolve(), outputAudioContext: new AudioContext() };
};
export const getMarketNews = async (query: string) => ({ response: { text: () => "Noticias no disponibles" } } as any);
export const editGoalImage = async (img: string, p: string) => null;
export const generateGoalVideo = async (p: string, ar: string = "16:9") => null;