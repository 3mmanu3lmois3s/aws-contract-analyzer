#!/bin/bash

echo "============================================="
echo " AWS Contract Analyzer Setup (Vite + Tailwind + React + Flow)"
echo "============================================="

# Crear carpetas necesarias
mkdir -p src/components

# Crear vite.config.js con base para producción (GitHub Pages)
cat <<EOF > vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/aws-contract-analyzer/',
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

# Crear postcss.config.js compatible con Tailwind v4+
cat <<EOF > postcss.config.js
import tailwind from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [tailwind, autoprefixer],
};
EOF

# Agregar homepage y scripts de despliegue
npx json -I -f package.json -e "this.homepage='https://3mmanu3lmois3s.github.io/aws-contract-analyzer'"
npx json -I -f package.json -e "this.scripts['predeploy']='npm run build'"
npx json -I -f package.json -e "this.scripts['deploy']='gh-pages -d dist'"

# Crear src/main.jsx
cat <<EOF > src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Crear index.css
cat <<EOF > src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# Crear AwsFlow.jsx con tooltips y diseño responsivo
cat <<EOF > src/components/AwsFlow.jsx
import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

const nodes = [
  { id: '1', data: { label: <div title="Esto simula una subida de archivo a S3">📁 S3 (Upload)</div> }, position: { x: 100, y: 0 }, style: { background: '#ebf8ff', padding: 10, border: '1px solid #90cdf4' } },
  { id: '2', data: { label: <div title="Simula el paso por API Gateway">⚡ API Gateway</div> }, position: { x: 100, y: 100 }, style: { background: '#ffffcc', padding: 10, border: '1px solid #f6e05e' } },
  { id: '3', data: { label: <div title="Simula una función Lambda que analiza el contrato">⚙️ Lambda (Análisis)</div> }, position: { x: 100, y: 200 }, style: { background: '#fee2e2', padding: 10, border: '1px solid #f56565' } },
  { id: '4', data: { label: <div title="Simula guardar el resultado en DynamoDB">🗃️ DynamoDB (Resultados)</div> }, position: { x: 100, y: 300 }, style: { background: '#ccfbf1', padding: 10, border: '1px solid #38b2ac' } },
];

const edges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
];

function AwsFlow() {
  return (
    <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] rounded bg-white border shadow mb-6">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default AwsFlow;
EOF

# Instalar dependencias necesarias
echo "
📦 Instalando dependencias necesarias..."
npm install
npm install -D tailwindcss @tailwindcss/postcss postcss autoprefixer axios reactflow gh-pages json

# Mensaje final
echo "
✅ Todo listo. Ejecuta ahora:"
echo "---------------------------------------------"
echo "  npm run dev     # para desarrollo local"
echo "  npm run deploy  # para publicar en GitHub Pages"
echo "---------------------------------------------"
echo "¡Recuerda tener Flask corriendo en localhost:5000 para probarlo localmente!"

