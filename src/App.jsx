import React, { useState } from 'react';
import AwsFlow from './components/AwsFlow';
import UploadForm from './components/UploadForm';
import ResultsDashboard from './components/ResultsDashboard';
import './index.css';
import { analyzeContract } from './api'; // 👈 importa tu lógica

function App() {
  const [result, setResult] = useState(null);

  const handleAnalyze = async (file) => {
    try {
      const result = await analyzeContract(file); // 👈 usa tu función reutilizable
      setResult(result);
    } catch (err) {
      alert('Error al analizar el contrato.');
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen gap-10 p-6 bg-gray-100">
      <h1 className="text-3xl font-bold text-blue-700">AWS Contract Analyzer 💼</h1>
      <AwsFlow />
      <UploadForm onAnalyze={handleAnalyze} />
      <ResultsDashboard result={result} />
    </div>
  );
}

export default App;
