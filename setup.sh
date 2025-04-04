#!/bin/bash

echo "============================================="
echo " AWS Contract Analyzer Setup (Vite + Tailwind + React + Flow + Flask Proxy)"
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

# Crear archivo .gitignore
cat <<EOF > .gitignore
node_modules/
dist/
.env
__pycache__/
*.pyc
EOF

# Crear src/api.js con lógica que detecta entorno local o GitHub Pages
cat <<EOF > src/api.js
const isProduction = window.location.hostname.includes("github.io");

const BASE_URL = isProduction
  ? "http://localhost:5000/analyze"
  : "/analyze";

export const analyzeContract = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(BASE_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Error analyzing contract");
  }

  return response.json();
};
EOF

# Crear API Flask en api.py
cat <<EOF > api.py
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/analyze', methods=['POST'])
def analyze_contract():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    filename = file.filename

    # 🧪 Simulación de análisis (esto se puede mejorar)
    result = {
        'filename': filename,
        'type': 'Contrato de Servicios',
        'duration': '12 meses',
        'risk': 'Moderado',
        'compliance': '✔ Cumple con GDPR',
        'recommendation': '✔ Apto para firma'
    }

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
EOF

# Agregar homepage y scripts de despliegue
npx json -I -f package.json -e "this.homepage='https://3mmanu3lmois3s.github.io/aws-contract-analyzer'"
npx json -I -f package.json -e "this.scripts['predeploy']='npm run build'"
npx json -I -f package.json -e "this.scripts['deploy']='gh-pages -d dist'"

# Crear src/index.css
cat <<EOF > src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

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
echo "  python api.py    # para ejecutar el backend Flask"
echo "---------------------------------------------"
echo "¡Recuerda tener Flask corriendo en localhost:5000 al usar GitHub Pages!"
