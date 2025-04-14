import fitz  # PyMuPDF
import spacy
import re
import time
import sys
from langdetect import detect

# === Modelos ===
NLP_MODELS = {
    "en": spacy.load("en_core_web_sm"),
    "es": spacy.load("es_core_news_sm"),
}

# === Expresiones por idioma ===
contract_type_patterns = {
    "en": [
        r"(contract|agreement) (of|for)? (employment|services|sale|lease)",
        r"employment agreement",
        r"service agreement",
        r"rental agreement",
        r"lease agreement",
        r"sales contract",
        r"purchase agreement",
    ],
    "es": [
        r"contrato (de|de prestación de)? (servicios|arrendamiento|trabajo|compra|venta|prestación|compraventa)",
        r"acuerdo de prestación de servicios",
    ]
}

compliance_keywords = {
    "en": [
        r"GDPR compliant",
        r"in compliance with GDPR",
        r"complies with (the )?GDPR",
        r"General Data Protection Regulation",
        r"personal data.*(handled|processed).*GDPR"
    ],
    "es": [
        r"cumple con (el )?RGPD",
        r"en cumplimiento del RGPD",
        r"reglamento general de protección de datos",
        r"protección de datos.*RGPD"
    ]
}

# === Funciones auxiliares ===
def extract_text_from_pdf(path):
    with fitz.open(path) as doc:
        return " ".join(page.get_text() for page in doc)

def extract_with_patterns(text, patterns):
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(0).strip()
    return None

def extract_amount(text):
    matches = re.findall(r"(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(€|euros|usd|\$|dólares|dollars)?", text, re.IGNORECASE)
    if not matches:
        return None
    amounts = []
    for amount, currency in matches:
        clean_amount = amount.replace(",", "").replace(".", "")
        try:
            value = int(clean_amount)
            currency = currency or ""
            amounts.append((value, currency.strip()))
        except:
            continue
    if not amounts:
        return None
    best = max(amounts, key=lambda x: x[0])
    return f"{best[0]:,} {best[1]}".strip()

def extract_monthly_payment(text, lang):
    patterns = {
        "es": [
            r"cuotas\s+mensuales.*?(de|por)?\s*(\d+[.,]?\d*)\s*(euros|€)?",
            r"pagos\s+mensuales.*?(de|por)?\s*(\d+[.,]?\d*)\s*(euros|€)?",
            r"abonados.*?cuotas.*?(de|por)?\s*(\d+[.,]?\d*)\s*(euros|€)?",
            r"mensual(?:idades)?\s*(de|por)?\s*(\d+[.,]?\d*)\s*(euros|€)?"
        ],
        "en": [
            r"monthly payments?.*?(of)?\s*(\d+[.,]?\d*)\s*(usd|dollars|euros|\$)?",
            r"paid monthly.*?(amount of)?\s*(\d+[.,]?\d*)\s*(usd|dollars|euros|\$)?"
        ]
    }

    for pattern in patterns.get(lang, []):
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            numbers = [g for g in match.groups() if g and re.match(r"\d+[.,]?\d*", g)]
            currency = next((g for g in match.groups() if g and g.lower() in ["euros", "€", "usd", "$", "dólares", "dollars"]), "")
            if numbers:
                return f"{numbers[0]} {currency}".strip()
    return None

def extract_deposit(text, lang, contract_type):
    if not any(word in contract_type.lower() for word in ["arrendamiento", "lease", "rental"]):
        return None
    pattern = {
        "es": r"(depósito|garantía|fianza).*?(\d+[.,]?\d*)\s*(euros|€)?",
        "en": r"(deposit|guarantee).*?(\d+[.,]?\d*)\s*(usd|dollars|\$)?"
    }.get(lang)
    if not pattern:
        return None
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        value = match.group(2).replace(",", "")
        currency = match.group(3) or ""
        return f"{value} {currency}".strip()
    return None

def extract_sale_item(text, lang, contract_type):
    if not any(word in contract_type.lower() for word in ["compra", "venta", "compraventa", "sale", "purchase"]):
        return None

    if lang == "es":
        # Buscar marca
        marca_match = re.search(r"marca\s+([A-Za-z0-9\-]+)", text, re.IGNORECASE)
        marca = marca_match.group(1).upper() if marca_match else None

        # Buscar modelo
        modelo_match = re.search(r"modelo\s+([A-Za-z0-9\-]+)", text, re.IGNORECASE)
        modelo = modelo_match.group(1).upper() if modelo_match else None

        # Buscar matrícula
        placa_match = re.search(r"matr[ií]cula\s+([A-Za-z0-9\-]+)", text, re.IGNORECASE)
        placa = placa_match.group(1).upper() if placa_match else None

        partes = []
        if marca:
            partes.append(f"marca {marca}")
        if modelo:
            partes.append(f"modelo {modelo}")
        if placa:
            partes.append(f"matrícula {placa}")

        if partes:
            return "Vehículo " + ", ".join(partes)

        # Si no es vehículo, detectar otros objetos vendidos
        patterns = [
            r"(lote de [a-zA-Z\s]+ de oficina)",
            r"se acuerda la compra de\s+(un\s+)?(.+?)(?:\.|\n|$)",
            r"el vendedor se compromete a vender.*?(un\s+)?(.+?)(?:\.|\n|$)"
        ]
    else:
        # Inglés (similar estructura)
        patterns = [
            r"vehicle.*?make\s+([A-Za-z0-9\-]+).*?model\s+([A-Za-z0-9\-]+).*?plate\s+([A-Za-z0-9\-]+)",
            r"sale of a\s+(car|vehicle|item).*?(?:\.|\n|$)"
        ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            groups = [g for g in match.groups() if g and len(g.strip()) > 1]
            item = " ".join(groups).strip().capitalize()
            if len(item.split()) >= 2:
                return item

    return None









def detect_compliance(text, lang):
    patterns = compliance_keywords.get(lang, [])
    return any(re.search(p, text, re.IGNORECASE) for p in patterns)

def smart_contract_type(text, lang):
    for pattern in contract_type_patterns.get(lang, []):
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(0).strip().title()
    return "Desconocido" if lang == "es" else "Unknown"

def extract_object(text, lang):
    patterns = {
        "es": [
            r"objeto del presente contrato.*?(compr[ae].*?\b.*?)\.",
            r"se acuerda la compra.*?de\s+(un\s+)?(vehículo|inmueble|producto.*?)\."
        ],
        "en": [
            r"subject of this (contract|agreement).*?(sale|purchase).*?\b(.*?)\.",
            r"the purchase of (a|an)?\s*(vehicle|property|asset.*?)\."
        ]
    }.get(lang, [])
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(0).strip().rstrip('.')
    return None

# === PROCESO PRINCIPAL ===
def analyze_contract(path):
    text = extract_text_from_pdf(path)
    lang = detect(text)
    print(f"📄 Idioma detectado automáticamente: {lang}")
    print(f"🌍 Idioma detectado: {'Español' if lang == 'es' else 'Inglés'}\n")

    nlp = NLP_MODELS.get(lang, NLP_MODELS["en"])
    start = time.time()
    doc = nlp(text)
    elapsed = time.time() - start

    contract_type = smart_contract_type(text, lang)
    duration = extract_with_patterns(text, [
        r"(\d+\s*(meses|months))",
        r"por un período de\s+(\d+\s*(meses|months))",
        r"during a period of\s+(\d+\s*(months|meses))",
    ]) or "N/A"

    amount = extract_amount(text) or "N/A"
    monthly = extract_monthly_payment(text, lang) or "N/A"
    deposit = extract_deposit(text, lang, contract_type)
    sale_item = extract_sale_item(text, lang, contract_type)
    compliance = detect_compliance(text, lang)
    objeto_venta = extract_object(text, lang)

    is_lease = any(word in contract_type.lower() for word in ["arrendamiento", "lease", "rental"])
    is_sale = any(word in contract_type.lower() for word in ["compra", "venta", "compraventa", "sale", "purchase"])

    if is_sale:
        recommendation = "✔ Apto para firma" if compliance and amount != "N/A" else "⚠️ Revisión necesaria"
    else:
        recommendation = "✔ Apto para firma" if compliance and duration != "N/A" and (amount != "N/A" or monthly != "N/A") else "⚠️ Revisión necesaria"

    print(f"🧾 Tipo de contrato: {contract_type}")
    print(f"📆 Duración: {duration}")

    if not is_lease and amount != "N/A" and not is_sale:
        print(f"💰 Monto: {amount}")

    if monthly != "N/A" and not is_sale:
        print(f"📆 Pago mensual estimado: {monthly}")

    if is_sale:
        if sale_item:
            print(f"📦 Objeto vendido: {sale_item}")
        else:
            print("📦 Objeto vendido: No especificado claramente")

    if is_lease and deposit:
        print(f"🔒 Depósito o garantía: {deposit}")

    if is_sale:
        print(f"💰 Monto: {amount}")
        if objeto_venta:
            print(f"📦 Objeto de la venta: {objeto_venta}")

    print(f"✅ Cumplimiento: {'✔ Cumple con RGPD' if lang == 'es' and compliance else '✔ Compliant with GDPR' if lang == 'en' and compliance else '❌ No se detectó cumplimiento'}")
    print(f"🔐 Recomendación: {recommendation}")
    print(f"⏱ Tiempo de procesamiento (s): {elapsed:.2f}")


# === Ejecutar ===
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❗ Por favor proporciona el path del PDF como argumento.")
    else:
        analyze_contract(sys.argv[1])
