import React, { useRef } from 'react';

const UploadForm = ({ onAnalyze }) => {
  const fileInputRef = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    const file = fileInputRef.current.files[0];
    if (file) {
      onAnalyze(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-lg">
      <label className="block text-gray-700 text-sm font-bold mb-2">
        Subir Contrato (PDF):
      </label>
      <input
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        className="mb-4 w-full"
      />
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        Analizar
      </button>
      <p className="text-xs text-gray-500 mt-2">📦 Esto simula S3 + API Gateway + Lambda</p>
    </form>
  );
};

export default UploadForm;
