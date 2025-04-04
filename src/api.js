const isProduction = window.location.hostname.includes("github.io");

const BASE_URL = isProduction
  ? "http://localhost:5000/analyze"
  : "/analyze";

export const analyzeContract = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(BASE_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Error analyzing contract");
  }

  return response.json();
};
