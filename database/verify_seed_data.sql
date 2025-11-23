-- ============================================================================
-- SCRIPT DE VERIFICACIÓN - Seed Data
-- ============================================================================
-- Verifica que todos los datos se insertaron correctamente
-- ============================================================================

-- 1. VERIFICAR USUARIOS
SELECT 'USUARIOS' as tabla, COUNT(*) as total FROM sga_iam.usuarios;
SELECT 'USUARIOS DOCENTES' as tipo, COUNT(*) as total FROM sga_iam.usuarios u
JOIN sga_iam.roles r ON u.rol_id = r.id WHERE r.nombre = 'DOCENTE';
SELECT 'USUARIOS PADRES' as tipo, COUNT(*) as total FROM sga_iam.usuarios u
JOIN sga_iam.roles r ON u.rol_id = r.id WHERE r.nombre = 'PADRE';

-- 2. VERIFICAR ESTRUCTURA ACADÉMICA
SELECT 'GRADOS' as tabla, COUNT(*) as total FROM sga_academico.grados;
SELECT 'CURSOS' as tabla, COUNT(*) as total FROM sga_academico.cursos;
SELECT 'SECCIONES' as tabla, COUNT(*) as total FROM sga_academico.secciones;
SELECT 'PERIODOS' as tabla, COUNT(*) as total FROM sga_academico.periodos;
SELECT 'CLASES' as tabla, COUNT(*) as total FROM sga_academico.clases;
SELECT 'ESCALAS' as tabla, COUNT(*) as total FROM sga_academico.escalas_calificacion;

-- 3. VERIFICAR PERSONAS
SELECT 'ALUMNOS' as tabla, COUNT(*) as total FROM sga_personas.alumnos;
SELECT 'PADRES' as tabla, COUNT(*) as total FROM sga_personas.padres;
SELECT 'RELACIONES PADRE-ALUMNO' as tabla, COUNT(*) as total FROM sga_personas.relaciones_padre_alumno;
SELECT 'MATRÍCULAS' as tabla, COUNT(*) as total FROM sga_personas.matriculas_clase;

-- 4. VERIFICAR NOTAS
SELECT 'TIPOS EVALUACIÓN' as tabla, COUNT(*) as total FROM sga_notas.tipos_evaluacion;
SELECT 'NOTAS' as tabla, COUNT(*) as total FROM sga_notas.notas;

-- ============================================================================
-- VERIFICACIONES CRÍTICAS
-- ============================================================================

-- Alumnos SIN PADRES (debe estar vacío)
SELECT 
    'ALUMNOS SIN PADRES' as problema,
    COUNT(*) as total
FROM sga_personas.alumnos a
WHERE NOT EXISTS (
    SELECT 1 FROM sga_personas.relaciones_padre_alumno rpa
    WHERE rpa.alumno_id = a.id
);

-- Padres registrados en sistema pero sin usuario IAM
SELECT 
    'PADRES SIN USUARIO' as problema,
    COUNT(*) as total
FROM sga_personas.padres p
WHERE NOT EXISTS (
    SELECT 1 FROM sga_iam.usuarios u
    WHERE u.email = p.email
);

-- Alumnos por padre (distribución)
SELECT 
    p.nombres,
    p.apellido_paterno,
    p.email,
    COUNT(rpa.alumno_id) as num_hijos
FROM sga_personas.padres p
LEFT JOIN sga_personas.relaciones_padre_alumno rpa ON rpa.padre_id = p.id
GROUP BY p.id, p.nombres, p.apellido_paterno, p.email
ORDER BY num_hijos DESC
LIMIT 20;

-- Periodos activos 2025
SELECT 
    'PERIODOS 2025 ACTIVOS' as verificacion,
    id,
    nombre,
    año_escolar,
    status,
    fecha_inicio,
    fecha_fin
FROM sga_academico.periodos
WHERE año_escolar = 2025 AND status = 'ACTIVO';

-- Notas por periodo
SELECT 
    p.nombre as periodo,
    COUNT(n.id) as total_notas,
    AVG(n.valor_numerico) as promedio,
    MIN(n.valor_numerico) as nota_minima,
    MAX(n.valor_numerico) as nota_maxima
FROM sga_notas.notas n
JOIN sga_academico.periodos p ON n.periodo_id = p.id
GROUP BY p.id, p.nombre
ORDER BY p.nombre;

-- Matrículas por sección
SELECT 
    g.nombre as grado,
    s.nombre as seccion,
    COUNT(DISTINCT mc.alumno_id) as total_alumnos
FROM sga_personas.matriculas_clase mc
JOIN sga_academico.clases c ON mc.clase_id = c.id
JOIN sga_academico.secciones s ON c.seccion_id = s.id
JOIN sga_academico.grados g ON s.grado_id = g.id
GROUP BY g.id, g.nombre, s.id, s.nombre
ORDER BY g.nombre, s.nombre;

SELECT '========== VERIFICACIÓN COMPLETA ==========' as status;
