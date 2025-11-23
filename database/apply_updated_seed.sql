-- ============================================================================
-- APLICAR SEED CON DATOS COMPATIBLES PARA SISTEMA MULTICURSO DINÁMICO
-- ============================================================================
-- Este script aplica solo los datos del seed actualizado
-- Usar después de ejecutar bootstrap.sql

-- Configuración inicial
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET autocommit = 0;

START TRANSACTION;

-- Limpiar datos existentes (mantener estructura)
USE sga_notas;
DELETE FROM notas WHERE id IS NOT NULL;

USE sga_personas;
DELETE FROM matriculas_clase WHERE id IS NOT NULL;
DELETE FROM relaciones_padre_alumno WHERE id IS NOT NULL;
DELETE FROM padres WHERE id IS NOT NULL;
DELETE FROM alumnos WHERE id IS NOT NULL;

USE sga_academico;
DELETE FROM clases WHERE id IS NOT NULL;
DELETE FROM periodos WHERE id IS NOT NULL;
DELETE FROM periodo_tipos WHERE id IS NOT NULL;
DELETE FROM secciones WHERE id IS NOT NULL;
DELETE FROM cursos WHERE id IS NOT NULL;
DELETE FROM grados WHERE id IS NOT NULL;
DELETE FROM escalas_calificacion WHERE id IS NOT NULL;

USE sga_notas;
DELETE FROM tipos_evaluacion WHERE id IS NOT NULL;

USE sga_iam;
DELETE FROM usuarios WHERE id != 'SYSTEM';
DELETE FROM roles WHERE id IS NOT NULL;

-- ============================================================================
-- EJECUTAR DATOS DEL SEED ACTUALIZADO
-- ============================================================================

-- 1. ROLES (IAM)
USE sga_iam;
INSERT INTO roles (id, nombre, descripcion) VALUES
(UUID(), 'ADMINISTRADOR', 'Acceso completo al sistema'),
(UUID(), 'DOCENTE', 'Profesor con acceso a sus clases'),
(UUID(), 'PADRE', 'Padre/Apoderado con acceso a notas de hijos'),
(UUID(), 'ALUMNO', 'Estudiante con acceso a sus notas'),
(UUID(), 'DIRECTOR', 'Director con acceso administrativo');

-- 2. USUARIOS DEMO Y DOCENTES
-- Usuario Demo DOCENTE (Password: Docente123!)
INSERT INTO usuarios (id, username, email, password_hash, rol_id, nombres, apellidos, status) VALUES
(UUID(), 'docente', 'docente@colegio.com', '$2b$12$8bQb4i/ZrpiYhrWTRxqQD.KEKE95/HYPjuXgF9KTVjk8ggTQNhbna', (SELECT id FROM roles WHERE nombre = 'DOCENTE'), 'Docente', 'Demo', 'ACTIVO');

-- Usuario Demo PADRE (Password: Padre123!)
INSERT INTO usuarios (id, username, email, password_hash, rol_id, nombres, apellidos, status) VALUES
(UUID(), 'padre', 'padre@colegio.com', '$2b$12$hgqIgxfjhRyLZZxdB5EcqeTHLartAymtoCPm1R3.giZhiCqc1NI9S', (SELECT id FROM roles WHERE nombre = 'PADRE'), 'Padre', 'Demo', 'ACTIVO');

-- Docentes adicionales (Password: docente123)
INSERT INTO usuarios (id, username, email, password_hash, rol_id, nombres, apellidos, status) VALUES
(UUID(), 'docente01', 'docente01@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', (SELECT id FROM roles WHERE nombre = 'DOCENTE'), 'María Elena', 'Rodríguez Sánchez', 'ACTIVO'),
(UUID(), 'docente02', 'docente02@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', (SELECT id FROM roles WHERE nombre = 'DOCENTE'), 'Carlos Alberto', 'Méndez Torres', 'ACTIVO'),
(UUID(), 'docente03', 'docente03@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', (SELECT id FROM roles WHERE nombre = 'DOCENTE'), 'Ana Patricia', 'Gonzáles Vega', 'ACTIVO'),
(UUID(), 'docente04', 'docente04@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', (SELECT id FROM roles WHERE nombre = 'DOCENTE'), 'Roberto José', 'Castillo Flores', 'ACTIVO'),
(UUID(), 'docente05', 'docente05@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', (SELECT id FROM roles WHERE nombre = 'DOCENTE'), 'Lucía Fernanda', 'Ramírez Díaz', 'ACTIVO'),
(UUID(), 'docente06', 'docente06@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', (SELECT id FROM roles WHERE nombre = 'DOCENTE'), 'Miguel Ángel', 'Vargas Castro', 'ACTIVO');

-- 3. ESTRUCTURA ACADÉMICA
USE sga_academico;

-- Grados
INSERT INTO grados (id, nombre, nivel, orden, descripcion) VALUES
(UUID(), '1° Primaria', 'PRIMARIA', 1, 'Primer grado de primaria'),
(UUID(), '2° Primaria', 'PRIMARIA', 2, 'Segundo grado de primaria'),
(UUID(), '5° Secundaria', 'SECUNDARIA', 5, 'Quinto año de secundaria');

-- Cursos
INSERT INTO cursos (id, codigo, nombre, descripcion, horas_semanales) VALUES
(UUID(), 'MAT', 'Matemática', 'Matemática general', 5),
(UUID(), 'COM', 'Comunicación', 'Lenguaje y comunicación', 5),
(UUID(), 'CTA', 'Ciencia y Tecnología', 'Ciencias naturales y tecnología', 4),
(UUID(), 'PSO', 'Personal Social', 'Ciencias sociales y ciudadanía', 4),
(UUID(), 'ING', 'Inglés', 'Idioma inglés', 3),
(UUID(), 'FIS', 'Física', 'Física general', 4),
(UUID(), 'QUI', 'Química', 'Química general', 4);

-- Configurar variables
SET @grado1 = (SELECT id FROM grados WHERE nombre = '1° Primaria' LIMIT 1);
SET @grado2 = (SELECT id FROM grados WHERE nombre = '2° Primaria' LIMIT 1);
SET @grado_5_sec = (SELECT id FROM grados WHERE nombre = '5° Secundaria' LIMIT 1);

-- Secciones
INSERT INTO secciones (id, grado_id, nombre, año_escolar, capacidad_maxima) VALUES
(UUID(), @grado1, 'A', 2025, 30),
(UUID(), @grado1, 'B', 2025, 30),
(UUID(), @grado2, 'A', 2025, 30),
(UUID(), @grado2, 'B', 2025, 30),
(UUID(), @grado_5_sec, 'A', 2025, 35);

-- Períodos
INSERT INTO periodo_tipos (id, nombre, num_periodos, descripcion) VALUES
(UUID(), 'Bimestral', 4, 'Año escolar dividido en 4 bimestres');

SET @tipo_bimestral = (SELECT id FROM periodo_tipos WHERE nombre = 'Bimestral' LIMIT 1);

INSERT INTO periodos (id, año_escolar, tipo_id, numero, nombre, fecha_inicio, fecha_fin) VALUES
(UUID(), 2025, @tipo_bimestral, 1, 'I Bimestre 2025', '2025-03-01', '2025-05-10'),
(UUID(), 2025, @tipo_bimestral, 2, 'II Bimestre 2025', '2025-05-13', '2025-07-26');

-- Escalas de calificación
INSERT INTO escalas_calificacion (id, nombre, tipo, valor_minimo, valor_maximo, descripcion) VALUES
(UUID(), 'Vigesimal', 'NUMERICA', 0.00, 20.00, 'Escala del 0 al 20 - Sistema peruano');

-- Configurar más variables
SET @docente1 = (SELECT id FROM usuarios WHERE username = 'docente01' LIMIT 1);
SET @docente2 = (SELECT id FROM usuarios WHERE username = 'docente02' LIMIT 1);
SET @docente3 = (SELECT id FROM usuarios WHERE username = 'docente03' LIMIT 1);
SET @docente4 = (SELECT id FROM usuarios WHERE username = 'docente04' LIMIT 1);
SET @docente5 = (SELECT id FROM usuarios WHERE username = 'docente05' LIMIT 1);
SET @docente6 = (SELECT id FROM usuarios WHERE username = 'docente06' LIMIT 1);
SET @docente_demo_id = (SELECT id FROM usuarios WHERE username = 'docente' LIMIT 1);

SET @curso_mat = (SELECT id FROM cursos WHERE codigo = 'MAT' LIMIT 1);
SET @curso_com = (SELECT id FROM cursos WHERE codigo = 'COM' LIMIT 1);
SET @curso_cta = (SELECT id FROM cursos WHERE codigo = 'CTA' LIMIT 1);
SET @curso_pso = (SELECT id FROM cursos WHERE codigo = 'PSO' LIMIT 1);
SET @curso_ing = (SELECT id FROM cursos WHERE codigo = 'ING' LIMIT 1);
SET @curso_fis = (SELECT id FROM cursos WHERE codigo = 'FIS' LIMIT 1);
SET @curso_qui = (SELECT id FROM cursos WHERE codigo = 'QUI' LIMIT 1);

SET @seccion1 = (SELECT id FROM secciones WHERE grado_id = @grado1 AND nombre = 'A' LIMIT 1);
SET @seccion2 = (SELECT id FROM secciones WHERE grado_id = @grado1 AND nombre = 'B' LIMIT 1);
SET @seccion3 = (SELECT id FROM secciones WHERE grado_id = @grado2 AND nombre = 'A' LIMIT 1);
SET @seccion4 = (SELECT id FROM secciones WHERE grado_id = @grado2 AND nombre = 'B' LIMIT 1);
SET @seccion_5_sec_a = (SELECT id FROM secciones WHERE grado_id = @grado_5_sec AND nombre = 'A' LIMIT 1);

SET @periodo1 = (SELECT id FROM periodos WHERE numero = 1 LIMIT 1);
SET @periodo2 = (SELECT id FROM periodos WHERE numero = 2 LIMIT 1);

-- Clases para 1° y 2° Primaria
INSERT INTO clases (id, curso_id, seccion_id, periodo_id, docente_user_id) VALUES
-- 1° Primaria A
(UUID(), @curso_mat, @seccion1, @periodo1, @docente1),
(UUID(), @curso_com, @seccion1, @periodo1, @docente2),
(UUID(), @curso_cta, @seccion1, @periodo1, @docente3),
(UUID(), @curso_pso, @seccion1, @periodo1, @docente4),
(UUID(), @curso_ing, @seccion1, @periodo1, @docente5),
-- 1° Primaria B
(UUID(), @curso_mat, @seccion2, @periodo1, @docente1),
(UUID(), @curso_com, @seccion2, @periodo1, @docente2),
-- 2° Primaria A
(UUID(), @curso_mat, @seccion3, @periodo1, @docente6),
(UUID(), @curso_com, @seccion3, @periodo1, @docente2),
-- 2° Primaria B
(UUID(), @curso_mat, @seccion4, @periodo1, @docente6),
(UUID(), @curso_com, @seccion4, @periodo1, @docente2);

-- Clases para Usuario Demo (5° Secundaria)
INSERT INTO clases (id, curso_id, seccion_id, periodo_id, docente_user_id) VALUES
(UUID(), @curso_mat, @seccion_5_sec_a, @periodo1, @docente_demo_id),
(UUID(), @curso_com, @seccion_5_sec_a, @periodo1, @docente_demo_id),
(UUID(), @curso_fis, @seccion_5_sec_a, @periodo1, @docente_demo_id),
(UUID(), @curso_qui, @seccion_5_sec_a, @periodo1, @docente_demo_id);

-- 4. ALUMNOS Y PADRES
USE sga_personas;

-- Alumnos para 1° Primaria A (10 alumnos)
INSERT INTO alumnos (id, codigo_alumno, dni, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, genero, email) VALUES
(UUID(), 'A2025001', '70001001', 'Juan Carlos', 'Pérez', 'García', '2018-05-10', 'M', 'juan.perez@estudiante.com'),
(UUID(), 'A2025002', '70001002', 'María Fernanda', 'López', 'Martínez', '2018-03-15', 'F', 'maria.lopez@estudiante.com'),
(UUID(), 'A2025003', '70001003', 'Pedro Antonio', 'Rodríguez', 'Sánchez', '2018-08-20', 'M', 'pedro.rodriguez@estudiante.com'),
(UUID(), 'A2025004', '70001004', 'Ana Lucía', 'Torres', 'Díaz', '2018-11-05', 'F', 'ana.torres@estudiante.com'),
(UUID(), 'A2025005', '70001005', 'Luis Miguel', 'Ramírez', 'Flores', '2018-02-28', 'M', 'luis.ramirez@estudiante.com'),
(UUID(), 'A2025006', '70001006', 'Sofía Isabel', 'Castro', 'Vega', '2018-07-14', 'F', 'sofia.castro@estudiante.com'),
(UUID(), 'A2025007', '70001007', 'Diego Alejandro', 'Mendoza', 'Ruiz', '2018-04-22', 'M', 'diego.mendoza@estudiante.com'),
(UUID(), 'A2025008', '70001008', 'Valentina', 'Herrera', 'Morales', '2018-09-18', 'F', 'valentina.herrera@estudiante.com'),
(UUID(), 'A2025009', '70001009', 'Mateo', 'Vargas', 'Ortiz', '2018-01-30', 'M', 'mateo.vargas@estudiante.com'),
(UUID(), 'A2025010', '70001010', 'Camila', 'Silva', 'Paredes', '2018-06-12', 'F', 'camila.silva@estudiante.com');

-- Padres para los alumnos (10 padres)
INSERT INTO padres (id, dni, nombres, apellido_paterno, apellido_materno, email, celular, ocupacion) VALUES
(UUID(), '40001001', 'Carlos Alberto', 'Pérez', 'Ruiz', 'carlos.perez@email.com', '987654001', 'Ingeniero'),
(UUID(), '40001002', 'Rosa María', 'García', 'Flores', 'rosa.garcia@email.com', '987654002', 'Profesora'),
(UUID(), '40001003', 'José Luis', 'López', 'Castro', 'jose.lopez@email.com', '987654003', 'Contador'),
(UUID(), '40001004', 'Carmen Elena', 'Martínez', 'Vera', 'carmen.martinez@email.com', '987654004', 'Médica'),
(UUID(), '40001005', 'Miguel Ángel', 'Rodríguez', 'Quispe', 'miguel.rodriguez@email.com', '987654005', 'Abogado'),
(UUID(), '40001006', 'Patricia Isabel', 'Sánchez', 'Huamán', 'patricia.sanchez@email.com', '987654006', 'Arquitecta'),
(UUID(), '40001007', 'Roberto José', 'Torres', 'Mendoza', 'roberto.torres@email.com', '987654007', 'Empresario'),
(UUID(), '40001008', 'Lucía Fernanda', 'Díaz', 'Vargas', 'lucia.diaz@email.com', '987654008', 'Enfermera'),
(UUID(), '40001009', 'Eduardo Luis', 'Ramírez', 'Silva', 'eduardo.ramirez@email.com', '987654009', 'Comerciante'),
(UUID(), '40001010', 'Ana Patricia', 'Flores', 'Paredes', 'ana.flores@email.com', '987654010', 'Psicóloga');

-- Usuario Padre Demo
SET @padre_demo_id = (SELECT id FROM sga_iam.usuarios WHERE username = 'padre' LIMIT 1);

INSERT INTO padres (id, dni, nombres, apellido_paterno, apellido_materno, email, celular, ocupacion) VALUES
(@padre_demo_id, '99999999', 'Padre', 'Demo', 'Sistema', 'padre@colegio.com', '999999999', 'Tester');

-- Alumno Demo
SET @alumno_demo_id = UUID();
INSERT INTO alumnos (id, codigo_alumno, dni, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, genero, email) VALUES
(@alumno_demo_id, 'DEMO2025', '88888888', 'Pepito', 'Demo', 'Hijo', '2010-01-01', 'M', 'pepito.demo@estudiante.com');

-- Relaciones padre-alumno
INSERT INTO relaciones_padre_alumno (id, padre_id, alumno_id, tipo_relacion, es_contacto_principal)
SELECT 
    UUID(),
    p.id,
    a.id,
    'PADRE',
    TRUE
FROM (
    SELECT id, codigo_alumno, 
           ROW_NUMBER() OVER (ORDER BY codigo_alumno) as alumno_num
    FROM alumnos
    WHERE codigo_alumno LIKE 'A2025%'
) a
JOIN (
    SELECT id, dni,
           ROW_NUMBER() OVER (ORDER BY dni) as padre_num
    FROM padres
    WHERE dni BETWEEN '40001001' AND '40001010'
) p ON a.alumno_num = p.padre_num;

-- Relación Padre Demo - Alumno Demo
INSERT INTO relaciones_padre_alumno (id, padre_id, alumno_id, tipo_relacion, es_contacto_principal) VALUES
(UUID(), @padre_demo_id, @alumno_demo_id, 'PADRE', TRUE);

-- Matrículas para 1° Primaria A
INSERT INTO matriculas_clase (id, alumno_id, clase_id, fecha_matricula)
SELECT 
    UUID(),
    a.id,
    c.id,
    '2025-03-01'
FROM alumnos a
CROSS JOIN clases c
WHERE a.codigo_alumno BETWEEN 'A2025001' AND 'A2025010'
  AND c.seccion_id = @seccion1
  AND c.periodo_id = @periodo1;

-- Matrículas para Usuario Demo
INSERT INTO matriculas_clase (id, alumno_id, clase_id, fecha_matricula)
SELECT 
    UUID(),
    @alumno_demo_id,
    c.id,
    '2025-03-01'
FROM clases c
WHERE c.docente_user_id = @docente_demo_id;

-- 5. TIPOS DE EVALUACIÓN Y NOTAS
USE sga_notas;

-- Tipos de evaluación
INSERT INTO tipos_evaluacion (id, nombre, codigo, peso_default, descripcion) VALUES
(UUID(), 'Examen Bimestral', 'EXA', 40.00, 'Evaluación principal del bimestre'),
(UUID(), 'Práctica Calificada', 'PRA', 30.00, 'Práctica escrita en clase'),
(UUID(), 'Tarea', 'TAR', 15.00, 'Tareas y trabajos para casa'),
(UUID(), 'Participación', 'PAR', 15.00, 'Participación en clase');

-- Variables para notas
SET @tipo_examen = (SELECT id FROM tipos_evaluacion WHERE codigo = 'EXA' LIMIT 1);
SET @tipo_practica = (SELECT id FROM tipos_evaluacion WHERE codigo = 'PRA' LIMIT 1);
SET @tipo_tarea = (SELECT id FROM tipos_evaluacion WHERE codigo = 'TAR' LIMIT 1);
SET @escala_vigesimal = (SELECT id FROM sga_academico.escalas_calificacion WHERE nombre = 'Vigesimal' LIMIT 1);

-- NOTAS PARA 1° PRIMARIA A - MATEMÁTICA (MÚLTIPLES COLUMNAS)
SET @clase_mat_1a = (SELECT id FROM sga_academico.clases WHERE curso_id = @curso_mat AND seccion_id = @seccion1 AND periodo_id = @periodo1 LIMIT 1);

-- Matemática N1 (Examen)
INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id, columna_nota, metadata_json)
SELECT 
    UUID(),
    m.id,
    @periodo1,
    @tipo_examen,
    @escala_vigesimal,
    CASE 
        WHEN ROW_NUMBER() OVER() <= 2 THEN FLOOR(5 + RAND() * 6)   -- 2 desaprobados
        WHEN ROW_NUMBER() OVER() <= 5 THEN FLOOR(11 + RAND() * 3)  -- 3 aprobado bajo
        WHEN ROW_NUMBER() OVER() <= 8 THEN FLOOR(14 + RAND() * 3)  -- 3 bueno
        ELSE FLOOR(17 + RAND() * 4)                               -- 2 excelente
    END,
    'Examen Bimestral',
    CURDATE(),
    @docente1,
    'N1',
    JSON_OBJECT('tipo', 'examen_bimestral', 'curso', 'matematica')
FROM sga_personas.matriculas_clase m
WHERE m.clase_id = @clase_mat_1a
LIMIT 10;

-- Matemática N2 (Práctica)
INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id, columna_nota, metadata_json)
SELECT 
    UUID(),
    m.id,
    @periodo1,
    @tipo_practica,
    @escala_vigesimal,
    FLOOR(8 + RAND() * 13),
    'Práctica Calificada',
    CURDATE(),
    @docente1,
    'N2',
    JSON_OBJECT('tipo', 'practica_calificada', 'curso', 'matematica')
FROM sga_personas.matriculas_clase m
WHERE m.clase_id = @clase_mat_1a
LIMIT 10;

-- Matemática N3 (Tarea)
INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id, columna_nota, metadata_json)
SELECT 
    UUID(),
    m.id,
    @periodo1,
    @tipo_tarea,
    @escala_vigesimal,
    FLOOR(12 + RAND() * 9),
    'Tareas del Bimestre',
    CURDATE(),
    @docente1,
    'N3',
    JSON_OBJECT('tipo', 'tarea', 'curso', 'matematica')
FROM sga_personas.matriculas_clase m
WHERE m.clase_id = @clase_mat_1a
LIMIT 10;

-- NOTAS PARA 1° PRIMARIA A - COMUNICACIÓN
SET @clase_com_1a = (SELECT id FROM sga_academico.clases WHERE curso_id = @curso_com AND seccion_id = @seccion1 AND periodo_id = @periodo1 LIMIT 1);

-- Comunicación N1
INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id, columna_nota, metadata_json)
SELECT 
    UUID(),
    m.id,
    @periodo1,
    @tipo_examen,
    @escala_vigesimal,
    FLOOR(9 + RAND() * 12),
    'Comprensión Lectora',
    CURDATE(),
    @docente2,
    'N1',
    JSON_OBJECT('tipo', 'comprension_lectora', 'curso', 'comunicacion')
FROM sga_personas.matriculas_clase m
WHERE m.clase_id = @clase_com_1a
LIMIT 10;

-- Comunicación N2
INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id, columna_nota, metadata_json)
SELECT 
    UUID(),
    m.id,
    @periodo1,
    @tipo_practica,
    @escala_vigesimal,
    FLOOR(11 + RAND() * 10),
    'Redacción de Textos',
    CURDATE(),
    @docente2,
    'N2',
    JSON_OBJECT('tipo', 'redaccion', 'curso', 'comunicacion')
FROM sga_personas.matriculas_clase m
WHERE m.clase_id = @clase_com_1a
LIMIT 10;

-- NOTAS PARA USUARIO DEMO (MÚLTIPLES CURSOS CON MÚLTIPLES COLUMNAS)
-- Matemática Demo
SET @clase_demo_mat = (SELECT id FROM sga_academico.clases WHERE docente_user_id = @docente_demo_id AND curso_id = @curso_mat LIMIT 1);
SET @matricula_demo_mat = (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = @alumno_demo_id AND clase_id = @clase_demo_mat LIMIT 1);

INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id, columna_nota, metadata_json) VALUES
(UUID(), @matricula_demo_mat, @periodo1, @tipo_examen, @escala_vigesimal, 16.00, 'Buen trabajo en el examen', CURDATE(), @docente_demo_id, 'N1', JSON_OBJECT('tipo', 'examen_demo', 'usuario', 'demo')),
(UUID(), @matricula_demo_mat, @periodo1, @tipo_practica, @escala_vigesimal, 18.00, 'Excelente práctica calificada', CURDATE(), @docente_demo_id, 'N2', JSON_OBJECT('tipo', 'practica_demo', 'usuario', 'demo')),
(UUID(), @matricula_demo_mat, @periodo1, @tipo_tarea, @escala_vigesimal, 15.00, 'Tareas completas y ordenadas', CURDATE(), @docente_demo_id, 'N3', JSON_OBJECT('tipo', 'tarea_demo', 'usuario', 'demo'));

-- Comunicación Demo
SET @clase_demo_com = (SELECT id FROM sga_academico.clases WHERE docente_user_id = @docente_demo_id AND curso_id = @curso_com LIMIT 1);
SET @matricula_demo_com = (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = @alumno_demo_id AND clase_id = @clase_demo_com LIMIT 1);

INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id, columna_nota, metadata_json) VALUES
(UUID(), @matricula_demo_com, @periodo1, @tipo_examen, @escala_vigesimal, 17.00, 'Excelente comprensión lectora', CURDATE(), @docente_demo_id, 'N1', JSON_OBJECT('tipo', 'comprension', 'usuario', 'demo')),
(UUID(), @matricula_demo_com, @periodo1, @tipo_practica, @escala_vigesimal, 15.50, 'Buena redacción', CURDATE(), @docente_demo_id, 'N2', JSON_OBJECT('tipo', 'redaccion', 'usuario', 'demo'));

-- Física Demo (incluye nota desaprobada para pruebas)
SET @clase_demo_fis = (SELECT id FROM sga_academico.clases WHERE docente_user_id = @docente_demo_id AND curso_id = @curso_fis LIMIT 1);
SET @matricula_demo_fis = (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = @alumno_demo_id AND clase_id = @clase_demo_fis LIMIT 1);

INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id, columna_nota, metadata_json) VALUES
(UUID(), @matricula_demo_fis, @periodo1, @tipo_practica, @escala_vigesimal, 08.00, 'Necesita reforzar conceptos', CURDATE(), @docente_demo_id, 'N1', JSON_OBJECT('tipo', 'practica_demo', 'usuario', 'demo', 'alerta', 'desaprobado')),
(UUID(), @matricula_demo_fis, @periodo1, @tipo_examen, @escala_vigesimal, 12.00, 'Mejora notable en el examen', CURDATE(), @docente_demo_id, 'N2', JSON_OBJECT('tipo', 'examen_demo', 'usuario', 'demo'));

-- Química Demo
SET @clase_demo_qui = (SELECT id FROM sga_academico.clases WHERE docente_user_id = @docente_demo_id AND curso_id = @curso_qui LIMIT 1);
SET @matricula_demo_qui = (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = @alumno_demo_id AND clase_id = @clase_demo_qui LIMIT 1);

INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id, columna_nota, metadata_json) VALUES
(UUID(), @matricula_demo_qui, @periodo1, @tipo_examen, @escala_vigesimal, 14.00, 'Domina las fórmulas básicas', CURDATE(), @docente_demo_id, 'N1', JSON_OBJECT('tipo', 'teoria', 'usuario', 'demo')),
(UUID(), @matricula_demo_qui, @periodo1, @tipo_practica, @escala_vigesimal, 16.50, 'Excelente en laboratorio', CURDATE(), @docente_demo_id, 'N2', JSON_OBJECT('tipo', 'laboratorio', 'usuario', 'demo'));

-- Commit de todos los cambios
COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Seed actualizado aplicado exitosamente!' AS mensaje,
       'Compatible con sistema multicurso dinámico' AS estado,
       'Datos incluyen columna_nota y metadata_json' AS detalle;