import React, { useState, useEffect, useRef } from 'react';
import { getFinancialAdvice, connectLiveSession, getMarketNews } from '../services/geminiService';
import { AppTheme } from '../types';
import { Mic, MicOff, Send, BrainCircuit, Globe } from 'lucide-react';

interface AssistantProps {
  theme: AppTheme;
}

const Assistant: React.FC<AssistantProps> = ({ theme }) => {
  // Chat State
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    {role: 'model', text: 'Hola, soy tu asesor financiero impulsado por Gemini. Puedo analizar tu economía o buscar noticias de mercado. ¿En qué te ayudo?'}
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live API State
  const [isLive, setIsLive] = useState(false);
  const [status, setStatus] = useState('');
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Auto scroll chat
 // Cambia tu useEffect por este en Assistant.tsx
useEffect(() => {
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest' // <--- ESTO evita que el título se desplace
    });
  }
}, [messages]);

  // Handle Text Chat
  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // Check if user is asking for news
      if (userMsg.toLowerCase().includes('noticias') || userMsg.toLowerCase().includes('precio') || userMsg.toLowerCase().includes('bolsa')) {
        const news = await getMarketNews(userMsg);
        setMessages(prev => [...prev, { role: 'model', text: `🔎 **Búsqueda Web:**\n${news.text}` }]);
      } else {
        // Standard Financial Advice with Thinking
        const response = await getFinancialAdvice(messages, userMsg);
        setMessages(prev => [...prev, { role: 'model', text: response || "No pude generar una respuesta." }]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: "Error de conexión." }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Live Voice
  const toggleLive = async () => {
    if (isLive) {
      // Disconnect
      if (liveSessionRef.current) {
        // Just reload page or properly teardown (simplified for demo)
        window.location.reload(); 
      }
      setIsLive(false);
      setStatus('');
    } else {
      // Connect
      setStatus('Conectando a Gemini Live...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioContextRef.current = audioCtx;

        // Start playing user audio to processing node
        const source = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        
        const { sessionPromise, outputAudioContext } = await connectLiveSession(
            (buffer) => {
                // Play audio response
                const src = outputAudioContext.createBufferSource();
                src.buffer = buffer;
                src.connect(outputAudioContext.destination);
                src.start();
            },
            () => setIsLive(false)
        );

        liveSessionRef.current = sessionPromise;

        // Helper to convert float32 to PCM16 and send
        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Downsample and convert logic simplified: 
            // We assume input is handled by context sample rate, 
            // but for robust app we need resampling. 
            // Here we just send raw chunks converted to base64 PCM16.
            
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = inputData[i] * 32768;
            }
            
            const base64 = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
            
            sessionPromise.then(session => {
                session.sendRealtimeInput({
                    media: {
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64
                    }
                });
            });
        };

        source.connect(processor);
        processor.connect(audioCtx.destination);
        
        setIsLive(true);
        setStatus('Escuchando... (Habla ahora)');

      } catch (err) {
        console.error(err);
        setStatus('Error accediendo al micrófono');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] grid grid-rows-[1fr_auto] gap-4">
      {/* Header / Status */}
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : theme.primary}`}>
            <BrainCircuit size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg font-executive">Asesor Gemini 3 Pro</h3>
            <p className="text-xs text-gray-400">{status || 'Modo Chat (Thinking) activo'}</p>
          </div>
        </div>
        <button 
          onClick={toggleLive}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${isLive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/10 hover:bg-white/20 text-gray-300'}`}
        >
          {isLive ? <><MicOff size={16} /> Terminar Voz</> : <><Mic size={16} /> Hablar (Live API)</>}
        </button>
      </div>

      {/* Messages Area */}
      <div className="bg-card rounded-2xl border border-white/5 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? `${theme.primary} text-white rounded-br-none` 
                : 'bg-white/10 text-gray-200 rounded-bl-none'
            }`}>
              <div className="markdown whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-white/5 text-gray-400 rounded-2xl p-4 rounded-bl-none flex items-center gap-2">
                <BrainCircuit size={16} className="animate-pulse" />
                <span className="text-sm">Pensando...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Pregunta sobre finanzas, bolsa, o pide consejos..."
          disabled={isLive} // Disable text input during live voice mode to avoid confusion
          className="flex-1 bg-dark border border-gray-700 rounded-xl px-4 text-white focus:outline-none focus:border-white/50 disabled:opacity-50"
        />
        <button 
          onClick={handleSend}
          disabled={isLive || loading || !input}
          className={`${theme.primary} ${theme.hover} disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors`}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default Assistant;