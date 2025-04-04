#!/bin/bash

echo "============================================="
echo " AWS Contract Analyzer Setup (Vite + Tailwind + React + Flow + Flask API Support)"
echo "============================================="

# Crear estructura de carpetas necesarias
mkdir -p src/components

# Crear vite.config.js con configuración de base y proxy para GitHub Pages
cat <<EOF > vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/aws-contract-analyzer/',
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
import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [tailwind, autoprefixer],
};
EOF

# Crear .gitignore con buenas prácticas
cat <<EOF > .gitignore
node_modules
dist
.env
.DS_Store
__pycache__
EOF

# Agregar homepage y scripts de despliegue en package.json
npx json -I -f package.json -e "this.homepage='https://3mmanu3lmois3s.github.io/aws-contract-analyzer'"
npx json -I -f package.json -e "this.scripts['predeploy']='npm run build'"
npx json -I -f package.json -e "this.scripts['deploy']='gh-pages -d dist'"

# Crear HTML base
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

# Crear archivo de estilos Tailwind
cat <<EOF > src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# Crear api.py para backend local con Flask
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

    # Simulación de análisis
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
npm install
npm install -D tailwindcss postcss autoprefixer gh-pages json
npm install axios reactflow

# Mensaje final
cat <<EOF

✅ Todo listo. Ahora puedes:
---------------------------------------------
  npm run dev     # Para desarrollo local
  npm run build   # Para generar /dist
  npm run deploy  # Para publicar en GitHub Pages
---------------------------------------------
✔ Si tienes Python instalado, ejecuta también:
  python api.py   # Para iniciar la API en localhost:5000
EOF
