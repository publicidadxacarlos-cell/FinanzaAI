import React, { useState, useEffect } from 'react';
import { AppTheme, Transaction } from '../types';
import { 
  Save, 
  Sheet, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  Copy, 
  Trash2, 
  Eraser, 
  X,
  Palette,
  ExternalLink,
  Code
} from 'lucide-react';

interface SettingsProps {
  theme: AppTheme;
  transactions?: Transaction[];
  onSync: () => void;
  isSyncing: boolean;
  onClearData: () => void;
  themes?: AppTheme[];
  setTheme?: (theme: AppTheme) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  theme, onSync, isSyncing, onClearData, themes = [], setTheme 
}) => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem('googleSheetUrl');
    if (savedUrl) setSheetUrl(savedUrl);
  }, []);

  const handleSave = () => {
    localStorage.setItem('googleSheetUrl', sheetUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleFactoryReset = () => {
      localStorage.clear();
      window.location.reload();
  };

  const scriptCode = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  var id = data.id;
  var action = data.action;

  var range = sheet.getDataRange();
  var values = range.getValues();
  var rowIdx = -1;

  // Buscar fila por ID
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] == id) {
      rowIdx = i + 1;
      break;
    }
  }

  if (action === 'delete') {
    if (rowIdx !== -1) sheet.deleteRow(rowIdx);
  } else if (action === 'update') {
    if (rowIdx !== -1) {
      sheet.getRange(rowIdx, 1, 1, 6).setValues([[
        data.id, data.date, data.description, data.amount, data.type, data.category
      ]]);
    }
  } else {
    // Crear o Sincronizar
    sheet.appendRow([
      data.id, data.date, data.description, data.amount, data.type, data.category
    ]);
  }
  return ContentService.createTextOutput("OK");
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-24">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white font-executive flex items-center gap-3">
          <Sheet className="text-green-500" /> Configuración
        </h2>
        <p className="text-gray-400">Gestiona tu conexión y apariencia.</p>
      </div>

      {/* SECCIÓN: PERSONALIZACIÓN */}
      <div className="bg-card p-6 rounded-2xl border border-white/5 shadow-xl space-y-6">
        <section className="space-y-4">
            <h3 className="text-white font-bold flex items-center gap-2">
                <Palette className={theme.text} size={20} /> Personalización
            </h3>
            <div className="flex flex-wrap gap-4">
                {themes.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTheme && setTheme(t)}
                        className={`group relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border ${theme.id === t.id ? 'bg-white/10 border-white/20' : 'bg-transparent border-transparent opacity-60 hover:opacity-100'}`}
                    >
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${t.gradient} border-2 ${theme.id === t.id ? 'border-white' : 'border-white/10'} shadow-lg group-active:scale-95 transition-transform`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.id === t.id ? 'text-white' : 'text-gray-500'}`}>{t.name}</span>
                        {theme.id === t.id && (
                            <div className="absolute -top-1 -right-1 bg-white text-black rounded-full p-0.5 shadow-xl">
                                <CheckCircle size={14} />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </section>
      </div>

      {/* SECCIÓN: CONEXIÓN GOOGLE SHEETS */}
      <div className="bg-card p-6 rounded-2xl border border-white/5 shadow-xl space-y-8">
        <section className="space-y-6">
            <h3 className="text-white font-bold flex items-center gap-2">
                <Database className="text-blue-400" size={20} /> Conexión de Datos
            </h3>
            
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Google Sheets Web App URL</label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                        type="text" 
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        placeholder="https://script.google.com/macros/s/.../exec"
                        className="flex-1 bg-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:border-transparent transition-colors"
                    />
                    <button 
                        onClick={handleSave}
                        className={`${theme.primary} ${theme.hover} text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all`}
                    >
                        {saved ? <CheckCircle size={20} /> : <Save size={20} />}
                        {saved ? 'Listo' : 'Guardar'}
                    </button>
                </div>
                
                {sheetUrl && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <RefreshCw size={20} className={isSyncing ? 'animate-spin text-blue-400' : 'text-blue-400'} />
                            <div>
                                <h4 className="text-white font-medium">Sincronización Manual</h4>
                                <p className="text-xs text-gray-400">Envía todo tu historial local a la hoja.</p>
                            </div>
                        </div>
                        <button
                            onClick={onSync}
                            disabled={isSyncing}
                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {isSyncing ? 'Procesando...' : 'Sincronizar Todo'}
                        </button>
                    </div>
                )}
            </div>
        </section>

        {/* GUÍA DE CONFIGURACIÓN */}
        <section className="pt-8 border-t border-white/5 space-y-4">
            <h3 className="text-white font-bold flex items-center gap-2">
                <Code className="text-gold-500" size={20} /> Guía de Configuración
            </h3>
            
            <div className="space-y-4 text-sm text-gray-400">
                <ol className="list-decimal list-inside space-y-2">
                    <li>Crea una nueva <strong>Google Sheet</strong>.</li>
                    <li>Ve a <strong>Extensiones</strong> &gt; <strong>Apps Script</strong>.</li>
                    <li>Borra todo el código y pega el siguiente fragmento:</li>
                </ol>

                <div className="relative group">
                    <pre className="bg-midnight p-4 rounded-xl border border-white/10 text-[10px] overflow-x-auto text-gold-300/80 font-mono max-h-48">
                        {scriptCode}
                    </pre>
                    <button 
                        onClick={copyToClipboard}
                        className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg backdrop-blur-md border border-white/10 transition-all flex items-center gap-2"
                    >
                        {copied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                        <span className="text-[10px] font-bold uppercase">{copied ? 'Copiado' : 'Copiar'}</span>
                    </button>
                </div>

                <ol className="list-decimal list-inside space-y-2" start={4}>
                    <li>Haz clic en <strong>Implementar</strong> &gt; <strong>Nueva implementación</strong>.</li>
                    <li>Selecciona <strong>Aplicación web</strong>.</li>
                    <li>En "Quién tiene acceso", selecciona <strong>Cualquiera</strong>.</li>
                    <li>Copia la <strong>URL de la aplicación web</strong> y pégala arriba.</li>
                </ol>
            </div>
        </section>

        {/* ZONA DE PELIGRO */}
        <section className="pt-8 border-t border-red-500/30">
            <h3 className="text-red-400 font-bold flex items-center gap-2 mb-4">
                <AlertTriangle size={20} /> Zona de Peligro
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`border p-4 rounded-xl transition-all ${confirmClear ? 'bg-orange-900/20 border-orange-500' : 'bg-red-500/5 border-red-500/20'}`}>
                    <h4 className="text-orange-400 font-semibold mb-2 flex items-center gap-2 text-sm"><Eraser size={16} /> Limpiar Local</h4>
                    {!confirmClear ? (
                        <button onClick={() => setConfirmClear(true)} className="w-full bg-orange-600/20 text-orange-400 border border-orange-500/50 px-4 py-2 rounded-lg text-xs font-bold">Borrar Registros</button>
                    ) : (
                        <div className="flex gap-2">
                             <button onClick={() => { onClearData(); setConfirmClear(false); }} className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-xs font-bold">Confirmar</button>
                             <button onClick={() => setConfirmClear(false)} className="px-3 bg-white/10 rounded-lg text-white"><X size={16} /></button>
                        </div>
                    )}
                </div>
                <div className={`border p-4 rounded-xl transition-all ${confirmReset ? 'bg-red-900/20 border-red-500' : 'bg-red-500/5 border-red-500/20'}`}>
                    <h4 className="text-red-500 font-semibold mb-2 flex items-center gap-2 text-sm"><Trash2 size={16} /> Reset de App</h4>
                    {!confirmReset ? (
                        <button onClick={() => setConfirmReset(true)} className="w-full bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg">Reiniciar Todo</button>
                    ) : (
                        <div className="flex gap-2">
                             <button onClick={handleFactoryReset} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-bold">BORRAR TODO</button>
                             <button onClick={() => setConfirmReset(false)} className="px-3 bg-white/10 rounded-lg text-white"><X size={16} /></button>
                        </div>
                    )}
                </div>
            </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;