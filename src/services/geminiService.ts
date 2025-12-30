import { 
  GoogleGenAI, 
  Type, 
  LiveServerMessage,
  Modality,
  Blob,
  GenerateContentResponse
} from "@google/genai";

// Claves de API centralizadas
const API_KEY = (import.meta as any).env.VITE_GOOGLE_GENAI_API_KEY;
const OPENAI_API_KEY = (import.meta as any).env.VITE_OPENAI_API_KEY;

// ---------------------------------------------------------
// Helpers para Audio/Video (Lógica original intacta)
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
// Servicios de Texto y Análisis (Corregidos)
// ---------------------------------------------------------

export const categorizeTransaction = async (description: string): Promise<string> => {
  if (!description) return "Varios";

  try {
    const genAI = new GoogleGenAI(API_KEY);
    
    // 1. Configuramos el modelo con una instrucción de sistema más directa
    const model = (genAI as any).getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "Tu única misión es clasificar gastos. Responde exclusivamente con UNA de estas palabras: Comida, Ocio, Transporte, Ingresos, Vivienda, Salud. No uses puntos finales ni frases. Si es imposible clasificar, solo entonces responde: Varios."
    });

    // 2. Enviamos el mensaje. Nota: quitamos la palabra "Concepto:" para no distraer a la IA
    const result = await model.generateContent(description);
    const text = result.response.text().trim();

    // 3. Sistema de limpieza robusto
    const categoriasValidas = ['Comida', 'Ocio', 'Transporte', 'Ingresos', 'Vivienda', 'Salud'];
    
    // Buscamos si alguna de nuestras palabras clave está contenida en la respuesta de la IA
    const encontrada = categoriasValidas.find(cat => 
      text.toLowerCase().includes(cat.toLowerCase())
    );

    // LOG DE CONTROL: Esto es vital. Mira en la consola (F12) qué está pasando realmente.
    console.log(`🤖 IA: "${description}" -> Respuesta IA: "${text}" -> Resultado: ${encontrada || "Varios"}`);

    return encontrada || "Varios";

  } catch (error) {
    // Si la consola muestra "Error crítico en IA", sabremos que es un fallo de conexión o cuota
    console.error("Error crítico en IA:", error);
    return "Varios";
  }
};

export const analyzeReceipt = async (base64Image: string): Promise<{total: number, date: string, merchant: string, category: string}> => {
  try {
    const genAI = new GoogleGenAI(API_KEY);
    const model = (genAI as any).getGenerativeModel({ 
      model: 'gemini-1.5-flash' 
    });
    
    const result = await model.generateContent({
      contents: [{
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Analiza el recibo. Extrae: total (número), date (YYYY-MM-DD), merchant (nombre), category (una palabra)." }
        ]
      }],
      generationConfig: {
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

    return JSON.parse(result.response.text() || "{}");
  } catch (error) {
    console.error("Error analizando recibo:", error);
    return { total: 0, date: "", merchant: "", category: "Varios" };
  }
};

export const getFinancialAdvice = async (
  history: {role: string, text: string}[], 
  message: string, 
  context?: string
) => {
  const genAI = new GoogleGenAI(API_KEY);
  const fullPrompt = context 
    ? `CONTEXTO DE MIS GASTOS REALES:\n${context}\n\nPREGUNTA DEL USUARIO: ${message}`
    : message;

  const model = (genAI as any).getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: "Eres un asesor financiero de alto nivel. Analiza los gastos y da consejos personalizados. Usa Google Search para datos externos."
  });

  const result = await model.generateContent({
    contents: [
      ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] })), 
      { role: 'user', parts: [{ text: fullPrompt }] }
    ],
    tools: [{ googleSearch: {} }]
  });

  return result.response.text();
};

// ---------------------------------------------------------
// Generación de Medios
// ---------------------------------------------------------

export const generateGoalImage = async (prompt: string, aspectRatio: string = "1:1") => {
    if (OPENAI_API_KEY) {
      try {
        const res = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: `High-quality financial goal visualization: ${prompt}`,
            n: 1,
            size: "1024x1024"
          })
        });
        const data = await res.json();
        return data.data?.[0]?.url || null;
      } catch (e) {
        console.error("OpenAI failed, falling back to Gemini", e);
      }
    }

    // Fallback a Gemini
    try {
      const genAI = new GoogleGenAI(API_KEY);
      const model = (genAI as any).getGenerativeModel({ model: 'gemini-1.5-flash' });
      const response = await model.generateContent(prompt);
      // Para imágenes en Gemini se requiere un modelo específico (provisión básica aquí)
      return null;
    } catch (e) {
      return null;
    }
};

// ---------------------------------------------------------
// Live API Session (Audio para Voz) - RECONSTRUIDO COMPLETO
// ---------------------------------------------------------

export const connectLiveSession = async (
  onAudioData: (buffer: AudioBuffer) => void,
  onClose: () => void
) => {
  const genAI = new GoogleGenAI(API_KEY);
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

  const sessionPromise = (genAI as any).live.connect({
    model: 'gemini-1.5-flash', 
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
      onerror: (e: any) => console.error("Live session error", e),
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
};// --- ESTAS SON LAS PIEZAS QUE FALTAN PARA QUITAR LOS ERRORES ---

export const getMarketNews = async (query: string): Promise<GenerateContentResponse> => {
  const genAI = new GoogleGenAI(API_KEY);
  const model = (genAI as any).getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    tools: [{ googleSearch: {} }] 
  });
  const response = await model.generateContent(query);
  return response;
};

export const editGoalImage = async (base64Image: string, prompt: string) => {
  // Por ahora devolvemos null para que no de error, ya que requiere modelo ProVision
  return null;
};

export const generateGoalVideo = async (prompt: string, aspectRatio: string = "16:9") => {
  // Por ahora devolvemos null para que la app no se rompa
  return null;
};