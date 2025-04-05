#!/bin/bash

echo "============================================="
echo " AWS Contract Analyzer Setup (Vite + Flask API + Tailwind + ReactFlow)"
echo "============================================="

# Crear carpetas necesarias
mkdir -p src/components backend

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

# Crear postcss.config.js (versión funcional)
cat <<EOF > postcss.config.js
import tailwind from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [tailwind, autoprefixer],
};
EOF

# Actualizar package.json para despliegue
npx json -I -f package.json -e "this.homepage='https://3mmanu3lmois3s.github.io/aws-contract-analyzer'"
npx json -I -f package.json -e "this.scripts['predeploy']='npm run build'"
npx json -I -f package.json -e "this.scripts['deploy']='gh-pages -d dist'"

# Crear archivo src/api.js
cat <<'EOF' > src/api.js
const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname.startsWith('127.') ||
  window.location.hostname.endsWith('.github.io');

const BASE_API_URL = isLocal
  ? 'http://localhost:5000'
  : 'http://localhost:5000';

export async function analyzeContract(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_API_URL}/analyze`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error al analizar contrato: ${errText}`);
  }

  return await response.json();
}
EOF

# Crear archivo backend/api.py
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

# Crear archivo src/index.css
cat <<EOF > src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# Crear README.md
cat <<EOF > README.md
# AWS Contract Analyzer

Demo profesional que simula una arquitectura **AWS Serverless** con:
- Frontend: **Vite + React + Tailwind + React Flow**
- Backend simulado: **API Flask local**

## ⚙️ Requisitos previos
- Node.js >= 18
- Python >= 3.10
- Git Bash (o terminal compatible con bash)

## 🧰 Tecnologías utilizadas
| Herramienta | Rol |
|------------|-----|
| React + Vite | Frontend moderno |
| Tailwind CSS | Estilos UI |
| ReactFlow | Diagrama visual AWS |
| Flask + Flask-CORS | Simulación API análisis |
| GitHub Pages | Despliegue estático frontend |

## 🚀 Instalación rápida
```bash
git clone https://github.com/3mmanu3lmois3s/aws-contract-analyzer.git
cd aws-contract-analyzer
chmod +x setup.sh
./setup.sh
npm run dev
```

## 🌐 Despliegue en GitHub Pages
```bash
npm run deploy
```
Verás el frontend en:
[https://3mmanu3lmois3s.github.io/aws-contract-analyzer](https://3mmanu3lmois3s.github.io/aws-contract-analyzer)

⚠️ **Importante**: La API Flask debe estar corriendo localmente en `http://localhost:5000` para que el análisis funcione.

```bash
cd backend
python api.py
```

## 📄 Licencia
MIT © 2025 Emmanuel Moisés Mellado Martínez
EOF

# Instalar dependencias necesarias
echo "\n📦 Instalando dependencias necesarias..."
npm install
npm install -D tailwindcss postcss autoprefixer gh-pages json

# Mensaje final
echo "\n✅ Todo listo. Ejecuta ahora:"
echo "---------------------------------------------"
echo "  npm run dev     # para desarrollo local"
echo "  npm run deploy  # para publicar en GitHub Pages"
echo "  cd backend && python api.py  # para levantar el backend"
echo "---------------------------------------------"
