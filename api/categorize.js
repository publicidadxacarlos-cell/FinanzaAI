// api/categorize.js
import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // La clave API se lee desde las variables de entorno de Vercel
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Categoriza en una palabra: "${description}". Ej: Comida, Ocio, Salud, Transporte, Entretenimiento, Educacion, Salud, Ropa, Hogar, Otros.`,
    });

    const category = response.text?.trim() || "Varios";
    
    return res.status(200).json({ category });
    
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return res.status(500).json({ 
      error: 'Failed to categorize transaction',
      details: error.message 
    });
  }
}