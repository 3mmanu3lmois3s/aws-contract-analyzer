import React, { useState } from 'react';
import AwsFlow from './components/AwsFlow';
import UploadForm from './components/UploadForm';
import ResultsDashboard from './components/ResultsDashboard';
import './index.css';

function App() {
  const [result, setResult] = useState(null);

  const handleAnalyze = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      alert('Error al analizar el contrato.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-6 gap-10">
      <h1 className="text-3xl font-bold text-blue-700">AWS Contract Analyzer 💼</h1>
      <AwsFlow />
      <UploadForm onAnalyze={handleAnalyze} />
      <ResultsDashboard result={result} />
    </div>
  );
}

export default App;
