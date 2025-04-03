#!/bin/bash

echo "============================================="
echo " AWS Contract Analyzer Setup (Vite + Tailwind + React + Flow)"
echo "============================================="

# Crear carpetas necesarias
mkdir -p src/components

# Crear index.css
cat <<EOF > src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# Crear tailwind.config.js
cat <<EOF > tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
EOF

# Crear postcss.config.js
cat <<EOF > postcss.config.js
import tailwindcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";

export default {
  plugins: [tailwindcss, autoprefixer],
};
EOF

# Crear api.js
cat <<EOF > src/api.js
import axios from 'axios';

export const analyzeContract = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post('/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};
EOF

# Crear App.jsx
cat <<EOF > src/App.jsx
import React, { useState } from 'react';
import AwsFlow from './components/AwsFlow';
import UploadForm from './components/UploadForm';
import ResultsDashboard from './components/ResultsDashboard';
import { analyzeContract } from './api';

function App() {
  const [result, setResult] = useState(null);

  const handleAnalyze = async (file) => {
    try {
      const data = await analyzeContract(file);
      setResult(data);
    } catch (err) {
      alert('Error al analizar el contrato.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl mb-10">
        <AwsFlow />
      </div>
      <h1 className="text-3xl font-bold mb-6 text-blue-600">AWS Contract Analyzer 💼</h1>
      <UploadForm onAnalyze={handleAnalyze} />
      <ResultsDashboard result={result} />
    </div>
  );
}

export default App;
EOF

# Crear UploadForm.jsx
cat <<EOF > src/components/UploadForm.jsx
import React, { useRef } from 'react';

const UploadForm = ({ onAnalyze }) => {
  const fileInputRef = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    const file = fileInputRef.current.files[0];
    if (file) {
      onAnalyze(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-lg">
      <label className="block text-gray-700 text-sm font-bold mb-2">
        Subir Contrato (PDF):
      </label>
      <input
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        className="mb-4 w-full"
      />
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        Analizar
      </button>
      <p className="text-xs text-gray-500 mt-2">📦 Esto simula S3 + API Gateway + Lambda</p>
    </form>
  );
};

export default UploadForm;
EOF

# Crear ResultsDashboard.jsx
cat <<EOF > src/components/ResultsDashboard.jsx
import React from 'react';

const ResultsDashboard = ({ result }) => {
  if (!result) return null;

  return (
    <div className="bg-green-100 p-4 rounded shadow w-full max-w-lg">
      <h2 className="text-xl font-bold text-green-700 mb-2">Resultado del Análisis 📊</h2>
      <p><strong>Archivo:</strong> {result.filename}</p>
      <p><strong>Resumen:</strong> {result.summary}</p>
      <p><strong>Palabras clave:</strong> {result.keywords.join(', ')}</p>
      <p><strong>Confianza:</strong> {result.confidence}</p>
      <p className="text-xs text-gray-500 mt-2">📁 Esto simula DynamoDB</p>
    </div>
  );
};

export default ResultsDashboard;
EOF

# Aviso final
echo "\n✅ Todo listo. Ahora ejecuta:"
echo "---------------------------------------------"
echo "  npm install"
echo "  npm run dev"
echo "---------------------------------------------"
