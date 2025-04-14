import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname.startsWith("127.");

const BASE_API_URL = isLocal
  ? "http://localhost:5000"
  : "http://localhost:5000";

if (!isLocal) {
  console.warn(
    "Estás accediendo desde producción, pero el backend es local. Asegúrate de tener Flask corriendo en tu máquina."
  );
}

export async function analyzeContract(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${BASE_API_URL}/analyze`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const contentType = response.headers.get("Content-Type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();

      if (data?.pending) {
        console.warn("[API] Modo offline: archivo guardado en espera");

        const text = await extractTextFromPDFBlob(file);
        console.log("[CLIENTE] Texto extraído del PDF offline:\n", text);
      }

      return data;
    }

    const errorText = await response.text();
    throw new Error(`Error al analizar contrato: ${errorText}`);
  } catch (err) {
    console.error("[CLIENTE] Error al extraer texto del PDF offline:", err);
    throw err;
  }
}

export async function extractTextFromPDFBlob(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item) => item.str).join(" ");
      fullText += `\n[Página ${i}]: ${text}`;
    }

    return fullText.trim();
  } catch (error) {
    console.error("[extractTextFromPDFBlob] ❌ Error extrayendo texto:", error);
    return null;
  }
}
