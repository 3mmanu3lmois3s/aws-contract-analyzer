from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# SOLO permitir tu GitHub Pages para producción, y localhost para pruebas
CORS(app, resources={r"/analyze": {"origins": [
    "http://localhost:5173",
    "http://localhost:5000",
    "https://3mmanu3lmois3s.github.io"
]}}, supports_credentials=False)

@app.route('/analyze', methods=['POST'])
def analyze_contract():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    filename = file.filename

    # 🧪 Simulación de análisis
    result = {
        'filename': filename,
        'type': 'Contrato de Servicios',
        'duration': '12 meses',
        'risk': 'Moderado',
        'compliance': '✔ Cumple con GDPR',
        'recommendation': '✔ Apto para firma'
    }

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
