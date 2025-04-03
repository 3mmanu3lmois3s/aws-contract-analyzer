#!/bin/bash

echo "============================================="
echo " AWS Contract Analyzer Setup (Vite + Tailwind + React + Flow)"
echo "============================================="

# Crear carpetas necesarias
mkdir -p src/components

# Crear index.html (Vite-compatible para dev y prod)
cat <<EOF > index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AWS Contract Analyzer</title>
    <link rel="icon" href="https://a0.awsstatic.com/libra-css/images/site/fav/favicon.ico" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
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
npx json -I -f package.json -e "this.homepage='https://tuusuario.github.io/aws-contract-analyzer'"
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
