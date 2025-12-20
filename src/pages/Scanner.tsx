import React, { useState, useRef } from 'react';
import { analyzeReceipt } from '../services/geminiService';
import { Transaction, TransactionType, AppTheme } from '../types';
import { Loader2, Camera, Check, Upload, X } from 'lucide-react';

interface ScannerProps {
  onScanComplete: (t: Transaction) => void;
  theme: AppTheme;
}

const Scanner: React.FC<ScannerProps> = ({ onScanComplete, theme }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!image) return;
    setLoading(true);
    try {
      // Strip base64 prefix
      const base64Data = image.split(',')[1];
      const data = await analyzeReceipt(base64Data);
      
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        date: data.date || new Date().toISOString().split('T')[0],
        amount: data.total,
        // Use the extracted merchant name or default fallback
        description: data.merchant || 'Recibo escaneado',
        category: data.category || 'Compras',
        type: TransactionType.EXPENSE
      };
      
      onScanComplete(newTransaction);
      alert(`✅ Ticket procesado: ${newTransaction.description} - $${newTransaction.amount}`);
      setImage(null);
    } catch (error) {
      console.error(error);
      alert("❌ No se pudo leer el recibo. Asegúrate de