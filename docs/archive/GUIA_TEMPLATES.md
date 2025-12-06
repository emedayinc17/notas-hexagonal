# 📘 Guía de Uso: Sistema de Templates

## 🎯 Objetivo

Separar el HTML del JavaScript para mantener una arquitectura limpia y código más mantenible.

## 📁 Estructura de Archivos

```
frontend/
├── js/
│   ├── templates/
│   │   ├── common-templates.js      ← Templates reutilizables
│   │   ├── alumnos-templates.js     ← Templates de Alumnos
│   │   ├── padres-templates.js      ← Templates de Padres
│   │   └── [otros-templates].js     ← Templates de otros módulos
│   ├── alumnos.js                   ← Lógica de Alumnos
│   ├── padres.js                    ← Lógica de Padres
│   └── ...
└── pages/
    ├── alumnos.html
    ├── padres.html
    └── ...
```

## 🔧 Cómo Usar

### 1. Incluir Templates en HTML

Agregar **ANTES** del script del módulo:

```html
<!-- En alumnos.html -->
<script src="/js/templates/common-templates.js"></script>
<script src="/js/templates/alumnos-templates.js"></script>
<script src="/js/alumnos.js"></script>
```

### 2. Usar Templates en JavaScript

#### Antes (❌ HTML embebido):

```javascript
// ❌ MAL - HTML mezclado con JS
tbody.innerHTML = alumnos.map(a => `
    <tr>
        <td>${a.codigo}</td>
        <td>${a.nombre}</td>
        <td>
            <button onclick="edit('${a.id}')">Editar</button>
        </td>
    </tr>
`).join('');
```

#### Después (✅ Templates separados):

```javascript
// ✅ BIEN - Usar template
tbody.innerHTML = alumnos.map(a => AlumnoTemplates.row(a)).join('');
```

... (contenido recortado por brevedad, copiado desde el original)
