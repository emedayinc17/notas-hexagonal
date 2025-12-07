"""
Script para consolidar toda la documentación en una carpeta autocontenida
"""
import os
import shutil
from pathlib import Path

# Rutas
docs_dir = Path('e:/Notas-hexagonal/docs')
dest_dir = docs_dir / 'documentacion'

print("🚀 Iniciando consolidación de documentación...\n")

# 1. Copiar archivos HTML principales
print("📄 Copiando archivos HTML principales...")
html_files = [
    'index.html',
    '1_DOCUMENTACION_PROCESO.html',
    '2_DOCUMENTACION_PRODUCTO.html',
    '3_DOCUMENTACION_OPERACIONES.html',
    '4_DOCUMENTACION_USUARIO.html',
    '5_DOCUMENTACION_NEGOCIO.html',
    'GUIA_INICIO.html',
    'INSTRUCCIONES.html',
]

for html_file in html_files:
    src = docs_dir / html_file
    if src.exists():
        shutil.copy2(src, dest_dir / html_file)
        print(f"  ✅ {html_file}")
    else:
        print(f"  ⚠️ No encontrado: {html_file}")

# 2. Copiar screenshots
print("\n📸 Copiando screenshots...")
screenshots_src = docs_dir / 'screenshots'
screenshots_dest = dest_dir / 'screenshots'

if screenshots_src.exists():
    for img_file in screenshots_src.glob('*.png'):
        shutil.copy2(img_file, screenshots_dest / img_file.name)
        print(f"  ✅ {img_file.name}")
else:
    print("  ⚠️ Carpeta screenshots no encontrada")

# 3. Copiar archivos de soporte (MD, CSV, etc.)
print("\n📋 Copiando archivos de soporte...")
support_files = [
    'README_DOCUMENTACION.md',
    'PROYECTO_COMPLETADO.md',
    'ALINEACION_COMPLETA.md',
    'ACTUALIZACION_FINAL.md',
    'DOCUMENTACION_100_COMPLETA.md',
    'DOCUMENTACION_PERFECTA_18_SCREENSHOTS.md',
    'MENU_NAVEGACION_AGREGADO.md',
    'Jira.csv',
]

archivos_dest = dest_dir / 'archivos'
for support_file in support_files:
    src = docs_dir / support_file
    if src.exists():
        shutil.copy2(src, archivos_dest / support_file)
        print(f"  ✅ {support_file}")
    else:
        print(f"  ⚠️ No encontrado: {support_file}")

# 4. Copiar scripts Python
print("\n🐍 Copiando scripts Python...")
py_files = [
    'add_navigation_menu.py',
]

for py_file in py_files:
    src = docs_dir / py_file
    if src.exists():
        shutil.copy2(src, archivos_dest / py_file)
        print(f"  ✅ {py_file}")

print("\n✅ Consolidación completada!")
print(f"\n📁 Todos los archivos están en: {dest_dir}")
print("\n📊 Resumen:")
print(f"  - Archivos HTML: {len([f for f in html_files if (docs_dir / f).exists()])}")
print(f"  - Screenshots: {len(list(screenshots_dest.glob('*.png'))) if screenshots_dest.exists() else 0}")
print(f"  - Archivos de soporte: {len([f for f in support_files if (docs_dir / f).exists()])}")
print(f"  - Scripts Python: {len(py_files)}")
