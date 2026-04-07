// api/analyze-receipt.js
// Serverless function — la API key nunca llega al navegador
import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { base64Image, mimeType } = req.body;

    if (!base64Image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY no está configurada en Vercel');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Analiza la imagen de este comprobante o ticket y extrae los datos.
Responde EXCLUSIVAMENTE en formato JSON plano, sin bloques de código Markdown (sin \`\`\`json).
Usa punto para decimales en el total.
Categoriza el gasto en una de estas: Comida, Ocio, Transporte, Vivienda, Salud, Suscripciones, Compras, Viajes, Mascotas, Varios.
Formato exacto: {"total": 15.50, "date": "DD/MM/AAAA", "merchant": "Nombre del comercio", "category": "Comida"}`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { data: base64Image, mimeType: mimeType || 'image/jpeg' } }
        ]
      }]
    });

    const text = result.text;
    const jsonMatch = text.match(/\{.*\}/s);

    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON de la respuesta de Gemini');
    }

    const data = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      total: parseFloat(data.total) || 0,
      date: data.date || '',
      merchant: data.merchant || 'Desconocido',
      category: data.category || 'Varios'
    });

  } catch (error) {
    console.error('Error analizando ticket:', error);
    return res.status(500).json({
      error: 'Failed to analyze receipt',
      details: error.message
    });
  }
}
