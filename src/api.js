import axios from 'axios';

export const analyzeContract = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post('/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
