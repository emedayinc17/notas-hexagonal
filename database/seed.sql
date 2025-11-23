-- ============================================================================
-- SEED DATA CORREGIDO - Sistema de Gestión Académica (SGA)
-- ============================================================================
-- Datos de prueba esenciales con dependencias correctas
-- Compatible con sistema multicurso dinámico (columna_nota y metadata_json)
-- ============================================================================

-- Configuración de transacción para consistencia
SET FOREIGN_KEY_CHECKS = 0;
SET autocommit = 0;
START TRANSACTION;

-- ============================================================================
-- 1. IAM SERVICE - ROLES Y USUARIOS
-- ============================================================================
USE sga_iam;

-- ============================================================================
-- AGREGAR ROLES FALTANTES (bootstrap.sql ya tiene ADMIN, DOCENTE, PADRE)
-- ============================================================================
-- Obtener IDs de roles existentes
SET @rol_admin_id = (SELECT id FROM roles WHERE nombre = 'ADMIN' LIMIT 1);
SET @rol_docente_id = (SELECT id FROM roles WHERE nombre = 'DOCENTE' LIMIT 1);
SET @rol_padre_id = (SELECT id FROM roles WHERE nombre = 'PADRE' LIMIT 1);

-- Agregar solo roles faltantes
INSERT INTO roles (id, nombre, descripcion) VALUES
('44444444-4444-4444-4444-444444444444', 'ALUMNO', 'Estudiante con acceso a sus notas'),
('55555555-5555-5555-5555-555555555555', 'DIRECTOR', 'Director con acceso administrativo');

-- ============================================================================
-- USUARIOS DEMO PARA FRONTEND (Quick Login)
-- ============================================================================
-- Usuario Demo DOCENTE (Password: Docente123!)
INSERT INTO usuarios (id, username, email, password_hash, rol_id, nombres, apellidos, status) VALUES
('DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'docente', 'docente@colegio.com', '$2b$12$8bQb4i/ZrpiYhrWTRxqQD.KEKE95/HYPjuXgF9KTVjk8ggTQNhbna', @rol_docente_id, 'Docente', 'Demo', 'ACTIVO');

-- Usuario Demo PADRE (Password: Padre123!)
INSERT INTO usuarios (id, username, email, password_hash, rol_id, nombres, apellidos, status) VALUES
('PPPPPPPP-PPPP-PPPP-PPPP-PPPPPPPPPPPP', 'padre', 'padre@colegio.com', '$2b$12$hgqIgxfjhRyLZZxdB5EcqeTHLartAymtoCPm1R3.giZhiCqc1NI9S', @rol_padre_id, 'Padre', 'Demo', 'ACTIVO');

-- Docentes adicionales (Password: docente123)
INSERT INTO usuarios (id, username, email, password_hash, rol_id, nombres, apellidos, status) VALUES
('D0000001-0001-0001-0001-000000000001', 'docente01', 'docente01@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', @rol_docente_id, 'María Elena', 'Rodríguez Sánchez', 'ACTIVO'),
('D0000002-0002-0002-0002-000000000002', 'docente02', 'docente02@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', @rol_docente_id, 'Carlos Alberto', 'Méndez Torres', 'ACTIVO'),
('D0000003-0003-0003-0003-000000000003', 'docente03', 'docente03@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', @rol_docente_id, 'Ana Patricia', 'Gonzáles Vega', 'ACTIVO'),
('D0000004-0004-0004-0004-000000000004', 'docente04', 'docente04@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', @rol_docente_id, 'Roberto José', 'Castillo Flores', 'ACTIVO');

-- ============================================================================
-- 2. ACADÉMICO SERVICE - ESTRUCTURA ACADÉMICA
-- ============================================================================
USE sga_academico;

-- ============================================================================
-- COMPLETAR DATOS ACADÉMICOS FALTANTES DEL BOOTSTRAP
-- ============================================================================

-- Tipos de periodo (bootstrap los tiene comentados - DESCOMENTAREMOS)
INSERT INTO periodo_tipos (id, nombre, num_periodos, descripcion) VALUES
('T0000001-0001-0001-0001-000000000001', 'Bimestral', 4, 'Año escolar dividido en 4 bimestres');

-- Grados COMPLETOS (bootstrap los tiene COMENTADOS - necesitamos crearlos todos)
INSERT INTO grados (id, nombre, nivel, orden, descripcion) VALUES
('G0000001-0001-0001-0001-000000000001', '1° Primaria', 'PRIMARIA', 1, 'Primer grado de primaria'),
('G0000002-0002-0002-0002-000000000002', '2° Primaria', 'PRIMARIA', 2, 'Segundo grado de primaria'),
('G0000003-0003-0003-0003-000000000003', '3° Primaria', 'PRIMARIA', 3, 'Tercer grado de primaria'),
('G0000004-0004-0004-0004-000000000004', '4° Primaria', 'PRIMARIA', 4, 'Cuarto grado de primaria'),
('G0000005-0005-0005-0005-000000000005', '5° Primaria', 'PRIMARIA', 5, 'Quinto grado de primaria'),
('G0000006-0006-0006-0006-000000000006', '6° Primaria', 'PRIMARIA', 6, 'Sexto grado de primaria'),
('G0000011-0011-0011-0011-000000000011', '1° Secundaria', 'SECUNDARIA', 1, 'Primer año de secundaria'),
('G0000012-0012-0012-0012-000000000012', '2° Secundaria', 'SECUNDARIA', 2, 'Segundo año de secundaria'),
('G0000013-0013-0013-0013-000000000013', '3° Secundaria', 'SECUNDARIA', 3, 'Tercer año de secundaria'),
('G0000014-0014-0014-0014-000000000014', '4° Secundaria', 'SECUNDARIA', 4, 'Cuarto año de secundaria'),
('G0000015-0015-0015-0015-000000000015', '5° Secundaria', 'SECUNDARIA', 5, 'Quinto año de secundaria');

-- Cursos completos (bootstrap los tiene comentados)
INSERT INTO cursos (id, codigo, nombre, descripcion, horas_semanales) VALUES
('C0000001-0001-0001-0001-000000000001', 'MAT', 'Matemática', 'Matemática general', 5),
('C0000002-0002-0002-0002-000000000002', 'COM', 'Comunicación', 'Lenguaje y comunicación', 5),
('C0000003-0003-0003-0003-000000000003', 'CTA', 'Ciencia y Tecnología', 'Ciencias naturales y tecnología', 4),
('C0000004-0004-0004-0004-000000000004', 'PSO', 'Personal Social', 'Ciencias sociales y ciudadanía', 4),
('C0000005-0005-0005-0005-000000000005', 'ART', 'Arte y Cultura', 'Educación artística y cultural', 3),
('C0000006-0006-0006-0006-000000000006', 'EDF', 'Educación Física', 'Desarrollo corporal y deportes', 3),
('C0000007-0007-0007-0007-000000000007', 'ING', 'Inglés', 'Idioma extranjero', 3),
('C0000008-0008-0008-0008-000000000008', 'REL', 'Educación Religiosa', 'Formación religiosa', 2),
('C0000009-0009-0009-0009-000000000009', 'FIS', 'Física', 'Física general', 4),
('C0000010-0010-0010-0010-000000000010', 'QUI', 'Química', 'Química general', 4),
('C0000011-0011-0011-0011-000000000011', 'BIO', 'Biología', 'Ciencias biológicas', 4),
('C0000012-0012-0012-0012-000000000012', 'HIS', 'Historia', 'Historia del Perú y universal', 3),
('C0000013-0013-0013-0013-000000000013', 'GEO', 'Geografía', 'Geografía del Perú y mundial', 3),
('C0000014-0014-0014-0014-000000000014', 'ECO', 'Economía', 'Principios económicos', 2),
('C0000015-0015-0015-0015-000000000015', 'FIL', 'Filosofía', 'Pensamiento filosófico', 2);

-- Secciones usando grados que acabamos de crear
INSERT INTO secciones (id, grado_id, nombre, año_escolar, capacidad_maxima) VALUES
-- 1° Primaria
('S0000001-0001-0001-0001-000000000001', 'G0000001-0001-0001-0001-000000000001', 'A', 2025, 30),
('S0000002-0002-0002-0002-000000000002', 'G0000001-0001-0001-0001-000000000001', 'B', 2025, 30),
-- 2° Primaria
('S0000003-0003-0003-0003-000000000003', 'G0000002-0002-0002-0002-000000000002', 'A', 2025, 30),
('S0000004-0004-0004-0004-000000000004', 'G0000002-0002-0002-0002-000000000002', 'B', 2025, 30),
-- 3° Primaria
('S0000005-0005-0005-0005-000000000005', 'G0000003-0003-0003-0003-000000000003', 'A', 2025, 30),
-- 5° Secundaria para demo
('S0000015-0015-0015-0015-000000000015', 'G0000015-0015-0015-0015-000000000015', 'A', 2025, 35),
('S0000016-0016-0016-0016-000000000016', 'G0000015-0015-0015-0015-000000000015', 'B', 2025, 35);

-- Períodos para el año 2025
INSERT INTO periodos (id, año_escolar, tipo_id, numero, nombre, fecha_inicio, fecha_fin) VALUES
('P0000001-0001-0001-0001-000000000001', 2025, 'T0000001-0001-0001-0001-000000000001', 1, 'I Bimestre 2025', '2025-03-01', '2025-05-10'),
('P0000002-0002-0002-0002-000000000002', 2025, 'T0000001-0001-0001-0001-000000000001', 2, 'II Bimestre 2025', '2025-05-13', '2025-07-26'),
('P0000003-0003-0003-0003-000000000003', 2025, 'T0000001-0001-0001-0001-000000000001', 3, 'III Bimestre 2025', '2025-08-01', '2025-10-15'),
('P0000004-0004-0004-0004-000000000004', 2025, 'T0000001-0001-0001-0001-000000000001', 4, 'IV Bimestre 2025', '2025-10-16', '2025-12-20');

-- Clases para demostrar múltiples flujos (usar variables de grados)
INSERT INTO clases (id, curso_id, seccion_id, periodo_id, docente_user_id) VALUES
-- 1° Primaria A - I Bimestre
('CL000001-0001-0001-0001-000000000001', 'C0000001-0001-0001-0001-000000000001', 'S0000001-0001-0001-0001-000000000001', 'P0000001-0001-0001-0001-000000000001', 'D0000001-0001-0001-0001-000000000001'),
('CL000002-0002-0002-0002-000000000002', 'C0000002-0002-0002-0002-000000000002', 'S0000001-0001-0001-0001-000000000001', 'P0000001-0001-0001-0001-000000000001', 'D0000002-0002-0002-0002-000000000002'),
('CL000003-0003-0003-0003-000000000003', 'C0000003-0003-0003-0003-000000000003', 'S0000001-0001-0001-0001-000000000001', 'P0000001-0001-0001-0001-000000000001', 'D0000003-0003-0003-0003-000000000003'),
-- 1° Primaria B - I Bimestre  
('CL000004-0004-0004-0004-000000000004', 'C0000001-0001-0001-0001-000000000001', 'S0000002-0002-0002-0002-000000000002', 'P0000001-0001-0001-0001-000000000001', 'D0000001-0001-0001-0001-000000000001'),
('CL000005-0005-0005-0005-000000000005', 'C0000002-0002-0002-0002-000000000002', 'S0000002-0002-0002-0002-000000000002', 'P0000001-0001-0001-0001-000000000001', 'D0000002-0002-0002-0002-000000000002'),
-- 2° Primaria A - I Bimestre
('CL000006-0006-0006-0006-000000000006', 'C0000001-0001-0001-0001-000000000001', 'S0000003-0003-0003-0003-000000000003', 'P0000001-0001-0001-0001-000000000001', 'D0000001-0001-0001-0001-000000000001'),
('CL000007-0007-0007-0007-000000000007', 'C0000002-0002-0002-0002-000000000002', 'S0000003-0003-0003-0003-000000000003', 'P0000001-0001-0001-0001-000000000001', 'D0000002-0002-0002-0002-000000000002'),
-- Usuario Demo (5° Secundaria A) - I Bimestre
('CL000010-0010-0010-0010-000000000010', 'C0000001-0001-0001-0001-000000000001', 'S0000015-0015-0015-0015-000000000015', 'P0000001-0001-0001-0001-000000000001', 'DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD'),
('CL000011-0011-0011-0011-000000000011', 'C0000002-0002-0002-0002-000000000002', 'S0000015-0015-0015-0015-000000000015', 'P0000001-0001-0001-0001-000000000001', 'DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD'),
('CL000012-0012-0012-0012-000000000012', 'C0000009-0009-0009-0009-000000000009', 'S0000015-0015-0015-0015-000000000015', 'P0000001-0001-0001-0001-000000000001', 'DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD'),
('CL000013-0013-0013-0013-000000000013', 'C0000010-0010-0010-0010-000000000010', 'S0000015-0015-0015-0015-000000000015', 'P0000001-0001-0001-0001-000000000001', 'DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD'),
('CL000014-0014-0014-0014-000000000014', 'C0000011-0011-0011-0011-000000000011', 'S0000015-0015-0015-0015-000000000015', 'P0000001-0001-0001-0001-000000000001', 'D0000003-0003-0003-0003-000000000003'),
-- Usuario Demo - II Bimestre (para continuidad)
('CL000020-0020-0020-0020-000000000020', 'C0000001-0001-0001-0001-000000000001', 'S0000015-0015-0015-0015-000000000015', 'P0000002-0002-0002-0002-000000000002', 'DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD'),
('CL000021-0021-0021-0021-000000000021', 'C0000002-0002-0002-0002-000000000002', 'S0000015-0015-0015-0015-000000000015', 'P0000002-0002-0002-0002-000000000002', 'DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD');

-- Escalas de calificación completas (bootstrap las tiene comentadas)
INSERT INTO escalas_calificacion (id, nombre, tipo, valor_minimo, valor_maximo, descripcion) VALUES
('E0000001-0001-0001-0001-000000000001', 'Vigesimal', 'NUMERICA', 0.00, 20.00, 'Escala del 0 al 20 - Sistema peruano'),
('E0000002-0002-0002-0002-000000000002', 'Centesimal', 'NUMERICA', 0.00, 100.00, 'Escala del 0 al 100'),
('E0000003-0003-0003-0003-000000000003', 'Literal AD-A-B-C', 'LITERAL', NULL, NULL, 'Escala literal: AD, A, B, C');

-- Valores para escala literal
INSERT INTO valores_escala (id, escala_id, valor, equivalente_numerico, descripcion, orden) VALUES
(UUID(), 'E0000003-0003-0003-0003-000000000003', 'AD', 18.00, 'Logro destacado', 1),
(UUID(), 'E0000003-0003-0003-0003-000000000003', 'A', 14.00, 'Logro esperado', 2),
(UUID(), 'E0000003-0003-0003-0003-000000000003', 'B', 11.00, 'En proceso', 3),
(UUID(), 'E0000003-0003-0003-0003-000000000003', 'C', 8.00, 'En inicio', 4);

-- Umbrales de alerta
INSERT INTO umbrales_alerta (id, grado_id, curso_id, escala_id, valor_minimo_numerico, descripcion, activo) VALUES
(UUID(), NULL, NULL, 'E0000001-0001-0001-0001-000000000001', 11.00, 'Umbral global para escala 0-20: nota menor a 11', TRUE),
(UUID(), NULL, NULL, 'E0000002-0002-0002-0002-000000000002', 55.00, 'Umbral global para escala 0-100: nota menor a 55', TRUE);

-- ============================================================================
-- 3. PERSONAS SERVICE - ALUMNOS, PADRES Y MATRÍCULAS
-- ============================================================================
USE sga_personas;

-- Alumnos esenciales (10 alumnos)
INSERT INTO alumnos (id, codigo_alumno, dni, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, genero, email) VALUES
('A0000001-0001-0001-0001-000000000001', 'A2025001', '70001001', 'Juan Carlos', 'Pérez', 'García', '2018-05-10', 'M', 'juan.perez@estudiante.com'),
('A0000002-0002-0002-0002-000000000002', 'A2025002', '70001002', 'María Fernanda', 'López', 'Martínez', '2018-03-15', 'F', 'maria.lopez@estudiante.com'),
('A0000003-0003-0003-0003-000000000003', 'A2025003', '70001003', 'Pedro Antonio', 'Rodríguez', 'Sánchez', '2018-08-20', 'M', 'pedro.rodriguez@estudiante.com'),
('A0000004-0004-0004-0004-000000000004', 'A2025004', '70001004', 'Ana Lucía', 'Torres', 'Díaz', '2018-11-05', 'F', 'ana.torres@estudiante.com'),
('A0000005-0005-0005-0005-000000000005', 'A2025005', '70001005', 'Luis Miguel', 'Ramírez', 'Flores', '2018-02-28', 'M', 'luis.ramirez@estudiante.com'),
('A0000006-0006-0006-0006-000000000006', 'A2025006', '70001006', 'Sofía Isabel', 'Castro', 'Vega', '2018-07-14', 'F', 'sofia.castro@estudiante.com'),
('A0000007-0007-0007-0007-000000000007', 'A2025007', '70001007', 'Diego Alejandro', 'Mendoza', 'Ruiz', '2018-04-22', 'M', 'diego.mendoza@estudiante.com'),
('A0000008-0008-0008-0008-000000000008', 'A2025008', '70001008', 'Valentina', 'Herrera', 'Morales', '2018-09-18', 'F', 'valentina.herrera@estudiante.com'),
('A0000009-0009-0009-0009-000000000009', 'A2025009', '70001009', 'Mateo', 'Vargas', 'Ortiz', '2018-01-30', 'M', 'mateo.vargas@estudiante.com'),
('A0000010-0010-0010-0010-000000000010', 'A2025010', '70001010', 'Camila', 'Silva', 'Paredes', '2018-06-12', 'F', 'camila.silva@estudiante.com');

-- Alumnos adicionales para flujos completos (fechas coherentes por grado)
INSERT INTO alumnos (id, codigo_alumno, dni, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, genero, email) VALUES
('A0000011-0011-0011-0011-000000000011', 'A2025011', '70001011', 'Isabella', 'Morales', 'Fernández', '2018-04-03', 'F', 'isabella.morales@estudiante.com'),
('A0000012-0012-0012-0012-000000000012', 'A2025012', '70001012', 'Sebastián', 'Jiménez', 'Salinas', '2018-12-15', 'M', 'sebastian.jimenez@estudiante.com'),
('A0000013-0013-0013-0013-000000000013', 'A2025013', '70001013', 'Valeria', 'Rojas', 'Delgado', '2017-06-22', 'F', 'valeria.rojas@estudiante.com'),
('A0000014-0014-0014-0014-000000000014', 'A2025014', '70001014', 'Adrián', 'Gutiérrez', 'Luna', '2017-09-08', 'M', 'adrian.gutierrez@estudiante.com'),
('A0000015-0015-0015-0015-000000000015', 'A2025015', '70001015', 'Luciana', 'Valdez', 'Espinoza', '2017-02-14', 'F', 'luciana.valdez@estudiante.com');

-- Padres adicionales para flujos completos
INSERT INTO padres (id, dni, nombres, apellido_paterno, apellido_materno, email, celular, ocupacion) VALUES
('PA000006-0006-0006-0006-000000000006', '40001006', 'Eduardo', 'Morales', 'Vargas', 'eduardo.morales@email.com', '987654006', 'Arquitecto'),
('PA000007-0007-0007-0007-000000000007', '40001007', 'Patricia', 'Fernández', 'Salinas', 'patricia.fernandez@email.com', '987654007', 'Enfermera'),
('PA000008-0008-0008-0008-000000000008', '40001008', 'Roberto', 'Jiménez', 'Campos', 'roberto.jimenez@email.com', '987654008', 'Comerciante'),
('PA000009-0009-0009-0009-000000000009', '40001009', 'Silvia', 'Rojas', 'Herrera', 'silvia.rojas@email.com', '987654009', 'Psicóloga'),
('PA000010-0010-0010-0010-000000000010', '40001010', 'Fernando', 'Gutiérrez', 'Mendoza', 'fernando.gutierrez@email.com', '987654010', 'Electricista');

-- Padres esenciales
INSERT INTO padres (id, dni, nombres, apellido_paterno, apellido_materno, email, celular, ocupacion) VALUES
('PA000001-0001-0001-0001-000000000001', '40001001', 'Carlos Alberto', 'Pérez', 'Ruiz', 'carlos.perez@email.com', '987654001', 'Ingeniero'),
('PA000002-0002-0002-0002-000000000002', '40001002', 'Rosa María', 'García', 'Flores', 'rosa.garcia@email.com', '987654002', 'Profesora'),
('PA000003-0003-0003-0003-000000000003', '40001003', 'José Luis', 'López', 'Castro', 'jose.lopez@email.com', '987654003', 'Contador'),
('PA000004-0004-0004-0004-000000000004', '40001004', 'Carmen Elena', 'Martínez', 'Vera', 'carmen.martinez@email.com', '987654004', 'Médica'),
('PA000005-0005-0005-0005-000000000005', '40001005', 'Miguel Ángel', 'Rodríguez', 'Quispe', 'miguel.rodriguez@email.com', '987654005', 'Abogado');

-- Alumno Demo (Hijo del padre demo)
INSERT INTO alumnos (id, codigo_alumno, dni, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, genero, email) VALUES
('AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'DEMO2025', '88888888', 'Pepito', 'Demo', 'Hijo', '2010-01-01', 'M', 'pepito.demo@estudiante.com');

-- Relaciones padre-alumno COMPLETAS para flujos coherentes
INSERT INTO relaciones_padre_alumno (id, padre_id, alumno_id, tipo_relacion, es_contacto_principal) VALUES
(UUID(), 'PA000001-0001-0001-0001-000000000001', 'A0000001-0001-0001-0001-000000000001', 'PADRE', TRUE),
(UUID(), 'PA000002-0002-0002-0002-000000000002', 'A0000002-0002-0002-0002-000000000002', 'MADRE', TRUE),
(UUID(), 'PA000003-0003-0003-0003-000000000003', 'A0000003-0003-0003-0003-000000000003', 'PADRE', TRUE),
(UUID(), 'PA000004-0004-0004-0004-000000000004', 'A0000004-0004-0004-0004-000000000004', 'MADRE', TRUE),
(UUID(), 'PA000005-0005-0005-0005-000000000005', 'A0000005-0005-0005-0005-000000000005', 'PADRE', TRUE),
(UUID(), 'PA000006-0006-0006-0006-000000000006', 'A0000006-0006-0006-0006-000000000006', 'PADRE', TRUE),
(UUID(), 'PA000007-0007-0007-0007-000000000007', 'A0000007-0007-0007-0007-000000000007', 'MADRE', TRUE),
(UUID(), 'PA000008-0008-0008-0008-000000000008', 'A0000008-0008-0008-0008-000000000008', 'PADRE', TRUE),
(UUID(), 'PA000009-0009-0009-0009-000000000009', 'A0000009-0009-0009-0009-000000000009', 'MADRE', TRUE),
(UUID(), 'PA000010-0010-0010-0010-000000000010', 'A0000010-0010-0010-0010-000000000010', 'PADRE', TRUE),
(UUID(), 'PA000006-0006-0006-0006-000000000006', 'A0000011-0011-0011-0011-000000000011', 'PADRE', TRUE),
(UUID(), 'PA000008-0008-0008-0008-000000000008', 'A0000012-0012-0012-0012-000000000012', 'PADRE', TRUE),
(UUID(), 'PA000009-0009-0009-0009-000000000009', 'A0000013-0013-0013-0013-000000000013', 'MADRE', TRUE),
(UUID(), 'PA000010-0010-0010-0010-000000000010', 'A0000014-0014-0014-0014-000000000014', 'PADRE', TRUE),
-- Relación Padre Demo - Alumno Demo
(UUID(), 'PPPPPPPP-PPPP-PPPP-PPPP-PPPPPPPPPPPP', 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'PADRE', TRUE);

-- Padre Demo (usar mismo ID que usuario IAM)
INSERT INTO padres (id, dni, nombres, apellido_paterno, apellido_materno, email, celular, ocupacion) VALUES
('PPPPPPPP-PPPP-PPPP-PPPP-PPPPPPPPPPPP', '99999999', 'Padre', 'Demo', 'Sistema', 'padre@colegio.com', '999999999', 'Tester');

-- Matrículas COMPLETAS para flujos coherentes
INSERT INTO matriculas_clase (id, alumno_id, clase_id, fecha_matricula) VALUES
-- 1° Primaria A (Alumnos 1-5 en 3 clases = 15 matrículas)
(UUID(), 'A0000001-0001-0001-0001-000000000001', 'CL000001-0001-0001-0001-000000000001', '2025-03-01'),
(UUID(), 'A0000001-0001-0001-0001-000000000001', 'CL000002-0002-0002-0002-000000000002', '2025-03-01'),
(UUID(), 'A0000001-0001-0001-0001-000000000001', 'CL000003-0003-0003-0003-000000000003', '2025-03-01'),
(UUID(), 'A0000002-0002-0002-0002-000000000002', 'CL000001-0001-0001-0001-000000000001', '2025-03-01'),
(UUID(), 'A0000002-0002-0002-0002-000000000002', 'CL000002-0002-0002-0002-000000000002', '2025-03-01'),
(UUID(), 'A0000002-0002-0002-0002-000000000002', 'CL000003-0003-0003-0003-000000000003', '2025-03-01'),
(UUID(), 'A0000003-0003-0003-0003-000000000003', 'CL000001-0001-0001-0001-000000000001', '2025-03-01'),
(UUID(), 'A0000003-0003-0003-0003-000000000003', 'CL000002-0002-0002-0002-000000000002', '2025-03-01'),
(UUID(), 'A0000003-0003-0003-0003-000000000003', 'CL000003-0003-0003-0003-000000000003', '2025-03-01'),
(UUID(), 'A0000004-0004-0004-0004-000000000004', 'CL000001-0001-0001-0001-000000000001', '2025-03-01'),
(UUID(), 'A0000004-0004-0004-0004-000000000004', 'CL000002-0002-0002-0002-000000000002', '2025-03-01'),
(UUID(), 'A0000004-0004-0004-0004-000000000004', 'CL000003-0003-0003-0003-000000000003', '2025-03-01'),
(UUID(), 'A0000005-0005-0005-0005-000000000005', 'CL000001-0001-0001-0001-000000000001', '2025-03-01'),
(UUID(), 'A0000005-0005-0005-0005-000000000005', 'CL000002-0002-0002-0002-000000000002', '2025-03-01'),
(UUID(), 'A0000005-0005-0005-0005-000000000005', 'CL000003-0003-0003-0003-000000000003', '2025-03-01'),
-- 1° Primaria B (Alumnos 6-10 en 2 clases = 10 matrículas)
(UUID(), 'A0000006-0006-0006-0006-000000000006', 'CL000004-0004-0004-0004-000000000004', '2025-03-01'),
(UUID(), 'A0000006-0006-0006-0006-000000000006', 'CL000005-0005-0005-0005-000000000005', '2025-03-01'),
(UUID(), 'A0000007-0007-0007-0007-000000000007', 'CL000004-0004-0004-0004-000000000004', '2025-03-01'),
(UUID(), 'A0000007-0007-0007-0007-000000000007', 'CL000005-0005-0005-0005-000000000005', '2025-03-01'),
(UUID(), 'A0000008-0008-0008-0008-000000000008', 'CL000004-0004-0004-0004-000000000004', '2025-03-01'),
(UUID(), 'A0000008-0008-0008-0008-000000000008', 'CL000005-0005-0005-0005-000000000005', '2025-03-01'),
(UUID(), 'A0000009-0009-0009-0009-000000000009', 'CL000004-0004-0004-0004-000000000004', '2025-03-01'),
(UUID(), 'A0000009-0009-0009-0009-000000000009', 'CL000005-0005-0005-0005-000000000005', '2025-03-01'),
(UUID(), 'A0000010-0010-0010-0010-000000000010', 'CL000004-0004-0004-0004-000000000004', '2025-03-01'),
(UUID(), 'A0000010-0010-0010-0010-000000000010', 'CL000005-0005-0005-0005-000000000005', '2025-03-01'),
-- 2° Primaria A (Alumnos 11-15 en 2 clases = 10 matrículas)
(UUID(), 'A0000011-0011-0011-0011-000000000011', 'CL000006-0006-0006-0006-000000000006', '2025-03-01'),
(UUID(), 'A0000011-0011-0011-0011-000000000011', 'CL000007-0007-0007-0007-000000000007', '2025-03-01'),
(UUID(), 'A0000012-0012-0012-0012-000000000012', 'CL000006-0006-0006-0006-000000000006', '2025-03-01'),
(UUID(), 'A0000012-0012-0012-0012-000000000012', 'CL000007-0007-0007-0007-000000000007', '2025-03-01'),
(UUID(), 'A0000013-0013-0013-0013-000000000013', 'CL000006-0006-0006-0006-000000000006', '2025-03-01'),
(UUID(), 'A0000013-0013-0013-0013-000000000013', 'CL000007-0007-0007-0007-000000000007', '2025-03-01'),
(UUID(), 'A0000014-0014-0014-0014-000000000014', 'CL000006-0006-0006-0006-000000000006', '2025-03-01'),
(UUID(), 'A0000014-0014-0014-0014-000000000014', 'CL000007-0007-0007-0007-000000000007', '2025-03-01'),
(UUID(), 'A0000015-0015-0015-0015-000000000015', 'CL000006-0006-0006-0006-000000000006', '2025-03-01'),
(UUID(), 'A0000015-0015-0015-0015-000000000015', 'CL000007-0007-0007-0007-000000000007', '2025-03-01');

-- Matrículas para Usuario Demo (5 clases en 5° Secundaria A)
INSERT INTO matriculas_clase (id, alumno_id, clase_id, fecha_matricula) VALUES
(UUID(), 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'CL000010-0010-0010-0010-000000000010', '2025-03-01'),
(UUID(), 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'CL000011-0011-0011-0011-000000000011', '2025-03-01'),
(UUID(), 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'CL000012-0012-0012-0012-000000000012', '2025-03-01'),
(UUID(), 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'CL000013-0013-0013-0013-000000000013', '2025-03-01'),
(UUID(), 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'CL000014-0014-0014-0014-000000000014', '2025-03-01'),
-- Matrículas para II Bimestre
(UUID(), 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'CL000020-0020-0020-0020-000000000020', '2025-05-13'),
(UUID(), 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'CL000021-0021-0021-0021-000000000021', '2025-05-13');

-- ============================================================================
-- 4. NOTAS SERVICE - TIPOS DE EVALUACIÓN Y NOTAS CON SISTEMA DINÁMICO
-- ============================================================================
USE sga_notas;

-- Tipos de evaluación
INSERT INTO tipos_evaluacion (id, nombre, codigo, peso_default, descripcion) VALUES
('TE000001-0001-0001-0001-000000000001', 'Examen Bimestral', 'EXA', 40.00, 'Evaluación principal del bimestre'),
('TE000002-0002-0002-0002-000000000002', 'Práctica Calificada', 'PRA', 30.00, 'Práctica escrita en clase'),
('TE000003-0003-0003-0003-000000000003', 'Tarea', 'TAR', 15.00, 'Tareas y trabajos para casa'),
('TE000004-0004-0004-0004-000000000004', 'Participación', 'PAR', 15.00, 'Participación en clase');

-- ============================================================================
-- NOTAS CON SISTEMA DINÁMICO - COLUMNA_NOTA Y METADATA_JSON
-- ============================================================================

-- NOTAS PARA ALUMNO DEMO (MÚLTIPLES CURSOS CON MÚLTIPLES COLUMNAS)
-- Estas son las notas más importantes para probar la funcionalidad

-- Matemática Demo - Múltiples columnas
INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id, columna_nota, metadata_json) VALUES
('N0000001-0001-0001-0001-000000000001', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA' AND clase_id = 'CL000010-0010-0010-0010-000000000010'), 'P0000001-0001-0001-0001-000000000001', 'TE000001-0001-0001-0001-000000000001', 'E0000001-0001-0001-0001-000000000001', 16.00, 'Buen trabajo en el examen', CURDATE(), 'DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'N1', '{"tipo": "examen_demo", "usuario": "demo"}'),
('N0000002-0002-0002-0002-000000000002', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA' AND clase_id = 'CL000010-0010-0010-0010-000000000010'), 'P0000001-0001-0001-0001-000000000001', 'TE000002-0002-0002-0002-000000000002', 'E0000001-0001-0001-0001-000000000001', 18.00, 'Excelente práctica calificada', CURDATE(), 'DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'N2', '{"tipo": "practica_demo", "usuario": "demo"}'),
('N0000003-0003-0003-0003-000000000003', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA' AND clase_id = 'CL000010-0010-0010-0010-000000000010'), 'P0000001-0001-0001-0001-000000000001', 'TE000003-0003-0003-0003-000000000003', 'E0000001-0001-0001-0001-000000000001', 15.00, 'Tareas completas y ordenadas', CURDATE(), 'DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'N3', '{"tipo": "tarea_demo", "usuario": "demo"}');

-- Comunicación Demo - Múltiples columnas  
INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id, columna_nota, metadata_json) VALUES
('N0000004-0004-0004-0004-000000000004', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA' AND clase_id = 'CL000011-0011-0011-0011-000000000011'), 'P0000001-0001-0001-0001-000000000001', 'TE000001-0001-0001-0001-000000000001', 'E0000001-0001-0001-0001-000000000001', 17.00, 'Excelente comprensión lectora', CURDATE(), 'DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'N1', '{"tipo": "comprension", "usuario": "demo"}'),
('N0000005-0005-0005-0005-000000000005', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA' AND clase_id = 'CL000011-0011-0011-0011-000000000011'), 'P0000001-0001-0001-0001-000000000001', 'TE000002-0002-0002-0002-000000000002', 'E0000001-0001-0001-0001-000000000001', 15.50, 'Buena redacción', CURDATE(), 'DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'N2', '{"tipo": "redaccion", "usuario": "demo"}');

-- Física Demo - incluye nota desaprobada para pruebas
INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id, columna_nota, metadata_json) VALUES
('N0000006-0006-0006-0006-000000000006', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA' AND clase_id = 'CL000012-0012-0012-0012-000000000012'), 'P0000001-0001-0001-0001-000000000001', 'TE000002-0002-0002-0002-000000000002', 'E0000001-0001-0001-0001-000000000001', 08.00, 'Necesita reforzar conceptos', CURDATE(), 'DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'N1', '{"tipo": "practica_demo", "usuario": "demo", "alerta": "desaprobado"}'),
('N0000007-0007-0007-0007-000000000007', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA' AND clase_id = 'CL000012-0012-0012-0012-000000000012'), 'P0000001-0001-0001-0001-000000000001', 'TE000001-0001-0001-0001-000000000001', 'E0000001-0001-0001-0001-000000000001', 12.00, 'Mejora notable en el examen', CURDATE(), 'DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'N2', '{"tipo": "examen_demo", "usuario": "demo"}');

-- Biología Demo
INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id, columna_nota, metadata_json) VALUES
('N0000010-0010-0010-0010-000000000010', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA' AND clase_id = 'CL000014-0014-0014-0014-000000000014'), 'P0000001-0001-0001-0001-000000000001', 'TE000001-0001-0001-0001-000000000001', 'E0000001-0001-0001-0001-000000000001', 19.00, 'Excelente conocimiento en biología', CURDATE(), 'D0000003-0003-0003-0003-000000000003', 'N1', '{"tipo": "examen", "curso": "biologia"}'),
('N0000011-0011-0011-0011-000000000011', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA' AND clase_id = 'CL000014-0014-0014-0014-000000000014'), 'P0000001-0001-0001-0001-000000000001', 'TE000002-0002-0002-0002-000000000002', 'E0000001-0001-0001-0001-000000000001', 17.50, 'Muy buen trabajo en laboratorio', CURDATE(), 'D0000003-0003-0003-0003-000000000003', 'N2', '{"tipo": "laboratorio", "curso": "biologia"}');

-- ============================================================================
-- NOTAS PARA II BIMESTRE (CONTINUIDAD DEL SISTEMA)
-- ============================================================================

-- Matemática Demo - II Bimestre
INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id, columna_nota, metadata_json) VALUES
('N0000020-0020-0020-0020-000000000020', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA' AND clase_id = 'CL000020-0020-0020-0020-000000000020'), 'P0000002-0002-0002-0002-000000000002', 'TE000001-0001-0001-0001-000000000001', 'E0000001-0001-0001-0001-000000000001', 18.00, 'Mejora notable en II Bimestre', CURDATE(), 'DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'N1', '{"tipo": "examen_bimestre2", "usuario": "demo"}'),
('N0000021-0021-0021-0021-000000000021', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA' AND clase_id = 'CL000020-0020-0020-0020-000000000020'), 'P0000002-0002-0002-0002-000000000002', 'TE000002-0002-0002-0002-000000000002', 'E0000001-0001-0001-0001-000000000001', 16.50, 'Práctica sólida', CURDATE(), 'DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'N2', '{"tipo": "practica_bimestre2", "usuario": "demo"}');

-- Comunicación Demo - II Bimestre
INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id, columna_nota, metadata_json) VALUES
('N0000022-0022-0022-0022-000000000022', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA' AND clase_id = 'CL000021-0021-0021-0021-000000000021'), 'P0000002-0002-0002-0002-000000000002', 'TE000001-0001-0001-0001-000000000001', 'E0000001-0001-0001-0001-000000000001', 15.00, 'Análisis literario competente', CURDATE(), 'DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'N1', '{"tipo": "analisis_literario", "usuario": "demo"}');

-- ============================================================================
-- NOTAS PARA ALUMNOS DE PRIMARIA (FLUJOS COMPLETOS Y COHERENTES)
-- ============================================================================

-- Matemática 1° Primaria A - Alumnos 1-5, Columnas N1, N2, N3
INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id, columna_nota, metadata_json) VALUES
-- Alumno 1 - Matemática (Juan Carlos Pérez)
('N0001001-0001-0001-0001-000000000001', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'A0000001-0001-0001-0001-000000000001' AND clase_id = 'CL000001-0001-0001-0001-000000000001'), 'P0000001-0001-0001-0001-000000000001', 'TE000001-0001-0001-0001-000000000001', 'E0000001-0001-0001-0001-000000000001', 14.00, 'Examen Bimestral', CURDATE(), 'D0000001-0001-0001-0001-000000000001', 'N1', '{"tipo": "examen_bimestral", "curso": "matematica", "alumno": "Juan Carlos"}'),
('N0001002-0002-0002-0002-000000000002', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'A0000001-0001-0001-0001-000000000001' AND clase_id = 'CL000001-0001-0001-0001-000000000001'), 'P0000001-0001-0001-0001-000000000001', 'TE000002-0002-0002-0002-000000000002', 'E0000001-0001-0001-0001-000000000001', 16.00, 'Práctica Calificada', CURDATE(), 'D0000001-0001-0001-0001-000000000001', 'N2', '{"tipo": "practica_calificada", "curso": "matematica", "alumno": "Juan Carlos"}'),
('N0001003-0003-0003-0003-000000000003', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'A0000001-0001-0001-0001-000000000001' AND clase_id = 'CL000001-0001-0001-0001-000000000001'), 'P0000001-0001-0001-0001-000000000001', 'TE000003-0003-0003-0003-000000000003', 'E0000001-0001-0001-0001-000000000001', 18.00, 'Tareas del Bimestre', CURDATE(), 'D0000001-0001-0001-0001-000000000001', 'N3', '{"tipo": "tarea", "curso": "matematica", "alumno": "Juan Carlos"}'),

-- Alumno 2 - Matemática (María Fernanda López)
('N0002001-0001-0001-0001-000000000001', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'A0000002-0002-0002-0002-000000000002' AND clase_id = 'CL000001-0001-0001-0001-000000000001'), 'P0000001-0001-0001-0001-000000000001', 'TE000001-0001-0001-0001-000000000001', 'E0000001-0001-0001-0001-000000000001', 12.00, 'Examen Bimestral', CURDATE(), 'D0000001-0001-0001-0001-000000000001', 'N1', '{"tipo": "examen_bimestral", "curso": "matematica", "alumno": "María Fernanda"}'),
('N0002002-0002-0002-0002-000000000002', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'A0000002-0002-0002-0002-000000000002' AND clase_id = 'CL000001-0001-0001-0001-000000000001'), 'P0000001-0001-0001-0001-000000000001', 'TE000002-0002-0002-0002-000000000002', 'E0000001-0001-0001-0001-000000000001', 15.00, 'Práctica Calificada', CURDATE(), 'D0000001-0001-0001-0001-000000000001', 'N2', '{"tipo": "practica_calificada", "curso": "matematica", "alumno": "María Fernanda"}'),
('N0002003-0003-0003-0003-000000000003', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'A0000002-0002-0002-0002-000000000002' AND clase_id = 'CL000001-0001-0001-0001-000000000001'), 'P0000001-0001-0001-0001-000000000001', 'TE000003-0003-0003-0003-000000000003', 'E0000001-0001-0001-0001-000000000001', 13.50, 'Tareas del Bimestre', CURDATE(), 'D0000001-0001-0001-0001-000000000001', 'N3', '{"tipo": "tarea", "curso": "matematica", "alumno": "María Fernanda"}'),

-- Alumno 3 - Matemática (Pedro Antonio Rodríguez)  
('N0003001-0001-0001-0001-000000000001', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'A0000003-0003-0003-0003-000000000003' AND clase_id = 'CL000001-0001-0001-0001-000000000001'), 'P0000001-0001-0001-0001-000000000001', 'TE000001-0001-0001-0001-000000000001', 'E0000001-0001-0001-0001-000000000001', 19.00, 'Examen Bimestral', CURDATE(), 'D0000001-0001-0001-0001-000000000001', 'N1', '{"tipo": "examen_bimestral", "curso": "matematica", "alumno": "Pedro Antonio"}'),
('N0003002-0002-0002-0002-000000000002', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'A0000003-0003-0003-0003-000000000003' AND clase_id = 'CL000001-0001-0001-0001-000000000001'), 'P0000001-0001-0001-0001-000000000001', 'TE000002-0002-0002-0002-000000000002', 'E0000001-0001-0001-0001-000000000001', 17.00, 'Práctica Calificada', CURDATE(), 'D0000001-0001-0001-0001-000000000001', 'N2', '{"tipo": "practica_calificada", "curso": "matematica", "alumno": "Pedro Antonio"}'),
('N0003003-0003-0003-0003-000000000003', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'A0000003-0003-0003-0003-000000000003' AND clase_id = 'CL000001-0001-0001-0001-000000000001'), 'P0000001-0001-0001-0001-000000000001', 'TE000003-0003-0003-0003-000000000003', 'E0000001-0001-0001-0001-000000000001', 20.00, 'Tareas del Bimestre', CURDATE(), 'D0000001-0001-0001-0001-000000000001', 'N3', '{"tipo": "tarea", "curso": "matematica", "alumno": "Pedro Antonio"}'),

-- Alumno 4 - Matemática (Ana Lucía Torres)
('N0004001-0001-0001-0001-000000000001', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'A0000004-0004-0004-0004-000000000004' AND clase_id = 'CL000001-0001-0001-0001-000000000001'), 'P0000001-0001-0001-0001-000000000001', 'TE000001-0001-0001-0001-000000000001', 'E0000001-0001-0001-0001-000000000001', 16.50, 'Examen Bimestral', CURDATE(), 'D0000001-0001-0001-0001-000000000001', 'N1', '{"tipo": "examen_bimestral", "curso": "matematica", "alumno": "Ana Lucía"}'),
('N0004002-0002-0002-0002-000000000002', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'A0000004-0004-0004-0004-000000000004' AND clase_id = 'CL000001-0001-0001-0001-000000000001'), 'P0000001-0001-0001-0001-000000000001', 'TE000002-0002-0002-0002-000000000002', 'E0000001-0001-0001-0001-000000000001', 14.00, 'Práctica Calificada', CURDATE(), 'D0000001-0001-0001-0001-000000000001', 'N2', '{"tipo": "practica_calificada", "curso": "matematica", "alumno": "Ana Lucía"}'),

-- Alumno 5 - Matemática (Luis Miguel Ramírez)
('N0005001-0001-0001-0001-000000000001', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'A0000005-0005-0005-0005-000000000005' AND clase_id = 'CL000001-0001-0001-0001-000000000001'), 'P0000001-0001-0001-0001-000000000001', 'TE000001-0001-0001-0001-000000000001', 'E0000001-0001-0001-0001-000000000001', 11.00, 'Examen Bimestral', CURDATE(), 'D0000001-0001-0001-0001-000000000001', 'N1', '{"tipo": "examen_bimestral", "curso": "matematica", "alumno": "Luis Miguel", "alerta": "bajo_umbral"}');

-- Comunicación 1° Primaria A - Algunos alumnos con notas completas
INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id, columna_nota, metadata_json) VALUES
-- Alumno 1 - Comunicación (Juan Carlos)
('N0001011-0011-0011-0011-000000000011', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'A0000001-0001-0001-0001-000000000001' AND clase_id = 'CL000002-0002-0002-0002-000000000002'), 'P0000001-0001-0001-0001-000000000001', 'TE000001-0001-0001-0001-000000000001', 'E0000001-0001-0001-0001-000000000001', 15.00, 'Comprensión Lectora', CURDATE(), 'D0000002-0002-0002-0002-000000000002', 'N1', '{"tipo": "comprension_lectora", "curso": "comunicacion", "alumno": "Juan Carlos"}'),
('N0001012-0012-0012-0012-000000000012', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'A0000001-0001-0001-0001-000000000001' AND clase_id = 'CL000002-0002-0002-0002-000000000002'), 'P0000001-0001-0001-0001-000000000001', 'TE000002-0002-0002-0002-000000000002', 'E0000001-0001-0001-0001-000000000001', 17.00, 'Redacción de Textos', CURDATE(), 'D0000002-0002-0002-0002-000000000002', 'N2', '{"tipo": "redaccion", "curso": "comunicacion", "alumno": "Juan Carlos"}'),

-- Alumno 2 - Comunicación (María Fernanda)
('N0002011-0011-0011-0011-000000000011', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'A0000002-0002-0002-0002-000000000002' AND clase_id = 'CL000002-0002-0002-0002-000000000002'), 'P0000001-0001-0001-0001-000000000001', 'TE000001-0001-0001-0001-000000000001', 'E0000001-0001-0001-0001-000000000001', 13.00, 'Comprensión Lectora', CURDATE(), 'D0000002-0002-0002-0002-000000000002', 'N1', '{"tipo": "comprension_lectora", "curso": "comunicacion", "alumno": "María Fernanda"}'),
('N0002012-0012-0012-0012-000000000012', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'A0000002-0002-0002-0002-000000000002' AND clase_id = 'CL000002-0002-0002-0002-000000000002'), 'P0000001-0001-0001-0001-000000000001', 'TE000002-0002-0002-0002-000000000002', 'E0000001-0001-0001-0001-000000000001', 14.50, 'Redacción de Textos', CURDATE(), 'D0000002-0002-0002-0002-000000000002', 'N2', '{"tipo": "redaccion", "curso": "comunicacion", "alumno": "María Fernanda"}'),

-- Alumno 3 - Comunicación (Pedro Antonio)
('N0003011-0011-0011-0011-000000000011', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'A0000003-0003-0003-0003-000000000003' AND clase_id = 'CL000002-0002-0002-0002-000000000002'), 'P0000001-0001-0001-0001-000000000001', 'TE000001-0001-0001-0001-000000000001', 'E0000001-0001-0001-0001-000000000001', 18.00, 'Comprensión Lectora', CURDATE(), 'D0000002-0002-0002-0002-000000000002', 'N1', '{"tipo": "comprension_lectora", "curso": "comunicacion", "alumno": "Pedro Antonio"}'),
('N0003012-0012-0012-0012-000000000012', (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = 'A0000003-0003-0003-0003-000000000003' AND clase_id = 'CL000002-0002-0002-0002-000000000002'), 'P0000001-0001-0001-0001-000000000001', 'TE000002-0002-0002-0002-000000000002', 'E0000001-0001-0001-0001-000000000001', 19.50, 'Redacción de Textos', CURDATE(), 'D0000002-0002-0002-0002-000000000002', 'N2', '{"tipo": "redaccion", "curso": "comunicacion", "alumno": "Pedro Antonio"}');

-- Commit de todos los cambios
COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Seed corregido aplicado exitosamente!' AS mensaje,
       'Compatible con sistema multicurso dinámico' AS estado,
       'Datos incluyen columna_nota y metadata_json' AS detalle;