import React from 'react';

const ResultsDashboard = ({ result }) => {
  if (!result) return null;

  return (
    <div className="bg-green-100 p-4 rounded shadow w-full max-w-lg">
      <h2 className="text-xl font-bold text-green-700 mb-2">Resultado del Análisis 📊</h2>
      <p><strong>Archivo:</strong> {result.filename}</p>
      <p><strong>Resumen:</strong> {result.summary}</p>
      <p><strong>Palabras clave:</strong> {result.keywords.join(', ')}</p>
      <p><strong>Confianza:</strong> {result.confidence}</p>
      <p className="text-xs text-gray-500 mt-2">📁 Esto simula DynamoDB</p>
    </div>
  );
};

export default ResultsDashboard;
