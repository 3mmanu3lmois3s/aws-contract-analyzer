from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import spacy
from langdetect import detect
import fitz

from analysis_utils import (
    extract_text_from_pdf,
    smart_contract_type,
    extract_with_patterns,
    extract_amount,
    extract_monthly_payment,
    extract_deposit,
    extract_sale_item,
    extract_object,
    detect_compliance
)

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:5173",
    "http://localhost:5000",
    "https://3mmanu3lmois3s.github.io"
], supports_credentials=True, send_wildcard=False)

@app.after_request
def apply_cors_headers(response):
    origin = request.headers.get("Origin")
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:5000",
        "https://3mmanu3lmois3s.github.io"
    ]
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    if request.method == 'OPTIONS':
        response.status_code = 204
    return response

print("Cargando modelos NLP...")
try:
    NLP_MODELS = {
        "en": spacy.load("en_core_web_sm"),
        "es": spacy.load("es_core_news_sm"),
    }
    print("Modelos NLP cargados correctamente.")
    MODELS_LOADED = True
except Exception as e:
    print(f"ERROR FATAL: No se pudieron cargar los modelos NLP: {e}")
    MODELS_LOADED = False


def analyze_document_text(text):
    if not MODELS_LOADED:
        raise RuntimeError("Los modelos NLP no están cargados.")
    if not text or text.strip() == "":
        raise ValueError("Texto vacío proporcionado para análisis")

    try:
        lang = detect(text[:1000])
        print(f"Idioma detectado: {lang}")
    except Exception as lang_err:
        print(f"Error al detectar idioma: {lang_err}. Usando 'es' por defecto.")
        lang = "es"

    contract_type = smart_contract_type(text, lang)
    print(f"Tipo de contrato detectado: {contract_type}")

    duration_patterns = [
    r"(?:duraci[oó]n|vigencia|validez|plazo).{0,30}?(\d+\s+(?:meses|años))",
    r"por un per[ií]odo de\s+(\d+\s+(?:meses|años))",
    r"during a period of\s+(\d+\s+(?:months|years))",
]
    duration = extract_with_patterns(text, duration_patterns) or None

    amount = extract_amount(text) or None
    monthly = extract_monthly_payment(text, lang) or None
    compliance = detect_compliance(text, lang)

    is_lease = any(w in contract_type.lower() for w in ["arrendamiento", "lease", "rental"])
    is_sale = any(w in contract_type.lower() for w in ["compra", "venta", "compraventa", "sale", "purchase"])

    deposit = extract_deposit(text, lang, contract_type)
    sale_item = extract_sale_item(text, lang, contract_type)
    print(f"[DEBUG] is_sale={is_sale} | contract_type={contract_type} | sale_item={sale_item}")
    objeto_contrato = extract_object(text, lang)

    recommendation = "⚠️ Revisión necesaria"
    if compliance:
        if is_sale:
            if amount and sale_item:
                recommendation = "✔ Apto para firma"
        elif is_lease:
            if duration and (monthly or amount) and deposit:
                recommendation = "✔ Apto para firma"
        else:
            if duration and (amount or monthly):
                recommendation = "✔ Apto para firma"

    result = {
        "type": contract_type,
        "lang": lang,
        "lang_text": "Español" if lang == "es" else ("Inglés" if lang == "en" else lang),
        "duration": duration,
        "amount": amount if (amount and (is_sale or not is_lease)) else None,
        "monthly_payment": monthly if (monthly and (is_lease or not is_sale)) else None,
        "deposit": deposit if (is_lease and deposit) else None,
        "sale_item": sale_item if (is_sale and sale_item) else None,
        "objeto_venta": objeto_contrato if objeto_contrato else None,
        "compliance_text": (
            "✔ Cumple con RGPD" if lang == "es" and compliance else
            "✔ Compliant with GDPR" if lang == "en" and compliance else
            None
        ),
        "recommendation": recommendation,
        "risk": None
    }
    print(f"Resultado del análisis: {result}")
    return result


@app.route("/analyze", methods=["POST"])
def analyze_contract_route():
    start_time = time.time()
    try:
        if not MODELS_LOADED:
            return jsonify({"error": "Modelos NLP no cargados."}), 503

        if "file" not in request.files:
            return jsonify({"error": "No se encontró archivo PDF."}), 400

        file = request.files["file"]
        filename = file.filename or "uploaded_file.pdf"

        if not filename.lower().endswith(".pdf"):
            return jsonify({"error": "El archivo debe ser un PDF."}), 400

        file_bytes = file.read()
        if not file_bytes:
            return jsonify({"error": "El archivo PDF está vacío."}), 400

        text = extract_text_from_pdf(file_bytes)
        print(f"Texto extraído (200 chars): {text[:200]}...")

        if not text or text.strip() == "":
            return jsonify({"error": "No se pudo extraer texto."}), 400

        analysis_result = analyze_document_text(text)
        analysis_result["filename"] = filename
        analysis_result["processing_time"] = f"{time.time() - start_time:.2f}"

        return jsonify(analysis_result)

    except fitz.fitz.FitxError as fe:
        return jsonify({"error": "Error de PyMuPDF.", "details": str(fe)}), 500
    except ValueError as ve:
        return jsonify({"error": "Texto inválido.", "details": str(ve)}), 400
    except RuntimeError as rt:
        return jsonify({"error": "Error interno del servidor.", "details": str(rt)}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Error inesperado.", "details": str(e)}), 500


@app.route("/healthcheck", methods=["GET"])
def healthcheck():
    if MODELS_LOADED:
        return jsonify({"status": "ok", "models_loaded": True}), 200
    else:
        return jsonify({"status": "error", "models_loaded": False}), 500


if __name__ == "__main__":
    print("Iniciando servidor Flask...")
    app.run(host='0.0.0.0', port=5000, debug=False)
