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
