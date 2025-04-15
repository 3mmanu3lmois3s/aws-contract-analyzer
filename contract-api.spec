import os
import sys
from PyInstaller.utils.hooks import collect_submodules

# Rutas absolutas al subdirectorio correcto que contiene config.cfg
en_model_path = os.path.abspath("venv/Lib/site-packages/en_core_web_sm/en_core_web_sm-3.8.0")
es_model_path = os.path.abspath("venv/Lib/site-packages/es_core_news_sm/es_core_news_sm-3.8.0")

datas = [
    (en_model_path, "en_core_web_sm"),
    (es_model_path, "es_core_news_sm"),
]

hiddenimports = collect_submodules("spacy")

block_cipher = None

a = Analysis(
    ['api.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='contract-api',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='contract-api',
)
