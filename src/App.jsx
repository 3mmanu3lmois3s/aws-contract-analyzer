import React, { useState, useMemo, useEffect } from "react";
import AwsFlow from "./components/AwsFlow"; // Asegúrate que la ruta sea correcta
import ChatBubble from "./components/ChatBubble"; // Asegúrate de importar correctamente
import "./index.css"; // Asegúrate que solo tenga @tailwind directivas
import { analyzeContract, extractTextFromPDFBlob } from "./api";
import { useDarkMode } from "./hooks/useDarkMode";
// --- Importar Heroicons ---
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ClockIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ScaleIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  NoSymbolIcon,
  PaperClipIcon,
  MoonIcon,
  SunIcon,
  // Iconos para los pasos de AWS (ejemplos)
  ServerIcon, // Lambda
  CircleStackIcon, // DynamoDB
  CloudArrowUpIcon, // S3 Upload
  RectangleGroupIcon, // API Gateway
  XMarkIcon, // Icono para cerrar modal
} from "@heroicons/react/24/outline";

// --- Componente Spinner ---
const LoadingSpinner = () => (
  <svg
    className="w-5 h-5 mr-3 -ml-1 text-white animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// --- Datos para las Explicaciones ---
const processSteps = [
  {
    id: "s3",
    name: "S3 (Upload)",
    icon: CloudArrowUpIcon,
    description:
      "El contrato seleccionado se carga de forma segura en un bucket de Amazon S3, listo para el procesamiento.",
  },
  {
    id: "apigw",
    name: "API Gateway",
    icon: RectangleGroupIcon,
    description:
      "Actúa como puerta de entrada, recibiendo la solicitud de análisis y activando la función Lambda correspondiente.",
  },
  {
    id: "lambda",
    name: "Lambda (Análisis)",
    icon: ServerIcon,
    description:
      "Una función serverless procesa el contrato, extrayendo información clave y aplicando lógica de negocio o IA para el análisis.",
  },
  {
    id: "dynamodb",
    name: "DynamoDB (Resultados)",
    icon: CircleStackIcon,
    description:
      "Los resultados del análisis (tipo, riesgo, duración, etc.) se almacenan de forma persistente en una tabla NoSQL para consulta rápida.",
  },
];

const SERVER_CHECK_INTERVAL = 3000;

const ServerStatusIndicator = ({ status }) => {
  const color = status === "online" ? "bg-green-500" : "bg-red-500";
  return <div className={`w-3 h-3 rounded-full shadow-md ${color}`} title={`Servidor Flask ${status}`} />;
};

// --- Componente Principal App ---
function App() {
  const [serverStatus, setServerStatus] = useState("unknown");
  const [result, setResult] = useState(null);
  const [logMessages, setLogMessages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false); // <-- AÑADIR ESTA LÍNEA
  const [activeNode, setActiveNode] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showDevOverlay, setShowDevOverlay] = useState(false);
  const [pendingPDFName, setPendingPDFName] = useState(null);
  useDarkMode(darkMode);
  // --- Lógica ---
  const logStep = (msg, type = "info") => {
    setLogMessages((prev) => [
      ...prev,
      { msg, type, time: new Date().toLocaleTimeString() },
    ]);
  };

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch("http://localhost:5000/healthcheck");
        if (response.ok) {
          setServerStatus("online");
        } else {
          setServerStatus("offline");
        }
      } catch {
        setServerStatus("offline");
      }
    };
    checkServer();
    const interval = setInterval(checkServer, SERVER_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      const channel = new MessageChannel();
      channel.port1.onmessage = async (event) => {
        const response = event.data;
        if (response?.fileData && response?.meta) {
          const blob = new Blob([response.fileData], {
            type: response.meta.type || "application/pdf",
          });
          try {
            const text = await extractTextFromPDFBlob(blob);
            console.log("[APP][OFFLINE PDF TEXT]:\n", text);
          } catch (err) {
            console.error("[APP][OFFLINE PDF ERROR]", err);
          }
        }
      };
      navigator.serviceWorker.controller.postMessage("GET_PENDING_PDF", [channel.port2]);
    }
  }, []);


  // Verificación de IndexedDB
  useEffect(() => {
    const checkPendingAtStart = () => {
      if ("serviceWorker" in navigator) {
        // Esperamos a que el Service Worker esté activo
        navigator.serviceWorker.ready.then((registration) => {
          if (!navigator.serviceWorker.controller) {
            console.warn("❌ SW controller no está disponible todavía.");
            return;
          }
  
          const channel = new MessageChannel();
          channel.port1.onmessage = (event) => {
            const response = event.data;
            console.log("[App] Respuesta del SW (inicio):", response);
  
            if (response?.meta?.name) {
              setPendingPDFName(response.meta.name);
              logStep(`📥 Archivo pendiente detectado al iniciar: ${response.meta.name}`, "warning");
            } else {
              console.log("✅ No hay archivo pendiente al iniciar.");
            }
          };
  
          navigator.serviceWorker.controller.postMessage("GET_PENDING_PDF", [channel.port2]);
        });
      }
    };
  
    checkPendingAtStart();
  }, []);
  


  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setLogMessages([]);
      setError(null);
      logStep(`Archivo seleccionado: ${file.name}`);
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo supera los 5MB.");
      return;
    }
  };
  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    const initialLog = `Archivo seleccionado: ${selectedFile.name}`;
    setLogMessages([
      { msg: initialLog, type: "info", time: new Date().toLocaleTimeString() },
    ]);
    try {
      setActiveNode("1");
      setTimeout(() => setActiveNode("2"), 700);
      setTimeout(() => setActiveNode("3"), 1300);
      setTimeout(() => setActiveNode("4"), 1900);
      setTimeout(() => setActiveNode(null), 3000);

      logStep("🚀 Enviando a API Gateway...", "info");
      const formData = new FormData();
      formData.append("file", selectedFile);
      logStep("⚙️ Procesando en Lambda...", "info");
      const data = await analyzeContract(selectedFile);
      if (data?.pending) {
        setPendingPDFName(selectedFile.name);
        logStep("📂 El backend Flask no está disponible. El archivo se guardó para reenviarse luego.", "warning");
        return; // 🚫 Salimos para no intentar setear resultado
      }

      setResult(data);
      logStep("✅ Análisis completado", "success");
    } catch (err) {
      console.error("Error:", err);
      if (err.message.includes("almacenado localmente")) {
        logStep("📥 El backend está offline. El PDF se ha guardado para procesarse más tarde.", "warning");
      } else {
        const errorMsg = `❌ Error en el análisis: ${err.message}`;
        logStep(errorMsg, "error");
      }
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


// PDF en modo offline
const onRetryPending = async () => {
  logStep("📦 Recuperando archivo pendiente desde IndexedDB...");
  setIsLoading(true);
  setResult(null);
  setError(null);
  setLogMessages([]);

  try {
    const file = await getPendingFileFromIndexedDB();

    if (!file) {
      logStep("❌ No se encontró archivo pendiente", "error");
      setIsLoading(false);
      return;
    }

    logStep(`📄 Reintentando análisis de: ${file.name}`);

    const data = await analyzeContract(file);

    if (data?.pending) {
      logStep("📂 El backend sigue offline. El PDF se mantiene en espera.", "warning");
      return; // ❌ NO limpiamos ni seteamos nada si sigue caído
    }
    
    logStep("✅ Análisis completado tras reintento", "success");
    setResult(data);
    
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage("CLEAR_PENDING_PDF");
    }
    setPendingPDFName(null);
  } catch (err) {
    logStep(`❌ Error al reintentar: ${err.message}`, "error");
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};


async function getPendingFileFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("offline-pdf-db", 1);

    request.onerror = () => reject("No se pudo abrir IndexedDB");

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("pendingUploads", "readonly");
      const store = tx.objectStore("pendingUploads");
      const getReq = store.get("pending");

      getReq.onsuccess = () => {
        const result = getReq.result;
        if (!result || !result.file) {
          return resolve(null);
        }

        const file = result.file;
        resolve(
          new File([file], file.name, {
            type: file.type,
            lastModified: file.lastModified,
          })
        );
      };

      getReq.onerror = () => reject("Error al obtener el archivo");
    };
  });
}




  // --- Componente Modal Informativo ---
  const InfoModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    // Efecto para cerrar con tecla Esc
    useEffect(() => {
      const handleEsc = (event) => {
        if (event.keyCode === 27) {
          // 27 es el código de la tecla Esc
          onClose();
        }
      };
      window.addEventListener("keydown", handleEsc);
      // Limpieza al desmontar
      return () => {
        window.removeEventListener("keydown", handleEsc);
      };
    }, [onClose]);




    //const [pendingPDFName, setPendingPDFName] = useState(null);

    useEffect(() => {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          if (event.data?.file?.name) {
            setPendingPDFName(event.data.file.name);
            logStep(`📥 Archivo en espera: ${event.data.file.name}`, "warning");
          }
        };
        navigator.serviceWorker.controller.postMessage("GET_PENDING_PDF", [channel.port2]);
      }
    }, []);


    return (
      // Overlay oscuro semitransparente
      <div
        className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Contenedor del Modal (evita cierre al hacer clic dentro) */}
        <div
          className="relative w-full max-w-2xl p-6 mx-auto bg-white rounded-lg shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón de Cerrar (X) */}
          <button
            onClick={onClose}
            className="absolute transition-colors top-3 right-3 text-slate-400 hover:text-slate-600"
            aria-label="Cerrar modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {/* Contenido del Modal */}
          <h3 className="mb-4 text-xl font-semibold text-slate-800 dark:text-white">
            Acerca de esta Simulación
          </h3>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p>
              Esta aplicación es una **simulación educativa** diseñada para
              demostrar un flujo de procesamiento de documentos en la nube
              utilizando tecnologías comunes.
            </p>
            <p>
              **Tecnologías Simuladas:**
              <ul className="pl-5 mt-1 space-y-1 list-disc">
                <li>
                  **Frontend:** React, Vite, Tailwind CSS, React Flow, Heroicons
                </li>
                <li>**Backend (Simulado):** Python, Flask</li>
                <li>
                  **Funcionamiento:** Recuerda ejecutar el servidor Flask
                  (api.py) en el puerto 5000 para simular la API en la misma
                  maquina donde abras la url
                  https://3mmanu3lmois3s.github.io/aws-contract-analyzer/
                </li>
                <li>
                  **Flujo AWS (Simulado):** S3 (para carga), API Gateway (como
                  disparador), Lambda (para procesamiento), DynamoDB (para
                  resultados).
                </li>
              </ul>
            </p>
            <p className="pt-2 font-semibold text-red-600">
              ⚠️ **Importante:** Esta demo NO se conecta a servicios reales de
              AWS. Todo el procesamiento ocurre localmente o es simulado con
              fines demostrativos y educativos (el contrato no se analiza con
              NLP ni AI, de momento da una respuesta mockeada).
            </p>
            <p className="pt-3 mt-4 text-xs text-right border-t text-slate-500 border-slate-200">
              Autor: Ing. Emmanuel Mellado
            </p>
          </div>
        </div>
      </div>
    );
  };

  // --- Sub-Componentes de UI (Definidos dentro de App para simplicidad) ---

  const ResultsDisplay = ({ result }) => {
    if (!result) return null;
    const getRiskBadgeStyle = (risk) => {
      const lowerRisk = risk?.toLowerCase();
      if (lowerRisk === "bajo")
        return "bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20";
      if (lowerRisk === "moderado")
        return "bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-600/20";
      if (lowerRisk === "alto")
        return "bg-red-100 text-red-700 ring-1 ring-inset ring-red-600/10";
      return "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10";
    };
    const renderItem = (IconComponent, label, value) => (
      <div className="flex items-start py-2.5 space-x-3 border-b border-slate-100 last:border-b-0">
        <IconComponent
          className="flex-shrink-0 w-5 h-5 text-slate-400 mt-0.5"
          aria-hidden="true"
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="text-sm text-slate-800 dark:text-slate-200">
            {value || "N/A"}
          </p>
        </div>
      </div>
    );
    const renderBadgeItem = (IconComponent, label, value, badgeStyle) => (
      <div className="flex items-start py-2.5 space-x-3 border-b border-slate-100 last:border-b-0">
        <IconComponent
          className="flex-shrink-0 w-5 h-5 text-slate-400 mt-0.5"
          aria-hidden="true"
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <span
            className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${badgeStyle}`}
          >
            {value || "N/A"}
          </span>
        </div>
      </div>
    );
    return (
      <div className="mt-6 overflow-hidden bg-white border rounded-lg shadow-md dark:bg-slate-800 border-slate-200 dark:border-slate-600">
        <h3 className="px-5 py-3 text-lg font-semibold border-b bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-white border-slate-200 dark:border-slate-600">
          Resultado del Análisis
        </h3>
        <div className="px-5 py-4 space-y-1">
        {result.filename && renderItem(PaperClipIcon, "Archivo", result.filename)}
{result.type && renderItem(DocumentTextIcon, "Tipo Contrato", result.type)}
{result.duration && result.duration !== "N/A" && renderItem(CalendarDaysIcon, "Duración", result.duration)}

{result.compliance && result.compliance !== "N/A" &&
  renderItem(
    result.compliance?.includes("Cumple") ? ShieldCheckIcon : ShieldExclamationIcon,
    "Cumplimiento",
    result.compliance
  )
}

{result.recommendation && renderItem(
  result.recommendation?.includes("Apto") ? CheckBadgeIcon : NoSymbolIcon,
  "Recomendación",
  result.recommendation
)}

{result.amount && result.amount !== "N/A" && result.amount !== "No aplica" &&
  renderItem(ScaleIcon, "Monto", result.amount)}

{result.monthly_payment && result.monthly_payment !== "N/A" &&
  renderItem(CalendarDaysIcon, "Pago mensual", result.monthly_payment)}

{result.deposit && result.deposit !== "N/A" && result.deposit !== "No aplica" &&
  renderItem(ShieldExclamationIcon, "Depósito o garantía", result.deposit)}

{result.sale_item && result.sale_item !== "N/A" && result.sale_item !== "No aplica" &&
  renderItem(DocumentTextIcon, "Objeto vendido", result.sale_item)}

{result.objeto_venta && result.objeto_venta !== "N/A" && result.objeto_venta !== "No especificado" &&
  renderItem(DocumentTextIcon, "Objeto de la venta", result.objeto_venta)}

{result.risk && result.risk !== "N/A" &&
  renderBadgeItem(ScaleIcon, "Nivel de Riesgo", result.risk, getRiskBadgeStyle(result.risk))}
        </div>
      </div>
    );
  };
  
  const StyledUploadForm = ({
    onFileChange,
    onAnalyze,
    selectedFile,
    isLoading,
    pendingPDFName,
  }) => {  
    return ( 
      <div className="p-6 mb-6 bg-white border rounded-lg shadow-md dark:bg-slate-800 border-slate-200 dark:border-slate-600">
        <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">
          1. Cargar Contrato (PDF)
        </h3>

        {pendingPDFName && (
  <div className="p-4 mb-4 text-yellow-800 border border-yellow-300 rounded bg-yellow-50 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700">
    <strong>Hay una solicitud pendiente:</strong> el archivo <em>{pendingPDFName}</em> está en espera porque el servidor Flask estaba apagado.  
    <br />Por favor, comunícate con el administrador y vuelve a intentar más tarde.
  </div>
)}


        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          <label
            className={`relative cursor-pointer inline-flex items-center justify-center px-5 py-2 border rounded-md shadow-sm text-sm font-medium focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 transition duration-150 ease-in-out ${
              isLoading
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ArrowUpTrayIcon
              className={`-ml-1 mr-2 h-5 w-5 ${
                isLoading ? "text-slate-400" : "text-slate-500"
              }`}
              aria-hidden="true"
            />
            <span>
              {selectedFile ? "Cambiar archivo" : "Seleccionar archivo"}
            </span>
            <input
              type="file"
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf"
              onChange={onFileChange}
              disabled={isLoading}
            />
          </label>
          {selectedFile && (
            <span
              className="flex-1 min-w-0 text-sm truncate text-slate-600"
              title={selectedFile.name}
            >
              {selectedFile.name}
            </span>
          )}
        </div>
        {selectedFile && ( // Botón Analizar Contrato
          <button
            type="button"
            onClick={onAnalyze}
            disabled={isLoading || !!pendingPDFName}
            // --- Usando colores GRIS (slate) / blanco ---
            className={`mt-4 w-full inline-flex justify-center items-center px-6 py-2.5 border border-transparent text-base font-semibold rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition duration-150 ease-in-out ${
              isLoading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-slate-300 hover:bg-slate-400"
            }`} // <-- Fondo GRIS OSCURO (SLATE), Texto BLANCO
          >
            {isLoading ? (
              <>
                <LoadingSpinner /> Analizando...
              </>
            ) : (
              "Analizar Contrato"
            )}
          </button>




        )}

{pendingPDFName && (
  <button
    type="button"
    onClick={onRetryPending}
    className="mt-2 w-full inline-flex justify-center items-center px-6 py-2.5 border border-indigo-600 text-indigo-700 bg-white hover:bg-indigo-50 font-semibold rounded-md shadow-sm transition duration-150 ease-in-out"
  >
    🔄 Reintentar análisis de: {pendingPDFName}
  </button>
)}

      </div>
    );
  };

  const LogDisplay = ({ logMessages }) => {
    if (logMessages.length === 0) return null;

    return (
      <div className="flex flex-col items-start mt-6 space-y-2">
        {logMessages.map((log, index) => (
          <ChatBubble
            key={index}
            message={log.msg}
            type={log.type}
            time={log.time}
          />
        ))}
      </div>
    );
  };

  const ProcessExplanation = ({ steps }) => (
    <div className="mb-8 space-y-4">
      <h3 className="text-lg font-semibold text-slate-800">¿Cómo funciona?</h3>
      {steps.map((step) => (
        <div
          key={step.id}
          className="flex items-start p-4 space-x-4 transition duration-150 ease-in-out bg-white border rounded-lg shadow-sm border-slate-200 hover:shadow-lg hover:border-primary-300"
        >
          <step.icon
            className="flex-shrink-0 w-8 h-8 mt-1 text-primary-600"
            aria-hidden="true"
          />{" "}
          {/* Mantenemos iconos azules aquí */}
          <div>
            <h4 className="text-base font-semibold text-slate-700">
              {step.name}
            </h4>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  // --- Renderizado Principal (AJUSTADO) ---
  return (
    
    // Añadido 'relative' para posicionar el botón de info
    <div className="relative flex w-screen h-screen overflow-hidden font-sans bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800">


{/* === Grupo de botones con semáforo === */}
<div className="absolute z-10 flex items-center space-x-3 top-4 right-4">
  <ServerStatusIndicator status={serverStatus} />

  <a
    href="https://github.com/3mmanu3lmois3s/aws-contract-analyzer/releases/download/v3.0.0/contract-api.exe"
    download
    title="Descargar ejecutable para Windows"
    className="p-2 text-white transition-all bg-green-600 rounded-full shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400"
  >
    💾
  </a>

  <button
    onClick={() => setShowDevOverlay(!showDevOverlay)}
    className="p-2 text-white transition-all bg-indigo-600 rounded-full shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
    aria-label="DevTools"
  >
    🛠️
  </button>

  <button
    onClick={() => setDarkMode(!darkMode)}
    className="p-2 transition-all bg-white rounded-full shadow-md text-slate-500 dark:bg-gray-700 hover:bg-slate-100 hover:dark:bg-gray-600 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
    aria-label="Alternar modo oscuro"
  >
    {darkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
  </button>

  <button
    onClick={() => setIsInfoModalOpen(true)}
    className="p-2 transition-all bg-white rounded-full shadow-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
    aria-label="Mostrar información"
  >
    <InformationCircleIcon className="w-6 h-6" />
  </button>
</div>




      {/* === Columna Izquierda (Sin cambios internos) === */}
      <div className="flex flex-col w-1/2 h-full p-6 pr-3 overflow-y-auto">
        <h1 className="flex-shrink-0 mb-6 text-2xl font-bold text-slate-900 dark:text-white">
          AWS Contract Analyzer 💼
        </h1>
        <div className="flex-shrink-0">
          {/* Renderiza tu componente de formulario (asumiendo que ya lo tienes definido arriba) */}
          <StyledUploadForm
            onFileChange={handleFileChange}
            onAnalyze={handleAnalyze}
            onRetryPending={onRetryPending}
            selectedFile={selectedFile}
            isLoading={isLoading}
            pendingPDFName={pendingPDFName}
          />
        </div>
        <div className="flex flex-col flex-grow mt-6 overflow-hidden bg-white border rounded-lg shadow-md dark:bg-slate-800 border-slate-200 dark:border-slate-600">
          <h3 className="flex-shrink-0 px-5 py-3 text-lg font-semibold border-b bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-white border-slate-200 dark:border-slate-600">
            Arquitectura del Proceso
          </h3>
          <div className="flex-grow min-h-0 p-1 bg-slate-50">
            {/* >>> IMPORTANTE: Estilizar los nodos DENTRO de AwsFlow.jsx <<< */}
            <AwsFlow activeNodeId={activeNode} />;
          </div>
        </div>
      </div>
      {/* === Columna Derecha (Sin cambios internos, excepto título ajustado) === */}
      <div className="w-1/2 h-full p-6 pl-3 overflow-y-auto border-l border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
        {/* Ajustado padding top para dejar espacio al botón de info en pantallas pequeñas */}
        <h2 className="pt-8 mb-6 text-xl font-semibold text-slate-900 dark:text-white lg:pt-0">
          🔍 Detalles y Seguimiento
        </h2>
        {/* Renderiza tus componentes de la columna derecha (asumiendo que ya los tienes definidos arriba) */}
        <ProcessExplanation steps={processSteps} />
        <LogDisplay logMessages={logMessages} />
        {!isLoading && result && <ResultsDisplay result={result} />}
        {error && !isLoading && (
          <div className="p-4 mt-6 text-sm border border-red-200 rounded-md bg-red-50 dark:bg-red-900 dark:border-red-500">
            <div className="flex items-center">
              <ExclamationCircleIcon className="flex-shrink-0 w-5 h-5 mr-2 text-red-500" />
              <p className="font-medium text-red-700 dark:text-red-200">
                Error en el análisis:{" "}
                <span className="font-normal">{error}</span>
              </p>
            </div>
          </div>
        )}
        {logMessages.length === 0 && !result && !isLoading && !error && (
          <div className="p-6 mt-6 text-sm text-center border border-dashed rounded-md bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-300">
            Sube un contrato PDF para iniciar el análisis y ver el seguimiento
            aquí.
          </div>
        )}
      </div>
      {/* === Renderizado del Modal (AÑADIDO al final, dentro del div principal) === */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
      {/* === Fin Renderizado del Modal === */}
      {showDevOverlay && (
        <div className="absolute inset-0 z-40 p-6 space-y-4 overflow-y-auto text-sm text-white bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="max-w-xl p-4 mx-auto bg-gray-800 rounded shadow-lg">
            <h2 className="mb-2 text-lg font-bold">🔍 DevTools Overlay</h2>
            <ul className="pl-5 space-y-2 list-disc">
              <li>
                <strong>Frontend:</strong> React + Vite + Tailwind CSS
              </li>
              <li>
                <strong>Icons:</strong> Heroicons
              </li>
              <li>
                <strong>API (Mock):</strong> Python Flask (en local)
              </li>
              <li>
                <strong>Comunicación:</strong> React → fetch → Flask API (Puerto
                5000)
              </li>
              <li>
                <strong>Simulación:</strong> AWS: S3, API Gateway, Lambda,
                DynamoDB
              </li>
              <li>
                <strong>Visualización:</strong> React Flow para mostrar el flujo
                de arquitectura
              </li>
              <li>
                <strong>Modo Oscuro:</strong> Tailwind + toggle manual con
                `useDarkMode`
              </li>
              <li>
                <strong>Nota:</strong> Todo corre localmente, sin conexión real
                a AWS
              </li>
            </ul>
            <button
              onClick={() => setShowDevOverlay(false)}
              className="px-4 py-2 mt-4 text-white bg-indigo-600 rounded hover:bg-indigo-700"
            >
              Cerrar
            </button>

          </div>
        </div>
      )}
    </div> // Cierre del div principal
  ); // Cierre del return
}

export default App;
