"""
Script para agregar menú de navegación a todos los documentos HTML
"""

# Menú de navegación HTML
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
                        <a class="nav-link {active_1}" href="1_DOCUMENTACION_PROCESO.html">
                            <i class="bi bi-diagram-3"></i> Proceso
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link {active_2}" href="2_DOCUMENTACION_PRODUCTO.html">
                            <i class="bi bi-box-seam"></i> Producto
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link {active_3}" href="3_DOCUMENTACION_OPERACIONES.html">
                            <i class="bi bi-gear-fill"></i> Operaciones
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link {active_4}" href="4_DOCUMENTACION_USUARIO.html">
                            <i class="bi bi-person-fill"></i> Usuario
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link {active_5}" href="5_DOCUMENTACION_NEGOCIO.html">
                            <i class="bi bi-briefcase-fill"></i> Negocio
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

'''

# CSS para el menú
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

# Documentos a actualizar (doc 1 ya está actualizado)
documents = [
    ('2_DOCUMENTACION_PRODUCTO.html', 2),
    ('3_DOCUMENTACION_OPERACIONES.html', 3),
    ('4_DOCUMENTACION_USUARIO.html', 4),
    ('5_DOCUMENTACION_NEGOCIO.html', 5),
]

import os

for doc_file, doc_num in documents:
    file_path = f'e:\\Notas-hexagonal\\docs\\{doc_file}'
    
    if not os.path.exists(file_path):
        print(f"❌ Archivo no encontrado: {doc_file}")
        continue
    
    # Leer el archivo
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Preparar el menú con la clase active correcta
    active_classes = {f'active_{i}': 'active' if i == doc_num else '' for i in range(1, 6)}
    menu_html = nav_menu_html.format(**active_classes)
    
    # Agregar CSS si no existe
    if '/* Menú de Navegación Sticky */' not in content:
        # Buscar el cierre del último estilo antes de </style>
        style_close_pos = content.find('</style>')
        if style_close_pos != -1:
            content = content[:style_close_pos] + nav_menu_css + '\n    ' + content[style_close_pos:]
    
    # Agregar HTML del menú si no existe
    if '<!-- Menú de Navegación -->' not in content:
        # Buscar <body> y agregar el menú después
        body_pos = content.find('<body>')
        if body_pos != -1:
            insert_pos = body_pos + len('<body>') + 1
            content = content[:insert_pos] + menu_html + content[insert_pos:]
    
    # Guardar el archivo actualizado
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Actualizado: {doc_file}")

print("\n🎉 ¡Menú de navegación agregado a todos los documentos!")
