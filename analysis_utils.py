import fitz # PyMuPDF
# import spacy # No necesario aquí si los modelos se manejan en api.py
import re
# from langdetect import detect # No necesario aquí si se usa en api.py

# NLP_MODELS = { # Eliminar - Redundante si se carga en api.py
#     "en": spacy.load("en_core_web_sm"),
#     "es": spacy.load("es_core_news_sm"),
# }

contract_type_patterns = {
    "en": [
        r"(contract|agreement) (of|for)? (employment|services|sale|lease)",
        r"employment agreement", r"service agreement", r"rental agreement",
        r"lease agreement", r"sales contract", r"purchase agreement"
    ],
    "es": [
        r"contrato (de|de prestación de)? (servicios|arrendamiento|trabajo|compra|venta|prestación|compraventa)",
        r"acuerdo de prestación de servicios"
    ]
}

compliance_keywords = {
    "en": [r"GDPR compliant", r"in compliance with GDPR", r"complies with (the )?GDPR", r"General Data Protection Regulation"],
    "es": [r"cumple con (el )?RGPD", r"en cumplimiento del RGPD", r"reglamento general de protección de datos"]
}

# --- Funciones Auxiliares ---

def extract_text_from_pdf(pdf_bytes):
    """Extrae texto de un PDF proporcionado como bytes."""
    if not pdf_bytes:
        print("Error: Se recibieron bytes vacíos para extraer texto del PDF.")
        return ""
    try:
        # Abrir PDF desde stream de bytes
        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            if len(doc) == 0:
                print("Advertencia: El PDF no tiene páginas.")
                return ""
            # Extraer texto de todas las páginas
            full_text = " ".join(page.get_text("text", flags=fitz.TEXTFLAGS_TEXT) for page in doc).strip()
            # Opcional: Limpiar múltiples espacios/saltos de línea si es necesario
            full_text = re.sub(r'\s+', ' ', full_text)
            return full_text
    # Capturar excepciones específicas de fitz y genéricas
    except fitz.fitz.FitxError as fe:
        print(f"Error específico de PyMuPDF al extraer texto: {fe}")
        return "" # Devolver vacío en caso de error de fitz
    except Exception as e:
        print(f"Error genérico al extraer texto del PDF: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc() # Imprime más detalles en el log del servidor
        return "" # Devolver vacío en caso de error

def extract_with_patterns(text, patterns):
    if not text: return None # Añadir chequeo por si el texto es vacío
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
             # Intenta devolver el grupo de captura si existe, sino el match completo
             try:
                 return match.group(1).strip() if match.groups() else match.group(0).strip()
             except IndexError:
                 return match.group(0).strip() # Fallback si group(1) no existe pero se esperaba
    return None

def extract_amount(text):
    if not text: return None
    # (Misma lógica que antes, pero asegura devolver None si no hay texto)
    # ... [código de extract_amount sin cambios] ...
    matches = re.findall(r"(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*(€|euros?|eur|usd|\$|d[oó]lares?|dollars?)?", text, re.IGNORECASE)
    if not matches: return None
    amounts = []
    for amount_str, currency in matches:
        clean_amount_str = amount_str.replace(".", "").replace(",", ".")
        value = 0
        try:
            if '.' in clean_amount_str: value = float(clean_amount_str)
            else: value = int(clean_amount_str)
            currency_symbol = currency or ""
            # Intenta buscar moneda si no se encontró
            if not currency_symbol:
                 context_start = max(0, text.find(amount_str) - 10)
                 context_end = text.find(amount_str) + len(amount_str) + 10
                 context_window = text[context_start:context_end].lower()
                 if '€' in context_window or 'eur' in context_window: currency_symbol = '€'
                 elif '$' in context_window or 'usd' in context_window or 'dollar' in context_window or 'dólar' in context_window: currency_symbol = '$'

            amounts.append((value, currency_symbol.strip()))
        except ValueError: continue
    if not amounts: return None
    best = max(amounts, key=lambda x: x[0])
    formatted_value = ""
    if isinstance(best[0], float):
        formatted_value = "{:,.2f}".format(best[0]).replace(",", "X").replace(".", ",").replace("X", ".") # Formato ES decimal
    else:
        formatted_value = "{:,}".format(best[0]).replace(",", ".") # Formato ES miles
    return f"{formatted_value} {best[1]}".strip()


def extract_monthly_payment(text, lang):
    if not text: return None
    # (Misma lógica que antes)
    # ... [código de extract_monthly_payment sin cambios] ...
    patterns = { # Añadir patrones más robustos si es necesario
         "es": [
            r"(?:cuotas?|pagos?|abonos?|renta|alquiler)\s+(?:mensuales?|cada mes).*?(?:de|por)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*(euros?|€|eur)?",
            r"mensual(?:idad(?:es)?)?\s*(?:de|por)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*(euros?|€|eur)?",
         ],
         "en": [
            r"monthly\s+(?:payments?|installments?|rent|fee).*?(?:of|for)?\s*(\$?|usd)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*(dollars?|usd)?",
            r"paid\s+monthly.*?(?:amount\s+of)?\s*(\$?|usd)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*(dollars?|usd)?",
         ]
    }
    for pattern in patterns.get(lang, []):
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            amount_str = None; currency = None
            potential_amounts = [g for g in match if g and re.match(r"^\d", g.replace(',','').replace('.',''))] # Busca string que empiece por dígito
            potential_currencies = [g for g in match if g and g.lower() in ["euros", "euro", "€", "eur", "usd", "$", "dollars", "dollar"]]
            symbols = [g for g in match if g in ['$', '€']]

            if potential_amounts:
                amount_str = potential_amounts[0]
                # Formateo similar a extract_amount
                clean_amount_str = amount_str.replace(".", "").replace(",", ".")
                value = 0
                try:
                    if '.' in clean_amount_str: value = float(clean_amount_str)
                    else: value = int(clean_amount_str)
                    formatted_value = ""
                    if isinstance(value, float): formatted_value = "{:,.2f}".format(value).replace(",", "X").replace(".", ",").replace("X", ".")
                    else: formatted_value = "{:,}".format(value).replace(",", ".")

                    currency = potential_currencies[0] if potential_currencies else (symbols[0] if symbols else "")
                    return f"{formatted_value} {currency}".strip()
                except ValueError: continue
    return None


def extract_deposit(text, lang, contract_type):
    if not text: return None
    if not contract_type or not any(word in contract_type.lower() for word in ["arrendamiento", "lease", "rental"]):
        return None

    pattern_dict = {
        "es": r"(dep[oó]sito|garant[ií]a|fianza).{0,50}?\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*(euros?|€|eur)?",
        "en": r"(deposit|guarantee|security deposit).{0,50}?\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*(dollars?|usd|\$)?"
    }

    pattern = pattern_dict.get(lang)
    if not pattern:
        return None

    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        amount_str = match.group(2)
        currency = match.group(3) or ""

        # Normaliza: 1.900 → 1900 ; 1,900.50 → 1900.50 ; 1.900,50 → 1900.50
        clean_amount = amount_str.replace(".", "").replace(",", ".")
        try:
            value = float(clean_amount)
            formatted_value = "{:,.2f}".format(value).replace(",", "X").replace(".", ",").replace("X", ".") if '.' in clean_amount else "{:,}".format(int(value)).replace(",", ".")
            return f"{formatted_value} {currency}".strip()
        except ValueError:
            return None
    return None


def extract_sale_item(text, lang, contract_type):
    if not text: return None
    if not contract_type or not any(word in contract_type.lower() for word in ["compra", "venta", "compraventa", "sale", "purchase"]):
        return None
    # (Lógica de extracción de vehículo como antes)
    # ... [código de extract_sale_item sin cambios] ...
    if lang == "es":
        # Añadir búsqueda inmueble ES
        inmueble_match = re.search(r"inmueble.*?situado en (.*?)(?:,|\.|inscrito|referencia catastral)", text, re.IGNORECASE)
        if inmueble_match: return f"Inmueble situado en {inmueble_match.group(1).strip()}"
        # Añadir búsqueda vivienda proyectada ES
        vivienda_match = re.search(
            r"(?:vivienda|finca|parcela).*?n[ºo]?\s*\d.*?promoci[oó]n.*?\"(.*?)\".*?calle\s+(.*?)\s", text, re.IGNORECASE)
        if vivienda_match:
            nombre_promocion = vivienda_match.group(1)
            calle = vivienda_match.group(2)
            return f"Vivienda en promoción \"{nombre_promocion}\", Calle {calle}"
        vehiculo_match = re.search(r"vehículo.*?marca\s+([A-Za-z0-9\-]+).*?modelo\s+([A-Za-z0-9\-]+).*?matr[ií]cula\s+([A-Za-z0-9\-]+)", text, re.IGNORECASE | re.DOTALL)
        if vehiculo_match:
            return f"Vehículo marca {vehiculo_match.group(1).upper()}, modelo {vehiculo_match.group(2).upper()}, matrícula {vehiculo_match.group(3).upper()}"
        # Añadir búsqueda inmueble ES
        inmueble_match = re.search(r"inmueble.*?situado en (.*?)(?:,|\.|inscrito|referencia catastral)", text, re.IGNORECASE)
        if inmueble_match: return f"Inmueble situado en {inmueble_match.group(1).strip()}"
        # Patrones genéricos ES
        patterns = [r"objeto del.*?contrato es la compraventa de\s*(?:un\s+|el\s+)?(.*?)(?:\.|,|con las siguientes)", r"vendedor vende.*?comprador adquiere\s*(?:un\s+|el\s+)?(.*?)(?:\.|,|ubicado en)"]
    else: # EN
        vehicle_match = re.search(r"vehicle.*?make\s+([A-Za-z0-9\-]+).*?model\s+([A-Za-z0-9\-]+).*?(?:plate|VIN)\s+([A-Za-z0-9\-]+)", text, re.IGNORECASE | re.DOTALL)
        if vehicle_match: return f"Vehicle make {vehicle_match.group(1).upper()}, model {vehicle_match.group(2).upper()}, plate/VIN {vehicle_match.group(3).upper()}"
        # Añadir búsqueda inmueble EN
        property_match = re.search(r"(?:property|real estate).*?located at (.*?)(?:,|\.|described as)", text, re.IGNORECASE)
        if property_match: return f"Property located at {property_match.group(1).strip()}"
        # Patrones genéricos EN
        patterns = [r"subject of this.*?agreement is the sale of\s*(?:a\s+|an\s+|the\s+)?(.*?)(?:\.|,|further described)", r"seller sells.*?buyer purchases\s*(?:a\s+|an\s+|the\s+)?(.*?)(?:\.|,|located at)"]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            groups = [g for g in match.groups() if g and len(g.strip()) > 3]
            if groups:
                item = re.sub(r"^(un|una|el|la|a|an|the)\s+", "", groups[-1], flags=re.IGNORECASE).strip().capitalize()
                # Evitar devolver descripciones demasiado largas o genéricas
                if len(item) < 100 and "following" not in item.lower() and "present contract" not in item.lower():
                     return item
    return None # Devolver None si no se encuentra ítem específico

def extract_object(text, lang):
    if not text: return None
    # (Misma lógica que antes)
    # ... [código de extract_object sin cambios] ...
    patterns = {
         "es": [r"OBJETO DEL CONTRATO[\s\n]*(?:.*?[\s\n]+)?(.*?)(?:SEGUNDO|II\.|\n\n[A-ZÁÉÍÓÚÑ]+)", r"objeto del presente contrato es (?:la|el)\s+(.*?)\.", r"constituye el objeto.*?contrato (?:la|el)\s+(.*?)\."],
         "en": [r"SUBJECT MATTER[\s\n]*(?:.*?[\s\n]+)?(.*?)(?:SECOND|II\.|\n\n[A-Z]+)", r"subject of this (?:contract|agreement) is (?:the)?\s+(.*?)\.", r"subject matter of this.*?is (?:the)?\s+(.*?)\."]
    }.get(lang, [])
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            objeto = re.sub(r'\s*\n\s*', ' ', match.group(1)).strip()
            if len(objeto) > 150: objeto = objeto[:150] + "..."
            if objeto.lower() not in ["la", "el", "the"] and len(objeto) > 5: # Asegura que no sea solo artículo y tenga algo de longitud
                return objeto.capitalize()
    return None

def detect_compliance(text, lang):
    if not text: return False
    patterns = compliance_keywords.get(lang, [])
    if any(re.search(p, text, re.IGNORECASE) for p in patterns):
        return True
    # Nuevo patrón heurístico para contratos con cláusulas legales de devolución
    if re.search(r"inter[eé]s(es)? legales.*(devolver[aá]|reembolsar[aá]|restituir[aá])", text, re.IGNORECASE):
        return True
    return False

def smart_contract_type(text, lang):
    if not text: return "Desconocido" if lang == "es" else "Unknown"
    if re.search(r"compraventa.*(finca|vivienda|parcela).*proyectad[ao]", text, re.IGNORECASE):
        return "Contrato De Compraventa De Finca Proyectada"
    for pattern in contract_type_patterns.get(lang, []):
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            type_str = match.group(0).strip().lower()
            return ' '.join(word.capitalize() for word in type_str.split())
    return "Desconocido" if lang == "es" else "Unknown"

def extract_sale_item(text, lang, contract_type):
    if not text: return None
    if not contract_type or not any(word in contract_type.lower() for word in ["compra", "venta", "compraventa", "sale", "purchase"]):
        return None
    if lang == "es":
        # Extraer embarcaciones (ES)
        barco_match = re.search(
            r"embarcaci[oó]n.*?nombre\s+\"?([A-Za-z0-9\s\-]+)\"?.*?matr[ií]cula\s+([A-Za-z0-9\-]+).*?marca\s+([A-Za-z0-9\s\-]+).*?modelo\s+([A-Za-z0-9\s\-]+).*?a[ñn]o\s+(\d{4})",
            text,
            re.IGNORECASE | re.DOTALL,
        )
        if barco_match:
            return (
                f"Embarcación '{barco_match.group(1).strip()}' "
                f"(matrícula {barco_match.group(2).strip()}), "
                f"marca {barco_match.group(3).strip()}, "
                f"modelo {barco_match.group(4).strip()}, año {barco_match.group(5).strip()}"
            )
        electro_match = re.search(
    r"(refrigerador|lavadora|microondas|televisor|aire acondicionado).*?marca\s+([A-Za-z0-9\-]+).*?modelo\s+([A-Za-z0-9\-]+)",
    text,
    re.IGNORECASE,
        )

        pc_match = re.search(
            r"(port[áa]til|laptop|ordenador|computadora).*?marca\s+([A-Za-z0-9\-]+).*?modelo\s+([A-Za-z0-9\-]+)",
            text,
            re.IGNORECASE,
        )
        if pc_match:
            return (
                f"{pc_match.group(1).capitalize()} marca {pc_match.group(2)}, "
                f"modelo {pc_match.group(3)}"
            )

        software_match = re.search(
            r"(licencia|software|sistema).*?nombre\s+\"?([A-Za-z0-9\s\-]+)\"?.*?versi[oó]n\s+([A-Za-z0-9\.]+)",
            text,
            re.IGNORECASE,
        )
        if software_match:
            return (
                f"{software_match.group(1).capitalize()} '{software_match.group(2).strip()}', "
                f"versión {software_match.group(3)}"
            )

        avion_info = extract_avion_info(text)
        if avion_info:
            return avion_info
        
        mueble_match = re.search(
            r"(mueble|sof[aá]|mesa|silla|armario).*?tipo\s+([A-Za-z0-9\s\-]+)",
            text,
            re.IGNORECASE,
        )
        if mueble_match:
            return f"{mueble_match.group(1).capitalize()} tipo {mueble_match.group(2)}"

        telefono_match = re.search(
            r"(smartphone|tel[eé]fono|m[oó]vil).*?marca\s+([A-Za-z0-9\-]+).*?modelo\s+([A-Za-z0-9\-]+)",
            text,
            re.IGNORECASE,
        )
        if telefono_match:
            return (
                f"{telefono_match.group(1).capitalize()} marca {telefono_match.group(2)}, "
                f"modelo {telefono_match.group(3)}"
            )

        arte_match = re.search(
            r"(obra|pintura|escultura).*?t[ií]tulo\s+\"?([A-Za-z0-9\s\-]+)\"?.*?autor\s+([A-Za-z\s\-]+)",
            text,
            re.IGNORECASE,
        )
        if arte_match:
            return (
                f"{arte_match.group(1).capitalize()} titulada '{arte_match.group(2)}', "
                f"autor: {arte_match.group(3)}"
            )
        
        mascota_match = re.search(
            r"(mascota|perro|gato|animal).*?raza\s+([A-Za-z0-9\s\-]+).*?nombre\s+\"?([A-Za-z0-9\s\-]+)\"?",
            text,
            re.IGNORECASE,
        )
        if mascota_match:
            return (
                f"{mascota_match.group(1).capitalize()} raza {mascota_match.group(2)}, "
                f"nombre '{mascota_match.group(3)}'"
            )

        if electro_match:
            return (
                f"{electro_match.group(1).capitalize()} marca {electro_match.group(2)}, "
                f"modelo {electro_match.group(3)}"
            )
        vehiculo_match = re.search(r"vehículo.*?marca\s+([A-Za-z0-9\-]+).*?modelo\s+([A-Za-z0-9\-]+).*?matr[ií]cula\s+([A-Za-z0-9\-]+)", text, re.IGNORECASE | re.DOTALL)
        if vehiculo_match:
            return f"Vehículo marca {vehiculo_match.group(1).upper()}, modelo {vehiculo_match.group(2).upper()}, matrícula {vehiculo_match.group(3).upper()}"
        inmueble_match = re.search(r"inmueble.*?situado en (.*?)(?:,|\.|inscrito|referencia catastral)", text, re.IGNORECASE)
        if inmueble_match: return f"Inmueble situado en {inmueble_match.group(1).strip()}"
        proyecto_finca_match = re.search(r"vivienda.*?[nºo•]\s*\d.*?promoci[oó]n.*?\"(.*?)\".*?(calle\s+[A-ZÁÉÍÓÚÑa-záéíóúñ0-9\s]+)", text, re.IGNORECASE | re.DOTALL)
        if proyecto_finca_match:
            nombre_promocion = proyecto_finca_match.group(1).strip()
            calle = proyecto_finca_match.group(2).strip().replace("\n", " ")
            return f"Vivienda en promoción \"{nombre_promocion}\", {calle}"
        patterns = [
            r"objeto del.*?contrato es la compraventa de\s*(?:un\s+|el\s+)?(.*?)(?:\.|,|con las siguientes)",
            r"vendedor vende.*?comprador adquiere\s*(?:un\s+|el\s+)?(.*?)(?:\.|,|ubicado en)"
        ]
    else:
        # EN logic unchanged...
        pass
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            groups = [g for g in match.groups() if g and len(g.strip()) > 3]
            if groups:
                item = re.sub(r"^(un|una|el|la|a|an|the)\s+", "", groups[-1], flags=re.IGNORECASE).strip().capitalize()
                if len(item) < 100 and "following" not in item.lower() and "present contract" not in item.lower():
                    return item
    return None

def extract_avion_info(text):
    tipo_val = re.search(r"tipo\s*:\s*([a-zA-Z0-9\s\-]+)", text, re.IGNORECASE)
    marca_val = re.search(r"marca\s*:\s*([a-zA-Z0-9\s\-]+)", text, re.IGNORECASE)
    modelo_val = re.search(r"modelo\s*:\s*([a-zA-Z0-9\s\-]+)", text, re.IGNORECASE)
    matricula_val = re.search(r"matr[ií]cula\s*:\s*([a-zA-Z0-9\-]+)", text, re.IGNORECASE)

    tipo_val = tipo_val.group(1).strip() if tipo_val else "N/A"
    marca_val = marca_val.group(1).strip() if marca_val else "N/A"
    modelo_val = modelo_val.group(1).strip() if modelo_val else "N/A"
    matricula_val = matricula_val.group(1).strip() if matricula_val else "N/A"

    if tipo_val == marca_val == modelo_val == matricula_val == "N/A":
        return None

    return f"Aeronave (matrícula {matricula_val}), marca {marca_val}, modelo {modelo_val}"

# --- ELIMINAR LA FUNCIÓN analyze_text DE AQUÍ ---
# def analyze_text(text):
#    ... (Eliminada) ...