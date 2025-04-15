import os

es_model_path = os.path.abspath('venv/Lib/site-packages/es_core_news_sm')
en_model_path = os.path.abspath('venv/Lib/site-packages/en_core_web_sm')

print("Ruta modelo español:", es_model_path)
print("Existe:", os.path.isdir(es_model_path))

print("Ruta modelo inglés:", en_model_path)
print("Existe:", os.path.isdir(en_model_path))
