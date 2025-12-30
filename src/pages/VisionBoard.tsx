import React, { useState, useEffect } from 'react';
import { generateGoalImage, generateGoalVideo, editGoalImage } from '../services/geminiService';
import { AppTheme } from '../types';
import { Loader2, Video, Image as ImageIcon, Wand2, RefreshCcw, Sparkles, Trash2, Trophy, CheckCircle } from 'lucide-react';

interface VisionBoardProps {
  theme: AppTheme;
}

interface SavedGoal {
  id: string;
  url: string;
  prompt: string;
  type: 'image' | 'video';
  date: string;
}

const VisionBoard: React.FC<VisionBoardProps> = ({ theme }) => {
  const [prompt, setPrompt] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [loading, setLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [editMode, setEditMode] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  
  // Estado para la Vitrina de Metas Alcanzadas
  const [completedGoals, setCompletedGoals] = useState<SavedGoal[]>(() => {
    const saved = localStorage.getItem('completed_goals');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('completed_goals', JSON.stringify(completedGoals));
  }, [completedGoals]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setMediaUrl(null);
    setEditMode(false);
    try {
      if (mediaType === 'image') {
        const result = await generateGoalImage(prompt, aspectRatio);
        setMediaUrl(result);
      } else {
        const result = await generateGoalVideo(prompt, aspectRatio);
        setMediaUrl(result);
      }
    } catch (e) {
      console.error(e);
      alert("Error en generación.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if(!mediaUrl || !editPrompt || mediaType !== 'image') return;
    setLoading(true);
    const base64 = mediaUrl.split(',')[1];
    try {
        const result = await editGoalImage(base64, editPrompt);
        if(result) setMediaUrl(result);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
        setEditMode(false);
        setEditPrompt('');
    }
  };

  const markAsCompleted = () => {
    if (!mediaUrl) return;
    const newGoal: SavedGoal = {
      id: crypto.randomUUID(),
      url: mediaUrl,
      prompt: prompt,
      type: mediaType,
      date: new Date().toLocaleDateString()
    };
    setCompletedGoals([newGoal, ...completedGoals]);
    setMediaUrl(null);
    setPrompt('');
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto animate-fade-in pb-20">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-gold-500/80 mb-2">
            <Sparkles size={14} /> Neural Vision Engine
        </div>
        <h2 className="text-5xl font-executive font-bold gold-text-gradient drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]">
          Visualiza tus Metas
        </h2>
        <p className="text-gray-400 text-lg font-light max-w-2xl mx-auto">
          Transformamos tus objetivos financieros en realidades visuales mediante IA.
        </p>
      </div>

      {/* Panel de Generación */}
      <div className={`bg-navy/40 p-8 rounded-[2.5rem] border ${theme.secondary} shadow-2xl space-y-6 backdrop-blur-md`}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ej: Una villa de lujo en la costa de Amalfi al atardecer..."
          className="w-full h-40 bg-midnight/50 border border-white/10 rounded-3xl p-6 text-white text-lg placeholder:text-white/20 resize-none focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
        />

        <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex bg-midnight/50 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                <button
                    onClick={() => setMediaType('image')}
                    className={`px-6 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${mediaType === 'image' ? theme.primary + ' text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                    <ImageIcon size={16} /> IMAGEN
                </button>
                <button
                    onClick={() => setMediaType('video')}
                    className={`px-6 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${mediaType === 'video' ? theme.primary + ' text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                    <Video size={16} /> VIDEO
                </button>
            </div>
            
            <select 
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="bg-midnight/50 border border-white/10 text-gray-400 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-widest focus:outline-none"
            >
                <option value="16:9">Panorámico (16:9)</option>
                <option value="9:16">Vertical (9:16)</option>
                <option value="1:1">Cuadrado (1:1)</option>
            </select>

            <button
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className={`bg-gradient-to-tr ${theme.gradient} text-white px-10 py-3 rounded-2xl font-bold flex items-center gap-3 disabled:opacity-30 shadow-2xl transition-all border border-white/10`}
            >
                {loading ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
                {loading ? 'Procesando...' : 'Generar Meta'}
            </button>
        </div>
      </div>

      {/* Visualización de Resultado */}
      {mediaUrl && (
        <div className="bg-navy/40 p-6 rounded-[2.5rem] border border-white/10 shadow-2xl animate-fade-in relative overflow-hidden">
           <div className="rounded-3xl overflow-hidden border border-white/10 relative group">
              {mediaType === 'image' ? (
                <img src={mediaUrl} alt="Goal" className="w-full object-cover max-h-[600px] transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <video src={mediaUrl} controls className="w-full max-h-[600px]" />
              )}
              
              {/* Botonera Flotante */}
              <div className="absolute top-4 right-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <button onClick={() => setMediaUrl(null)} className="bg-red-500/80 backdrop-blur-md text-white p-3 rounded-full shadow-xl hover:bg-red-600 transition-all" title="Borrar">
                      <Trash2 size={20} />
                  </button>
                  <button onClick={markAsCompleted} className="bg-green-500/80 backdrop-blur-md text-white p-3 rounded-full shadow-xl hover:bg-green-600 transition-all" title="¡Meta Conseguida!">
                      <CheckCircle size={20} />
                  </button>
                  {mediaType === 'image' && (
                    <button onClick={() => setEditMode(!editMode)} className="bg-blue-500/80 backdrop-blur-md text-white p-3 rounded-full shadow-xl hover:bg-blue-600 transition-all" title="Refinar">
                        <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                  )}
              </div>
           </div>
           
           {editMode && mediaType === 'image' && (
                <div className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/10 animate-fade-in">
                    <h4 className={`text-xs font-bold uppercase tracking-[0.2em] mb-4 ${theme.text}`}>Refinamiento de Imagen</h4>
                    <div className="flex gap-3">
                        <input 
                          type="text" 
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          placeholder="Ej: Añade un cielo más soleado..."
                          className="flex-1 bg-midnight border border-white/10 rounded-2xl px-5 py-3 text-white text-sm focus:outline-none"
                        />
                        <button onClick={handleEdit} disabled={loading} className={`${theme.primary} text-white px-8 py-3 rounded-2xl text-xs font-bold uppercase shadow-xl`}>
                            {loading ? '...' : 'Aplicar'}
                        </button>
                    </div>
                </div>
           )}
        </div>
      )}

      {/* Vitrina de Metas Alcanzadas */}
      {completedGoals.length > 0 && (
        <div className="pt-10 border-t border-white/10 animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-gold-500/10 border border-gold-500/20">
              <Trophy className="text-gold-500" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Vitrina de Éxitos</h3>
              <p className="text-gray-500 text-sm">Tus sueños financieros hechos realidad</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {completedGoals.map((goal) => (
              <div key={goal.id} className="group relative rounded-[2rem] overflow-hidden border border-white/10 aspect-video bg-midnight shadow-lg">
                <img src={goal.url} alt={goal.prompt} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                  <p className="text-[10px] text-gold-400 font-bold uppercase tracking-widest mb-1">{goal.date}</p>
                  <p className="text-xs text-white font-medium line-clamp-2">{goal.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisionBoard;