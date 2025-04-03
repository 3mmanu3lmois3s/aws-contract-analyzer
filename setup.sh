#!/bin/bash

echo "============================================="
echo " AWS Contract Analyzer Setup (Vite + Tailwind + React + Flow)"
echo "============================================="

# Crear carpetas necesarias
mkdir -p src/components

# Crear index.html con favicon AWS
cat <<EOF > index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="https://a0.awsstatic.com/libra-css/images/site/fav/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AWS Contract Analyzer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# Crear index.css
cat <<EOF > src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# Crear vite.config.js con proxy
cat <<EOF > vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/analyze': 'http://localhost:5000'
    }
  }
});
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
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default {
  plugins: [tailwindcss, autoprefixer],
};
EOF

# Agregar homepage y scripts de despliegue
npx json -I -f package.json -e "this.homepage='https://tuusuario.github.io/aws-contract-analyzer'"
npx json -I -f package.json -e "this.scripts['predeploy']='npm run build'"
npx json -I -f package.json -e "this.scripts['deploy']='gh-pages -d dist'"

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

# Crear App.jsx con manejo de error
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
      setResult({
        filename: file.name,
        summary: "No se pudo analizar el contrato. Verifica si el servidor Flask está corriendo.",
        keywords: [],
        confidence: "N/A",
        error: true
      });
      console.error("Error al conectarse con el backend:", err);
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

# Crear ResultsDashboard.jsx con manejo de error
cat <<EOF > src/components/ResultsDashboard.jsx
import React from 'react';

const ResultsDashboard = ({ result }) => {
  if (!result) return null;

  return (
    <div className="bg-green-100 p-4 rounded shadow w-full max-w-lg">
      <h2 className="text-xl font-bold text-green-700 mb-2">Resultado del Análisis 📊</h2>
      {result.error ? (
        <p className="text-red-600 font-semibold">
          ⚠️ Error al conectar con el backend. Asegúrate de que Flask esté activo en <code>localhost:5000</code>.
        </p>
      ) : (
        <>
          <p><strong>Archivo:</strong> {result.filename}</p>
          <p><strong>Resumen:</strong> {result.summary}</p>
          <p><strong>Palabras clave:</strong> {result.keywords.join(', ')}</p>
          <p><strong>Confianza:</strong> {result.confidence}</p>
        </>
      )}
      <p className="text-xs text-gray-500 mt-2">📁 Esto simula DynamoDB</p>
    </div>
  );
};

export default ResultsDashboard;
EOF

# Crear AwsFlow.jsx
cat <<EOF > src/components/AwsFlow.jsx
import React from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  {
    id: '1',
    position: { x: 0, y: 0 },
    data: { label: '📁 S3 (Upload)' },
    style: { background: '#f0f9ff', border: '1px solid #3b82f6' }
  },
  {
    id: '2',
    position: { x: 0, y: 100 },
    data: { label: '🧩 API Gateway' },
    style: { background: '#fefce8', border: '1px solid #facc15' }
  },
  {
    id: '3',
    position: { x: 0, y: 200 },
    data: { label: '⚙️ Lambda (Análisis)' },
    style: { background: '#fef2f2', border: '1px solid #ef4444' }
  },
  {
    id: '4',
    position: { x: 0, y: 300 },
    data: { label: '🗃️ DynamoDB (Resultados)' },
    style: { background: '#ecfdf5', border: '1px solid #10b981' }
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
];

const AwsFlow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default AwsFlow;
EOF

# Instalar dependencias necesarias
echo "\n📦 Instalando dependencias necesarias..."
npm install
npm install tailwindcss postcss autoprefixer axios reactflow gh-pages json

# Mensaje final
echo "\n✅ Todo listo. Ejecuta ahora:"
echo "---------------------------------------------"
echo "  npm run dev     # para desarrollo local"
echo "  npm run deploy  # para publicar en GitHub Pages"
echo "---------------------------------------------"
echo "Si aún no tienes Vite, puedes crear un proyecto con:"
echo "  npm create vite@latest"
echo "---------------------------------------------"
