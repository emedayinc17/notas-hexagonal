"""
Script para agregar menú de navegación a GUIA_INICIO.html e INSTRUCCIONES.html
"""

nav_menu_css = '''
        /* Menú de Navegación Sticky */
        .nav-menu {
            position: sticky;
            top: 0;
            z-index: 1000;
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        .nav-menu .nav-link {
            color: white !important;
            padding: 0.75rem 1rem;
            transition: all 0.3s ease;
            border-radius: 5px;
            margin: 0 0.25rem;
        }

        .nav-menu .nav-link:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }

        .nav-menu .nav-link.active {
            background: rgba(255, 255, 255, 0.3);
            font-weight: bold;
        }

        .nav-menu .navbar-brand {
            color: white !important;
            font-weight: bold;
        }
'''

nav_menu_html = '''    <!-- Menú de Navegación -->
    <nav class="navbar navbar-expand-lg nav-menu">
        <div class="container-fluid">
            <a class="navbar-brand" href="index.html">
                <i class="bi bi-house-door-fill"></i> Documentación SGA
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="1_DOCUMENTACION_PROCESO.html">
                            <i class="bi bi-diagram-3"></i> Proceso
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="2_DOCUMENTACION_PRODUCTO.html">
                            <i class="bi bi-box-seam"></i> Producto
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="3_DOCUMENTACION_OPERACIONES.html">
                            <i class="bi bi-gear-fill"></i> Operaciones
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="4_DOCUMENTACION_USUARIO.html">
                            <i class="bi bi-person-fill"></i> Usuario
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="5_DOCUMENTACION_NEGOCIO.html">
                            <i class="bi bi-briefcase-fill"></i> Negocio
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

'''

files_to_update = [
    'GUIA_INICIO.html',
    'INSTRUCCIONES.html'
]

import os

for filename in files_to_update:
    filepath = f'e:\\Notas-hexagonal\\docs\\{filename}'
    
    if not os.path.exists(filepath):
        print(f"❌ No encontrado: {filename}")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Agregar CSS si no existe
    if '/* Menú de Navegación Sticky */' not in content:
        style_close = content.find('</style>')
        if style_close != -1:
            content = content[:style_close] + nav_menu_css + '\n    ' + content[style_close:]
            print(f"✅ CSS agregado a {filename}")
    
    # Agregar HTML del menú si no existe
    if '<!-- Menú de Navegación -->' not in content:
        body_start = content.find('<body>')
        if body_start != -1:
            insert_pos = body_start + len('<body>') + 1
            content = content[:insert_pos] + nav_menu_html + content[insert_pos:]
            print(f"✅ Menú agregado a {filename}")
    
    # Guardar
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("\n🎉 ¡Menús agregados exitosamente!")
