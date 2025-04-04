// src/api.js

const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname.startsWith('127.') ||
  window.location.hostname.endsWith('.github.io'); // más general por si usas subdominios

const BASE_API_URL = isLocal
  ? 'http://localhost:5000'
  : 'http://localhost:5000'; // Siempre apuntamos al backend local

/**
 * Envía el contrato al backend Flask para su análisis.
 * @param {File} file Archivo PDF del contrato.
 * @returns {Promise<Object>} Resultado del análisis simulado.
 */
export async function analyzeContract(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_API_URL}/analyze`, {
    method: 'POST',
    body: formData,
    credentials: 'include', // recomendado si en el futuro agregas auth
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error al analizar contrato: ${errText}`);
  }

  return await response.json();
}
