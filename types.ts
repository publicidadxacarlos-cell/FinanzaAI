
export enum TransactionType {
  INCOME = 'Ingreso',
  EXPENSE = 'Gasto'
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
}

export interface ChartData {
  name: string;
  value: number;
}

export enum View {
  DASHBOARD = 'dashboard',
  TRANSACTIONS = 'transactions',
  ASSISTANT = 'assistant', // Chat & Live API
  VISION_BOARD = 'vision_board', // Image Gen & Veo
  SCANNER = 'scanner', // Receipt scanning
  SETTINGS = 'settings' // Google Sheet Config
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  savedAmount: number;
  imageUrl?: string;
  videoUrl?: string;
}

export interface AppTheme {
  id: string;
  name: string;
  primary: string; // bg class
  hover: string; // hover bg class
  text: string; // text class
  gradient: string; // gradient classes
  secondary: string; // secondary accent
}
