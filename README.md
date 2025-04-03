# AWS Contract Analyzer

Una demo profesional de arquitectura serverless simulada, creada con **Vite + React + TailwindCSS + ReactFlow**, lista para usar como prueba de concepto en presentaciones técnicas y entrevistas.

---

## 🚀 Objetivo

Simular un flujo de procesamiento de contratos PDF en una arquitectura estilo **AWS Serverless**, donde el frontend se ejecuta en GitHub Pages y el backend en una API Flask local. El objetivo es demostrar un flujo completo de análisis de contratos, destacando el uso de componentes que imitan servicios como S3, API Gateway, Lambda y DynamoDB.

---

## 🧱 Arquitectura de la demo

```mermaid
graph TD
    A[📁 Subida del Contrato (Simula S3)] --> B[🧩 API Gateway (Proxy en Vite)]
    B --> C[⚙️ Lambda (Análisis con Flask)]
    C --> D[🗃️ DynamoDB (Resultados simulados)]
```

El frontend también muestra este flujo mediante un diagrama interactivo con `ReactFlow`.

---

## ⚙️ Requisitos previos

- Node.js ≥ 18
- Git
- Acceso a terminal bash compatible (`Git Bash`, `WSL`, `Linux`, etc.)

---

## 🧰 Tecnologías utilizadas

| Herramienta    | Rol en la demo                  |
| -------------- | ------------------------------- |
| Vite           | Bundler para frontend React     |
| React          | Framework de UI                 |
| Tailwind CSS   | Estilos modernos y responsivos  |
| ReactFlow      | Visualización del flujo AWS     |
| Axios          | Comunicación HTTP con Flask     |
| Flask (Python) | Simulación de Lambda/API        |
| gh-pages       | Despliegue a GitHub Pages       |

---

## 📦 Instalación rápida

```bash
git clone https://github.com/3mmanu3lmois3s/aws-contract-analyzer.git
cd aws-contract-analyzer
chmod +x setup.sh
./setup.sh
npm run dev  # o npm run deploy para publicar
```

> ℹ️ Todo se genera automáticamente: estructura, configuración, dependencias y archivos base.

---

## 🌐 Despliegue en GitHub Pages

El `setup.sh` incluye:
- Configuración `vite.config.js` con proxy
- Scripts de `predeploy` y `deploy` en `package.json`
- Instalación de `gh-pages`

Despliegue:
```bash
npm run deploy
```

Sitio accesible en:
```
https://3mmanu3lmois3s.github.io/aws-contract-analyzer
```

---

## 🔁 Backend Flask local

Asegúrate de tener una API corriendo en `http://localhost:5000`. El frontend hará peticiones automáticamente allí vía proxy Vite:

```js
// vite.config.js
server: {
  proxy: {
    '/analyze': 'http://localhost:5000'
  }
}
```

---

## ✅ Estado actual

- [x] Frontend React funcional
- [x] Diagrama AWS con React Flow
- [x] Tailwind + Axios + Proxy configurado
- [x] Setup automatizado con `setup.sh`
- [x] Preparado para GitHub Pages
- [ ] API Flask con lógica de análisis real (pendiente)

---

## 👤 Autor

**Emmanuel Moisés Mellado Martínez**  
[GitHub](https://github.com/3mmanu3lmois3s)

---

## 📄 Licencia

MIT © 2025 - Emmanuel Moisés Mellado Martínez

