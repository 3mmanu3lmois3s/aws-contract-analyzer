import React, { useRef } from 'react';

function UploadForm({ onAnalyze }) {
  const fileInputRef = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    const file = fileInputRef.current.files[0];
    if (file) {
      onAnalyze(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
      <label className="font-semibold text-lg">Subir Contrato (PDF):</label>
      <input type="file" ref={fileInputRef} accept="application/pdf" className="border p-2" />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Analizar</button>
      <p className="text-sm text-gray-600">📦 Esto simula S3 + API Gateway + Lambda</p>
    </form>
  );
}

export default UploadForm;
