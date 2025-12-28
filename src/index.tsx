import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Buscamos el hueco en el HTML
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("No se pudo encontrar el elemento root para montar la app");
}

// Creamos la raíz de React y renderizamos App
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);