#!/bin/bash

set -e

echo "============================================="
echo " AWS Contract Analyzer Setup (Vite + Flask + Tailwind v4 + ReactFlow)"
echo "============================================="

# Crear carpetas necesarias
mkdir -p src/components backend

# Crear vite.config.js con @tailwindcss/vite plugin
cat <<EOF > vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/aws-contract-analyzer/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/analyze': 'http://localhost:5000'
    }
  }
})
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

# Crear index.css con Tailwind directives
cat <<EOF > src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# Crear postcss.config.js limpio para compatibilidad
cat <<EOF > postcss.config.js
export default {
  plugins: {},
};
EOF

# Crear src/api.js con CORS y backend local
cat <<'EOF' > src/api.js
const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname.startsWith('127.') ||
  window.location.hostname.endsWith('.github.io');

const BASE_API_URL = isLocal ? 'http://localhost:5000' : 'http://localhost:5000';

export async function analyzeContract(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_API_URL}/analyze`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error al analizar contrato: ${errText}`);
  }

  return await response.json();
}
EOF

# Crear backend/api.py con CORS
cat <<EOF > backend/api.py
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/analyze": {"origins": [
    "http://localhost:5173",
    "http://localhost:5000",
    "https://3mmanu3lmois3s.github.io"
]}}, supports_credentials=True)

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

# Crear README.md básico
cat <<EOF > README.md
# AWS Contract Analyzer

Simula una arquitectura serverless con frontend en React + Vite + Tailwind v4 y backend Flask local.

## Requisitos
- Node.js >= 18
- Python >= 3.10

## Instalación
```bash
git clone https://github.com/3mmanu3lmois3s/aws-contract-analyzer.git
cd aws-contract-analyzer
chmod +x setup.sh
./setup.sh
```

## Ejecutar local
```bash
npm run dev
cd backend && python api.py
```
EOF

# Setup package.json
npx json -I -f package.json -e "this.homepage='https://3mmanu3lmois3s.github.io/aws-contract-analyzer'"
npx json -I -f package.json -e "this.scripts['predeploy']='npm run build'"
npx json -I -f package.json -e "this.scripts['deploy']='gh-pages -d dist'"

# Instalar dependencias
npm install
npm install -D react react-dom vite @vitejs/plugin-react @tailwindcss/vite gh-pages json

# Mensaje final
echo -e "\n✅ Proyecto listo. Ejecuta:\n  npm run dev\n  cd backend && python api.py\n  npm run deploy (para publicar en GitHub Pages)"
