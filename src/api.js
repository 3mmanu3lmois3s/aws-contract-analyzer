const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname.startsWith("127.");

const BASE_API_URL = isLocal
  ? "http://localhost:5000"
  : "http://localhost:5000"; // <-- apuntando al local para demo

// (warning en consola si no estás en local)
if (!isLocal) {
  console.warn(
    "Estás accediendo desde producción, pero el backend es local. Asegúrate de tener Flask corriendo en tu máquina."
  );
}

export async function analyzeContract(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_API_URL}/analyze`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  // ⚠️ Si la respuesta fue generada por el Service Worker (offline)
  const contentType = response.headers.get("Content-Type");
  if (contentType && contentType.includes("application/json")) {
    const data = await response.json();
    if (data?.pending) {
      console.warn("[API] Modo offline: archivo guardado en espera");
    }
    return data;
  }

  // ⚠️ Si es error real del servidor Flask
  const errorText = await response.text();
  throw new Error(`Error al analizar contrato: ${errorText}`);
}