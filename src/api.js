// src/api.js

const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname.includes('127.0.0.1') ||
  window.location.hostname.includes('github.io');

const BASE_API_URL = isLocal ? 'http://localhost:5000' : ''; // Esto permite que desde GitHub Pages el navegador use tu localhost

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
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error al analizar contrato: ${errText}`);
  }

  return await response.json();
}
