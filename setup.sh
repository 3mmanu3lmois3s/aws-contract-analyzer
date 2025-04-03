#!/bin/bash

echo "============================================="
echo " AWS Contract Analyzer Setup (Vite + Tailwind + React + Flow)"
echo "============================================="

# Crear carpetas necesarias
mkdir -p src/components

# Crear .gitignore para evitar subir node_modules y otros archivos no deseados
cat <<EOF > .gitignore
# Node modules
node_modules/
dist/
.vite/

# Logs
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# Env files
.env
.env.*.local

# Editor folders
.vscode/
.idea/

# Mac and system files
.DS_Store
Thumbs.db
EOF

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

# Crear src/index.css
cat <<EOF > src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# Instalar dependencias necesarias
echo "\n📦 Instalando dependencias necesarias..."
npm install
npm install -D tailwindcss @tailwindcss/postcss postcss autoprefixer axios reactflow gh-pages json

# Mensaje final
echo "\n✅ Todo listo. Ejecuta ahora:"
echo "---------------------------------------------"
echo "  npm run dev     # para desarrollo local"
echo "  npm run deploy  # para publicar en GitHub Pages"
echo "---------------------------------------------"
echo "¡Recuerda tener Flask corriendo en localhost:5000 para probarlo localmente!"
