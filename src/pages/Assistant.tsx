import React, { useState, useEffect, useRef } from 'react';
import { getFinancialAdvice, connectLiveSession, getMarketNews } from '../services/geminiService';
import { AppTheme, Transaction } from '../types'; // Importamos Transaction
import { Mic, MicOff, Send, BrainCircuit, Search } from 'lucide-react';

interface AssistantProps {
  theme: AppTheme;
}

const Assistant: React.FC<AssistantProps> = ({ theme }) => {
  // Chat State
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    {role: 'model', text: 'Hola, soy tu asesor financiero impulsado por Gemini 3. Puedo analizar tus gastos reales o buscar noticias. ¿En qué te ayudo hoy?'}
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
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- FUNCIÓN CLAVE: OBTENER CONTEXTO DE GASTOS ---
  const getUserFinancialContext = () => {
    try {
      const savedTransactions = localStorage.getItem('transactions');
      if (!savedTransactions) return "El usuario no tiene gastos registrados aún.";
      
      const transactions: Transaction[] = JSON.parse(savedTransactions);
      if (transactions.length === 0) return "El listado de gastos está vacío.";

      // Resumimos los gastos para no saturar a la IA
      const summary = transactions.slice(-20).map(t => 
        `- ${t.date}: ${t.description} (${t.category}) -> ${t.amount}€`
      ).join('\n');

      return `Aquí están los últimos movimientos del usuario:\n${summary}`;
    } catch (e) {
      return "Error al leer los gastos.";
    }
  };

  // Handle Text Chat
  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // 1. Obtener los gastos reales del usuario
      const context = getUserFinancialContext();

      // 2. Decidir si usar búsqueda web o consejo financiero
      const isMarketQuery = userMsg.toLowerCase().match(/(noticias|precio|bolsa|bitcoin|crypto|mercado|acciones)/);

      if (isMarketQuery) {
        const news = await getMarketNews(userMsg);
        setMessages(prev => [...prev, { role: 'model', text: `🔎 **Análisis de Mercado:**\n${news.text}` }]);
      } else {
        // Le pasamos el CONTEXTO de gastos a la función del servicio
        const response = await getFinancialAdvice(messages, userMsg, context);
        setMessages(prev => [...prev, { role: 'model', text: response || "No pude procesar esa información." }]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: "Lo siento, hubo un error de conexión con mi cerebro artificial." }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Live Voice (Simplificado para el ritual)
  const toggleLive = async () => {
    if (isLive) {
      window.location.reload(); 
    } else {
      setStatus('Conectando a Gemini Live...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioContextRef.current = audioCtx;
        const { sessionPromise } = await connectLiveSession(() => {}, () => setIsLive(false));
        liveSessionRef.current = sessionPromise;
        setIsLive(true);
        setStatus('Escuchando... (Modo Voz activo)');
      } catch (err) {
        setStatus('Error de micrófono');
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center bg-navy/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 mb-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-br from-gold-400 to-gold-600'}`}>
            <BrainCircuit size={20} className="text-navy" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Asesor Financiero Pro</h3>
            <p className="text-[10px] text-gold-500 uppercase tracking-tighter font-bold">Gemini 2.5 Flash + Web Search</p>
          </div>
        </div>
        <button 
          onClick={toggleLive}
          className={`text-xs flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${isLive ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          {isLive ? <MicOff size={14} /> : <Mic size={14} />}
          {isLive ? 'Detener' : 'Hablar'}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-lg ${
              msg.role === 'user' 
                ? `${theme.primary} text-white rounded-tr-none border border-white/10` 
                : 'bg-navy/60 backdrop-blur-md text-gray-200 rounded-tl-none border border-white/5'
            }`}>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-pulse">
             <div className="bg-white/5 text-gold-500 rounded-2xl p-4 flex items-center gap-2 border border-gold-500/20">
                <Search size={16} className="animate-bounce" />
                <span className="text-xs font-bold uppercase tracking-widest">Analizando datos...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - CORREGIDO DISEÑO OSCURO */}
      <div className="relative group">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ej: ¿En qué puedo ahorrar según mis gastos?"
          disabled={isLive}
          className="w-full bg-navy/80 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/50 transition-all shadow-2xl disabled:opacity-50"
        />
        <button 
          onClick={handleSend}
          disabled={isLive || loading || !input}
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.primary} text-white p-2.5 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-0`}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default Assistant;