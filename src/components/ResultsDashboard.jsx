import React from 'react';

function ResultsDashboard({ result }) {
  if (!result) return null;
  return (
    <div className="bg-white p-4 rounded shadow max-w-xl w-full">
      <h2 className="text-xl font-bold mb-2">📊 Resultado del Análisis</h2>
      <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}

export default ResultsDashboard;
