#!/bin/bash

echo "============================================="
echo " AWS Contract Analyzer Setup (Frontend + API Python)"
echo "============================================="

# Crear carpetas necesarias
mkdir -p src/components
mkdir -p api

# Crear vite.config.js
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

# Crear .gitignore
cat <<EOF > .gitignore
node_modules
dist
.env
__pycache__
*.pyc
api/__pycache__
EOF

# Agregar homepage y scripts de despliegue
echo "\n🔧 Configurando scripts de despliegue..."
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

# Crear archivo api.py con lógica CORS integrada
cat <<EOF > api/api.py
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:5000", "https://3mmanu3lmois3s.github.io"], supports_credentials=True)

@app.route('/analyze', methods=['POST'])
def analyze_contract():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    filename = file.filename

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

# Instalar dependencias necesarias
echo "\n📦 Instalando dependencias..."
npm install
npm install -D tailwindcss @tailwindcss/postcss postcss autoprefixer axios reactflow gh-pages json

# Instrucciones para API Flask
cat <<EOF

✅ Todo listo.
---------------------------------------------
  npm run dev     # para desarrollo local frontend
  npm run deploy  # para publicar en GitHub Pages

  # Ejecutar API local Flask:
  cd api && pip install flask flask-cors && python api.py
---------------------------------------------
EOF
