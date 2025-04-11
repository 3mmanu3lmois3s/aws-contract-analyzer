// sw.js - Service Worker con soporte de modo offline (PDF en standby)

const CACHE_NAME = "aws-analyzer-v1";
const DB_NAME = "offline-pdf-db";
const STORE_NAME = "pendingUploads";
const API_ANALYZE_PARTIAL = "/analyze";

// === Helpers de IndexedDB ===
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject("Error al abrir IndexedDB");
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

function storePendingPDF(file) {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({ id: "pending", file });

    req.onsuccess = () => {
      console.log("[SW] Archivo PDF almacenado en IndexedDB.");
      resolve(true);
    };
    req.onerror = (err) => {
      console.error("[SW] Error al guardar el PDF:", err);
      reject(err);
    };
  });
}


async function getPendingPDF() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const req = store.get("pending");
    req.onsuccess = () => {
      console.log("[SW] getPendingPDF → encontrado:", req.result);
      resolve(req.result);
    };
    req.onerror = (e) => {
      console.error("[SW] getPendingPDF → error:", e);
      reject(null);
    };
  });
}


async function clearPendingPDF() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await store.delete("pending");
  return tx.complete;
}

// === Eventos del SW ===
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener("activate", (event) => {
  clients.claim();
});

// Interceptar /analyze POST (en cualquier subruta)
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);
  
    if (url.pathname.endsWith("/analyze") && request.method === "POST") {
      console.log("[SW] Interceptando POST /analyze");
      event.respondWith(handleAnalyzeRequest(request));
    } else {
      // Para debug
      console.log("[SW] Ignorando:", url.pathname);
    }
  });

async function handleAnalyzeRequest(request) {
  try {
    const response = await fetch(request.clone());

    if (response.ok) {
      await clearPendingPDF();
    }

    return response;
  } catch (error) {
    // Extraer el archivo PDF del FormData
    const formData = await request.formData();
    const file = formData.get("file");

    if (file) {
      await storePendingPDF(file);
      console.warn("[SW] Flask está caído. PDF guardado en IndexedDB.");
    }

    return new Response(
      JSON.stringify({
        pending: true,
        message:
          "Servidor Flask offline. El archivo se ha guardado localmente.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Comunicación externa (por ejemplo, desde App.jsx)
self.addEventListener("message", async (event) => {
  if (event.data === "GET_PENDING_PDF") {
    const result = await getPendingPDF();

    if (result && result.file) {
      const fileBlob = result.file;
      const fileData = await fileBlob.arrayBuffer();

      console.log("[SW] Enviando archivo pendiente al cliente:", result.file.name);

      event.ports[0].postMessage({
        fileData,
        meta: {
          name: fileBlob.name || "pendiente.pdf",
          type: fileBlob.type || "application/pdf",
          lastModified: fileBlob.lastModified || Date.now(),
        },
      });
    } else {
      event.ports[0].postMessage(null);
    }
  }

  if (event.data === "CLEAR_PENDING_PDF") {
    await clearPendingPDF();
    console.log("[SW] PDF pendiente eliminado de IndexedDB.");
  }
});


