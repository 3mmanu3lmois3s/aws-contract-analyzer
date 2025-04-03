import React, { useState } from 'react';
import AwsFlow from './components/AwsFlow';
import UploadForm from './components/UploadForm';
import ResultsDashboard from './components/ResultsDashboard';
import { analyzeContract } from './api';

function App() {
  const [result, setResult] = useState(null);

  const handleAnalyze = async (file) => {
    try {
      const data = await analyzeContract(file);
      setResult(data);
    } catch (err) {
      setResult({
        filename: file.name,
        summary: "No se pudo analizar el contrato. Verifica si el servidor Flask está corriendo.",
        keywords: [],
        confidence: "N/A",
        error: true
      });
      console.error("Error al conectarse con el backend:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl mb-10">
        <AwsFlow />
      </div>
      <h1 className="text-3xl font-bold mb-6 text-blue-600">AWS Contract Analyzer 💼</h1>
      <UploadForm onAnalyze={handleAnalyze} />
      <ResultsDashboard result={result} />
    </div>
  );
}

export default App;
