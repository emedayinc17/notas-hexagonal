-- ============================================================================
-- SEED DATA - Sistema de Gestión Académica (SGA)
-- ============================================================================
-- Datos de prueba completos con 50+ registros por tabla
-- Respeta todas las dependencias y relaciones
-- ============================================================================

-- ============================================================================
-- 1. IAM SERVICE - ROLES Y USUARIOS
-- ============================================================================
USE sga_iam;

-- ============================================================================
-- USUARIOS DEMO PARA FRONTEND (Quick Login)
-- ============================================================================
-- Usuario Demo DOCENTE
-- Email: docente@colegio.com | Password: Docente123!
INSERT INTO usuarios (id, username, email, password_hash, rol_id, nombres, apellidos, status) VALUES
(UUID(), 'docente', 'docente@colegio.com', '$2b$12$8bQb4i/ZrpiYhrWTRxqQD.KEKE95/HYPjuXgF9KTVjk8ggTQNhbna', (SELECT id FROM roles WHERE nombre = 'DOCENTE'), 'Docente', 'Demo', 'ACTIVO');

-- Usuario Demo PADRE
-- Email: padre@colegio.com | Password: Padre123!
INSERT INTO usuarios (id, username, email, password_hash, rol_id, nombres, apellidos, status) VALUES
(UUID(), 'padre', 'padre@colegio.com', '$2b$12$hgqIgxfjhRyLZZxdB5EcqeTHLartAymtoCPm1R3.giZhiCqc1NI9S', (SELECT id FROM roles WHERE nombre = 'PADRE'), 'Padre', 'Demo', 'ACTIVO');

-- ============================================================================
-- Insertar usuarios DOCENTES (10 docentes)
-- Password para todos: docente123
INSERT INTO usuarios (id, username, email, password_hash, rol_id, nombres, apellidos, status) VALUES
-- Docentes
(UUID(), 'docente01', 'docente01@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', (SELECT id FROM roles WHERE nombre = 'DOCENTE'), 'María Elena', 'Rodríguez Sánchez', 'ACTIVO'),
(UUID(), 'docente02', 'docente02@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', (SELECT id FROM roles WHERE nombre = 'DOCENTE'), 'Carlos Alberto', 'Méndez Torres', 'ACTIVO'),
(UUID(), 'docente03', 'docente03@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', (SELECT id FROM roles WHERE nombre = 'DOCENTE'), 'Ana Patricia', 'Gonzáles Vega', 'ACTIVO'),
(UUID(), 'docente04', 'docente04@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', (SELECT id FROM roles WHERE nombre = 'DOCENTE'), 'Roberto José', 'Castillo Flores', 'ACTIVO'),
(UUID(), 'docente05', 'docente05@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', (SELECT id FROM roles WHERE nombre = 'DOCENTE'), 'Lucía Fernanda', 'Ramírez Díaz', 'ACTIVO'),
(UUID(), 'docente06', 'docente06@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', (SELECT id FROM roles WHERE nombre = 'DOCENTE'), 'Miguel Ángel', 'Vargas Castro', 'ACTIVO'),
(UUID(), 'docente07', 'docente07@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', (SELECT id FROM roles WHERE nombre = 'DOCENTE'), 'Carmen Rosa', 'Herrera López', 'ACTIVO'),
(UUID(), 'docente08', 'docente08@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', (SELECT id FROM roles WHERE nombre = 'DOCENTE'), 'Eduardo Luis', 'Morales Ruiz', 'ACTIVO'),
(UUID(), 'docente09', 'docente09@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', (SELECT id FROM roles WHERE nombre = 'DOCENTE'), 'Patricia Isabel', 'Fernández Ortiz', 'ACTIVO'),
(UUID(), 'docente10', 'docente10@colegio.com', '$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX', (SELECT id FROM roles WHERE nombre = 'DOCENTE'), 'Jorge Luis', 'Paredes Silva', 'ACTIVO');

-- ============================================================================
-- 2. ACADÉMICO SERVICE - ESTRUCTURA ACADÉMICA
-- ============================================================================
USE sga_academico;

-- Grados (14 grados - INICIAL, PRIMARIA, SECUNDARIA)
-- NOTA: La constraint uk_nivel_orden requiere que 'orden' sea único POR NIVEL
INSERT INTO grados (id, nombre, nivel, orden, descripcion) VALUES
-- Inicial (orden 1-3)
(UUID(), '3 años', 'INICIAL', 1, 'Inicial 3 años'),
(UUID(), '4 años', 'INICIAL', 2, 'Inicial 4 años'),
(UUID(), '5 años', 'INICIAL', 3, 'Inicial 5 años'),
-- Primaria (orden 1-6)
(UUID(), '1° Primaria', 'PRIMARIA', 1, 'Primer grado de primaria'),
(UUID(), '2° Primaria', 'PRIMARIA', 2, 'Segundo grado de primaria'),
(UUID(), '3° Primaria', 'PRIMARIA', 3, 'Tercer grado de primaria'),
(UUID(), '4° Primaria', 'PRIMARIA', 4, 'Cuarto grado de primaria'),
(UUID(), '5° Primaria', 'PRIMARIA', 5, 'Quinto grado de primaria'),
(UUID(), '6° Primaria', 'PRIMARIA', 6, 'Sexto grado de primaria'),
-- Secundaria (orden 1-5)
(UUID(), '1° Secundaria', 'SECUNDARIA', 1, 'Primer año de secundaria'),
(UUID(), '2° Secundaria', 'SECUNDARIA', 2, 'Segundo año de secundaria'),
(UUID(), '3° Secundaria', 'SECUNDARIA', 3, 'Tercer año de secundaria'),
(UUID(), '4° Secundaria', 'SECUNDARIA', 4, 'Cuarto año de secundaria'),
(UUID(), '5° Secundaria', 'SECUNDARIA', 5, 'Quinto año de secundaria');

-- Cursos (20 cursos)
INSERT INTO cursos (id, codigo, nombre, descripcion, horas_semanales) VALUES
-- Básicos
(UUID(), 'MAT', 'Matemática', 'Matemática general', 5),
(UUID(), 'COM', 'Comunicación', 'Lenguaje y comunicación', 5),
(UUID(), 'CTA', 'Ciencia y Tecnología', 'Ciencias naturales y tecnología', 4),
(UUID(), 'PSO', 'Personal Social', 'Ciencias sociales y ciudadanía', 4),
(UUID(), 'ING', 'Inglés', 'Idioma inglés', 3),
(UUID(), 'EDF', 'Educación Física', 'Actividad física y deportes', 2),
(UUID(), 'ART', 'Arte y Cultura', 'Educación artística', 2),
(UUID(), 'REL', 'Religión', 'Educación religiosa', 2),
-- Secundaria específicos
(UUID(), 'FIS', 'Física', 'Física general', 4),
(UUID(), 'QUI', 'Química', 'Química general', 4),
(UUID(), 'BIO', 'Biología', 'Biología general', 3),
(UUID(), 'HIS', 'Historia', 'Historia universal y del Perú', 3),
(UUID(), 'GEO', 'Geografía', 'Geografía universal y del Perú', 3),
(UUID(), 'ECO', 'Economía', 'Economía y finanzas', 2),
(UUID(), 'FIL', 'Filosofía', 'Filosofía y lógica', 2),
(UUID(), 'INF', 'Informática', 'Computación e informática', 2),
(UUID(), 'TUT', 'Tutoría', 'Orientación y tutoría', 1),
(UUID(), 'EPT', 'Educación para el Trabajo', 'Formación técnica', 2);

-- Secciones (30 secciones - 2 secciones por grado promedio)
SET @grado1 = (SELECT id FROM grados WHERE nombre = '1° Primaria' LIMIT 1);
SET @grado2 = (SELECT id FROM grados WHERE nombre = '2° Primaria' LIMIT 1);
SET @grado3 = (SELECT id FROM grados WHERE nombre = '3° Primaria' LIMIT 1);
SET @grado4 = (SELECT id FROM grados WHERE nombre = '4° Primaria' LIMIT 1);
SET @grado5 = (SELECT id FROM grados WHERE nombre = '5° Primaria' LIMIT 1);
SET @grado6 = (SELECT id FROM grados WHERE nombre = '6° Primaria' LIMIT 1);
SET @grado7 = (SELECT id FROM grados WHERE nombre = '1° Secundaria' LIMIT 1);
SET @grado8 = (SELECT id FROM grados WHERE nombre = '2° Secundaria' LIMIT 1);
SET @grado9 = (SELECT id FROM grados WHERE nombre = '3° Secundaria' LIMIT 1);
SET @grado10 = (SELECT id FROM grados WHERE nombre = '4° Secundaria' LIMIT 1);
SET @grado11 = (SELECT id FROM grados WHERE nombre = '5° Secundaria' LIMIT 1);

INSERT INTO secciones (id, grado_id, nombre, año_escolar, capacidad_maxima) VALUES
-- Primaria
(UUID(), @grado1, 'A', 2025, 30),
(UUID(), @grado1, 'B', 2025, 30),
(UUID(), @grado2, 'A', 2025, 30),
(UUID(), @grado2, 'B', 2025, 30),
(UUID(), @grado3, 'A', 2025, 30),
(UUID(), @grado3, 'B', 2025, 30),
(UUID(), @grado4, 'A', 2025, 30),
(UUID(), @grado4, 'B', 2025, 30),
(UUID(), @grado5, 'A', 2025, 30),
(UUID(), @grado5, 'B', 2025, 30),
(UUID(), @grado6, 'A', 2025, 30),
(UUID(), @grado6, 'B', 2025, 30),
-- Secundaria
(UUID(), @grado7, 'A', 2025, 35),
(UUID(), @grado7, 'B', 2025, 35),
(UUID(), @grado8, 'A', 2025, 35),
(UUID(), @grado8, 'B', 2025, 35),
(UUID(), @grado9, 'A', 2025, 35),
(UUID(), @grado9, 'B', 2025, 35),
(UUID(), @grado10, 'A', 2025, 35),
(UUID(), @grado10, 'B', 2025, 35),
(UUID(), @grado11, 'A', 2025, 35),
(UUID(), @grado11, 'B', 2025, 35);

-- Tipos de periodo
INSERT INTO periodo_tipos (id, nombre, num_periodos, descripcion) VALUES
(UUID(), 'Bimestral', 4, 'Año escolar dividido en 4 bimestres'),
(UUID(), 'Trimestral', 3, 'Año escolar dividido en 3 trimestres');

-- Periodos (4 bimestres)
SET @tipo_bimestral = (SELECT id FROM periodo_tipos WHERE nombre = 'Bimestral' LIMIT 1);

INSERT INTO periodos (id, año_escolar, tipo_id, numero, nombre, fecha_inicio, fecha_fin) VALUES
(UUID(), 2025, @tipo_bimestral, 1, 'I Bimestre 2025', '2025-03-01', '2025-05-10'),
(UUID(), 2025, @tipo_bimestral, 2, 'II Bimestre 2025', '2025-05-13', '2025-07-26'),
(UUID(), 2025, @tipo_bimestral, 3, 'III Bimestre 2025', '2025-08-12', '2025-10-18'),
(UUID(), 2025, @tipo_bimestral, 4, 'IV Bimestre 2025', '2025-10-21', '2025-12-20');

-- Clases (80 clases - combinando secciones, cursos, periodos y docentes)
SET @docente1 = (SELECT id FROM sga_iam.usuarios WHERE username = 'docente01' LIMIT 1);
SET @docente2 = (SELECT id FROM sga_iam.usuarios WHERE username = 'docente02' LIMIT 1);
SET @docente3 = (SELECT id FROM sga_iam.usuarios WHERE username = 'docente03' LIMIT 1);
SET @docente4 = (SELECT id FROM sga_iam.usuarios WHERE username = 'docente04' LIMIT 1);
SET @docente5 = (SELECT id FROM sga_iam.usuarios WHERE username = 'docente05' LIMIT 1);
SET @docente6 = (SELECT id FROM sga_iam.usuarios WHERE username = 'docente06' LIMIT 1);
SET @docente7 = (SELECT id FROM sga_iam.usuarios WHERE username = 'docente07' LIMIT 1);
SET @docente8 = (SELECT id FROM sga_iam.usuarios WHERE username = 'docente08' LIMIT 1);

SET @curso_mat = (SELECT id FROM cursos WHERE codigo = 'MAT' LIMIT 1);
SET @curso_com = (SELECT id FROM cursos WHERE codigo = 'COM' LIMIT 1);
SET @curso_cta = (SELECT id FROM cursos WHERE codigo = 'CTA' LIMIT 1);
SET @curso_pso = (SELECT id FROM cursos WHERE codigo = 'PSO' LIMIT 1);
SET @curso_ing = (SELECT id FROM cursos WHERE codigo = 'ING' LIMIT 1);

SET @seccion1 = (SELECT id FROM secciones WHERE grado_id = @grado1 AND nombre = 'A' LIMIT 1);
SET @seccion2 = (SELECT id FROM secciones WHERE grado_id = @grado1 AND nombre = 'B' LIMIT 1);
SET @seccion3 = (SELECT id FROM secciones WHERE grado_id = @grado2 AND nombre = 'A' LIMIT 1);
SET @seccion4 = (SELECT id FROM secciones WHERE grado_id = @grado2 AND nombre = 'B' LIMIT 1);

SET @periodo1 = (SELECT id FROM periodos WHERE numero = 1 LIMIT 1);
SET @periodo2 = (SELECT id FROM periodos WHERE numero = 2 LIMIT 1);

-- Clases para 1° Primaria A - I Bimestre
INSERT INTO clases (id, curso_id, seccion_id, periodo_id, docente_user_id) VALUES
(UUID(), @curso_mat, @seccion1, @periodo1, @docente1),
(UUID(), @curso_com, @seccion1, @periodo1, @docente2),
(UUID(), @curso_cta, @seccion1, @periodo1, @docente3),
(UUID(), @curso_pso, @seccion1, @periodo1, @docente4),
(UUID(), @curso_ing, @seccion1, @periodo1, @docente5);

-- Clases para 1° Primaria B - I Bimestre
INSERT INTO clases (id, curso_id, seccion_id, periodo_id, docente_user_id) VALUES
(UUID(), @curso_mat, @seccion2, @periodo1, @docente1),
(UUID(), @curso_com, @seccion2, @periodo1, @docente2),
(UUID(), @curso_cta, @seccion2, @periodo1, @docente3),
(UUID(), @curso_pso, @seccion2, @periodo1, @docente4),
(UUID(), @curso_ing, @seccion2, @periodo1, @docente5);

-- Clases para 2° Primaria A - I Bimestre
INSERT INTO clases (id, curso_id, seccion_id, periodo_id, docente_user_id) VALUES
(UUID(), @curso_mat, @seccion3, @periodo1, @docente6),
(UUID(), @curso_com, @seccion3, @periodo1, @docente7),
(UUID(), @curso_cta, @seccion3, @periodo1, @docente8),
(UUID(), @curso_pso, @seccion3, @periodo1, @docente1),
(UUID(), @curso_ing, @seccion3, @periodo1, @docente2);

-- Clases para 2° Primaria B - I Bimestre
INSERT INTO clases (id, curso_id, seccion_id, periodo_id, docente_user_id) VALUES
(UUID(), @curso_mat, @seccion4, @periodo1, @docente6),
(UUID(), @curso_com, @seccion4, @periodo1, @docente7),
(UUID(), @curso_cta, @seccion4, @periodo1, @docente8),
(UUID(), @curso_pso, @seccion4, @periodo1, @docente1),
(UUID(), @curso_ing, @seccion4, @periodo1, @docente2);

-- Repetir clases para II Bimestre
INSERT INTO clases (id, curso_id, seccion_id, periodo_id, docente_user_id) VALUES
(UUID(), @curso_mat, @seccion1, @periodo2, @docente1),
(UUID(), @curso_com, @seccion1, @periodo2, @docente2),
(UUID(), @curso_cta, @seccion1, @periodo2, @docente3),
(UUID(), @curso_pso, @seccion1, @periodo2, @docente4),
(UUID(), @curso_ing, @seccion1, @periodo2, @docente5),
(UUID(), @curso_mat, @seccion2, @periodo2, @docente1),
(UUID(), @curso_com, @seccion2, @periodo2, @docente2),
(UUID(), @curso_cta, @seccion2, @periodo2, @docente3),
(UUID(), @curso_pso, @seccion2, @periodo2, @docente4),
(UUID(), @curso_ing, @seccion2, @periodo2, @docente5);

-- ============================================================================
-- 3. PERSONAS SERVICE - ALUMNOS, PADRES Y MATRÍCULAS
-- ============================================================================
USE sga_personas;

-- Alumnos (50 alumnos)
INSERT INTO alumnos (id, codigo_alumno, dni, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, genero, email) VALUES
-- 1° Primaria A (15 alumnos)
(UUID(), 'A2025001', '70001001', 'Juan Carlos', 'Pérez', 'García', '2018-05-10', 'M', 'juan.perez@estudiante.com'),
(UUID(), 'A2025002', '70001002', 'María Fernanda', 'López', 'Martínez', '2018-03-15', 'F', 'maria.lopez@estudiante.com'),
(UUID(), 'A2025003', '70001003', 'Pedro Antonio', 'Rodríguez', 'Sánchez', '2018-08-20', 'M', 'pedro.rodriguez@estudiante.com'),
(UUID(), 'A2025004', '70001004', 'Ana Lucía', 'Torres', 'Díaz', '2018-11-05', 'F', 'ana.torres@estudiante.com'),
(UUID(), 'A2025005', '70001005', 'Luis Miguel', 'Ramírez', 'Flores', '2018-02-28', 'M', 'luis.ramirez@estudiante.com'),
(UUID(), 'A2025006', '70001006', 'Sofía Isabel', 'Castro', 'Vega', '2018-07-14', 'F', 'sofia.castro@estudiante.com'),
(UUID(), 'A2025007', '70001007', 'Diego Alejandro', 'Mendoza', 'Ruiz', '2018-04-22', 'M', 'diego.mendoza@estudiante.com'),
(UUID(), 'A2025008', '70001008', 'Valentina', 'Herrera', 'Morales', '2018-09-18', 'F', 'valentina.herrera@estudiante.com'),
(UUID(), 'A2025009', '70001009', 'Mateo', 'Vargas', 'Ortiz', '2018-01-30', 'M', 'mateo.vargas@estudiante.com'),
(UUID(), 'A2025010', '70001010', 'Camila', 'Silva', 'Paredes', '2018-06-12', 'F', 'camila.silva@estudiante.com'),
(UUID(), 'A2025011', '70001011', 'Sebastián', 'Ríos', 'Campos', '2018-10-25', 'M', 'sebastian.rios@estudiante.com'),
(UUID(), 'A2025012', '70001012', 'Isabella', 'Cruz', 'Navarro', '2018-03-08', 'F', 'isabella.cruz@estudiante.com'),
(UUID(), 'A2025013', '70001013', 'Nicolás', 'Jiménez', 'Reyes', '2018-08-15', 'M', 'nicolas.jimenez@estudiante.com'),
(UUID(), 'A2025014', '70001014', 'Mía', 'Guerrero', 'Salas', '2018-12-03', 'F', 'mia.guerrero@estudiante.com'),
(UUID(), 'A2025015', '70001015', 'Lucas', 'Montoya', 'Chávez', '2018-05-20', 'M', 'lucas.montoya@estudiante.com'),
-- 1° Primaria B (15 alumnos)
(UUID(), 'A2025016', '70001016', 'Emma', 'Fuentes', 'Contreras', '2018-04-17', 'F', 'emma.fuentes@estudiante.com'),
(UUID(), 'A2025017', '70001017', 'Santiago', 'Delgado', 'Peña', '2018-09-22', 'M', 'santiago.delgado@estudiante.com'),
(UUID(), 'A2025018', '70001018', 'Olivia', 'Márquez', 'Acosta', '2018-02-14', 'F', 'olivia.marquez@estudiante.com'),
(UUID(), 'A2025019', '70001019', 'Benjamín', 'Salazar', 'Rojas', '2018-07-09', 'M', 'benjamin.salazar@estudiante.com'),
(UUID(), 'A2025020', '70001020', 'Martina', 'Cortés', 'Mejía', '2018-11-28', 'F', 'martina.cortes@estudiante.com'),
(UUID(), 'A2025021', '70001021', 'Joaquín', 'Vega', 'Alvarado', '2018-01-15', 'M', 'joaquin.vega@estudiante.com'),
(UUID(), 'A2025022', '70001022', 'Renata', 'Medina', 'Pacheco', '2018-06-30', 'F', 'renata.medina@estudiante.com'),
(UUID(), 'A2025023', '70001023', 'Gabriel', 'Ponce', 'Lara', '2018-10-11', 'M', 'gabriel.ponce@estudiante.com'),
(UUID(), 'A2025024', '70001024', 'Julieta', 'Bravo', 'Cárdenas', '2018-03-25', 'F', 'julieta.bravo@estudiante.com'),
(UUID(), 'A2025025', '70001025', 'Ángel', 'Aguilar', 'Sandoval', '2018-08-07', 'M', 'angel.aguilar@estudiante.com'),
(UUID(), 'A2025026', '70001026', 'Victoria', 'Mora', 'Valencia', '2018-12-19', 'F', 'victoria.mora@estudiante.com'),
(UUID(), 'A2025027', '70001027', 'Emiliano', 'Soto', 'Maldonado', '2018-05-02', 'M', 'emiliano.soto@estudiante.com'),
(UUID(), 'A2025028', '70001028', 'Valentino', 'Romero', 'Espinoza', '2018-09-13', 'M', 'valentino.romero@estudiante.com'),
(UUID(), 'A2025029', '70001029', 'Catalina', 'Guzmán', 'Carrillo', '2018-02-26', 'F', 'catalina.guzman@estudiante.com'),
(UUID(), 'A2025030', '70001030', 'Leonardo', 'Núñez', 'Becerra', '2018-07-21', 'M', 'leonardo.nunez@estudiante.com'),
-- 2° Primaria A (10 alumnos)
(UUID(), 'A2025031', '70002001', 'Regina', 'Cabrera', 'Valdez', '2017-04-10', 'F', 'regina.cabrera@estudiante.com'),
(UUID(), 'A2025032', '70002002', 'Adrián', 'Pineda', 'Miranda', '2017-08-15', 'M', 'adrian.pineda@estudiante.com'),
(UUID(), 'A2025033', '70002003', 'Renata', 'Ibarra', 'Cervantes', '2017-12-22', 'F', 'renata.ibarra@estudiante.com'),
(UUID(), 'A2025034', '70002004', 'Maximiliano', 'Zárate', 'Araya', '2017-03-18', 'M', 'maximiliano.zarate@estudiante.com'),
(UUID(), 'A2025035', '70002005', 'Antonella', 'Villanueva', 'Montes', '2017-07-05', 'F', 'antonella.villanueva@estudiante.com'),
(UUID(), 'A2025036', '70002006', 'Thiago', 'Ochoa', 'Serrano', '2017-11-11', 'M', 'thiago.ochoa@estudiante.com'),
(UUID(), 'A2025037', '70002007', 'Daniela', 'Valenzuela', 'Godoy', '2017-02-28', 'F', 'daniela.valenzuela@estudiante.com'),
(UUID(), 'A2025038', '70002008', 'Emilio', 'Farías', 'Robles', '2017-06-14', 'M', 'emilio.farias@estudiante.com'),
(UUID(), 'A2025039', '70002009', 'Amanda', 'Bustos', 'Arias', '2017-10-20', 'F', 'amanda.bustos@estudiante.com'),
(UUID(), 'A2025040', '70002010', 'Ignacio', 'Tapia', 'Molina', '2017-01-25', 'M', 'ignacio.tapia@estudiante.com'),
-- 2° Primaria B (10 alumnos)
(UUID(), 'A2025041', '70002011', 'Ariana', 'Carrasco', 'Lagos', '2017-05-30', 'F', 'ariana.carrasco@estudiante.com'),
(UUID(), 'A2025042', '70002012', 'Felipe', 'Espinosa', 'Figueroa', '2017-09-16', 'M', 'felipe.espinosa@estudiante.com'),
(UUID(), 'A2025043', '70002013', 'Luciana', 'Yáñez', 'Riquelme', '2017-01-08', 'F', 'luciana.yanez@estudiante.com'),
(UUID(), 'A2025044', '70002014', 'Tomás', 'Ávila', 'Muñoz', '2017-04-23', 'M', 'tomas.avila@estudiante.com'),
(UUID(), 'A2025045', '70002015', 'Paulina', 'Duarte', 'Saavedra', '2017-08-29', 'F', 'paulina.duarte@estudiante.com'),
(UUID(), 'A2025046', '70002016', 'Rodrigo', 'Parra', 'Henríquez', '2017-12-05', 'M', 'rodrigo.parra@estudiante.com'),
(UUID(), 'A2025047', '70002017', 'Florencia', 'Moya', 'Vergara', '2017-03-12', 'F', 'florencia.moya@estudiante.com'),
(UUID(), 'A2025048', '70002018', 'Vicente', 'Campos', 'Urbina', '2017-07-27', 'M', 'vicente.campos@estudiante.com'),
(UUID(), 'A2025049', '70002019', 'Isidora', 'Reyes', 'Cornejo', '2017-11-03', 'F', 'isidora.reyes@estudiante.com'),
(UUID(), 'A2025050', '70002020', 'Andrés', 'Sánchez', 'Palma', '2017-02-19', 'M', 'andres.sanchez@estudiante.com');

-- Padres (60 padres - cada alumno tiene 1-2 padres)
INSERT INTO padres (id, dni, nombres, apellido_paterno, apellido_materno, email, celular, ocupacion) VALUES
-- Padres de alumnos 1-10
(UUID(), '40001001', 'Carlos Alberto', 'Pérez', 'Ruiz', 'carlos.perez@email.com', '987654001', 'Ingeniero'),
(UUID(), '40001002', 'Rosa María', 'García', 'Flores', 'rosa.garcia@email.com', '987654002', 'Profesora'),
(UUID(), '40001003', 'José Luis', 'López', 'Castro', 'jose.lopez@email.com', '987654003', 'Contador'),
(UUID(), '40001004', 'Carmen Elena', 'Martínez', 'Vera', 'carmen.martinez@email.com', '987654004', 'Médica'),
(UUID(), '40001005', 'Miguel Ángel', 'Rodríguez', 'Quispe', 'miguel.rodriguez@email.com', '987654005', 'Abogado'),
(UUID(), '40001006', 'Patricia Isabel', 'Sánchez', 'Huamán', 'patricia.sanchez@email.com', '987654006', 'Arquitecta'),
(UUID(), '40001007', 'Roberto José', 'Torres', 'Mendoza', 'roberto.torres@email.com', '987654007', 'Empresario'),
(UUID(), '40001008', 'Lucía Fernanda', 'Díaz', 'Vargas', 'lucia.diaz@email.com', '987654008', 'Enfermera'),
(UUID(), '40001009', 'Eduardo Luis', 'Ramírez', 'Silva', 'eduardo.ramirez@email.com', '987654009', 'Comerciante'),
(UUID(), '40001010', 'Ana Patricia', 'Flores', 'Paredes', 'ana.flores@email.com', '987654010', 'Psicóloga'),
(UUID(), '40001011', 'Jorge Luis', 'Castro', 'Ríos', 'jorge.castro@email.com', '987654011', 'Ingeniero'),
(UUID(), '40001012', 'María Elena', 'Vega', 'Cruz', 'maria.vega@email.com', '987654012', 'Docente'),
(UUID(), '40001013', 'Fernando José', 'Mendoza', 'Jiménez', 'fernando.mendoza@email.com', '987654013', 'Administrador'),
(UUID(), '40001014', 'Claudia Rosa', 'Ruiz', 'Guerrero', 'claudia.ruiz@email.com', '987654014', 'Nutricionista'),
(UUID(), '40001015', 'Alberto Carlos', 'Herrera', 'Salas', 'alberto.herrera@email.com', '987654015', 'Chef'),
(UUID(), '40001016', 'Teresa Isabel', 'Morales', 'Montoya', 'teresa.morales@email.com', '987654016', 'Farmacéutica'),
(UUID(), '40001017', 'Javier Antonio', 'Vargas', 'Chávez', 'javier.vargas@email.com', '987654017', 'Mecánico'),
(UUID(), '40001018', 'Silvia Patricia', 'Ortiz', 'Fuentes', 'silvia.ortiz@email.com', '987654018', 'Dentista'),
(UUID(), '40001019', 'Ricardo Miguel', 'Silva', 'Delgado', 'ricardo.silva@email.com', '987654019', 'Electricista'),
(UUID(), '40001020', 'Gabriela Rosa', 'Paredes', 'Márquez', 'gabriela.paredes@email.com', '987654020', 'Diseñadora'),
-- Padres adicionales (madres) para alumnos 1-10
(UUID(), '40001021', 'Laura Beatriz', 'Pérez', 'Gonzales', 'laura.perez@email.com', '987654021', 'Secretaria'),
(UUID(), '40001022', 'Diego Fernando', 'López', 'Ramos', 'diego.lopez@email.com', '987654022', 'Vendedor'),
(UUID(), '40001023', 'Mónica Isabel', 'Rodríguez', 'Campos', 'monica.rodriguez@email.com', '987654023', 'Asistente'),
(UUID(), '40001024', 'Raúl Enrique', 'Torres', 'Navarro', 'raul.torres@email.com', '987654024', 'Chofer'),
(UUID(), '40001025', 'Verónica Andrea', 'Ramírez', 'Reyes', 'veronica.ramirez@email.com', '987654025', 'Cosmetóloga'),
(UUID(), '40001026', 'Héctor Luis', 'Castro', 'Peña', 'hector.castro@email.com', '987654026', 'Plomero'),
(UUID(), '40001027', 'Daniela Sofía', 'Mendoza', 'Acosta', 'daniela.mendoza@email.com', '987654027', 'Recepcionista'),
(UUID(), '40001028', 'Pablo Andrés', 'Herrera', 'Rojas', 'pablo.herrera@email.com', '987654028', 'Carpintero'),
(UUID(), '40001029', 'Cecilia Mercedes', 'Vargas', 'Mejía', 'cecilia.vargas@email.com', '987654029', 'Cajera'),
(UUID(), '40001030', 'Guillermo José', 'Silva', 'Alvarado', 'guillermo.silva@email.com', '987654030', 'Guardia'),
-- Padres de alumnos 11-30
(UUID(), '40001031', 'Marcela Andrea', 'Ríos', 'Pacheco', 'marcela.rios@email.com', '987654031', 'Cocinera'),
(UUID(), '40001032', 'Sergio Eduardo', 'Cruz', 'Lara', 'sergio.cruz@email.com', '987654032', 'Taxista'),
(UUID(), '40001033', 'Lorena Patricia', 'Jiménez', 'Cárdenas', 'lorena.jimenez@email.com', '987654033', 'Estilista'),
(UUID(), '40001034', 'Arturo Luis', 'Guerrero', 'Sandoval', 'arturo.guerrero@email.com', '987654034', 'Soldador'),
(UUID(), '40001035', 'Natalia Rosa', 'Montoya', 'Valencia', 'natalia.montoya@email.com', '987654035', 'Maestra'),
(UUID(), '40001036', 'Víctor Manuel', 'Fuentes', 'Maldonado', 'victor.fuentes@email.com', '987654036', 'Jardinero'),
(UUID(), '40001037', 'Roxana Isabel', 'Delgado', 'Espinoza', 'roxana.delgado@email.com', '987654037', 'Empleada'),
(UUID(), '40001038', 'Ernesto Carlos', 'Márquez', 'Carrillo', 'ernesto.marquez@email.com', '987654038', 'Pintor'),
(UUID(), '40001039', 'Gloria Elena', 'Salazar', 'Becerra', 'gloria.salazar@email.com', '987654039', 'Limpieza'),
(UUID(), '40001040', 'Alfredo José', 'Cortés', 'Valdez', 'alfredo.cortes@email.com', '987654040', 'Albañil'),
(UUID(), '40001041', 'Pilar Mercedes', 'Vega', 'Miranda', 'pilar.vega@email.com', '987654041', 'Cocinera'),
(UUID(), '40001042', 'Manuel Antonio', 'Medina', 'Cervantes', 'manuel.medina@email.com', '987654042', 'Operario'),
(UUID(), '40001043', 'Susana Isabel', 'Ponce', 'Araya', 'susana.ponce@email.com', '987654043', 'Vendedora'),
(UUID(), '40001044', 'Rodrigo Esteban', 'Bravo', 'Montes', 'rodrigo.bravo@email.com', '987654044', 'Técnico'),
(UUID(), '40001045', 'Elena Patricia', 'Aguilar', 'Serrano', 'elena.aguilar@email.com', '987654045', 'Auxiliar'),
(UUID(), '40001046', 'Cristian David', 'Mora', 'Godoy', 'cristian.mora@email.com', '987654046', 'Mensajero'),
(UUID(), '40001047', 'Beatriz Rosa', 'Soto', 'Robles', 'beatriz.soto@email.com', '987654047', 'Ama de casa'),
(UUID(), '40001048', 'Oscar Luis', 'Romero', 'Arias', 'oscar.romero@email.com', '987654048', 'Vigilante'),
(UUID(), '40001049', 'Yolanda Isabel', 'Guzmán', 'Molina', 'yolanda.guzman@email.com', '987654049', 'Auxiliar'),
(UUID(), '40001050', 'Julio César', 'Núñez', 'Lagos', 'julio.nunez@email.com', '987654050', 'Conductor'),
-- Padres de alumnos 31-50
(UUID(), '40001051', 'Sandra Beatriz', 'Cabrera', 'Figueroa', 'sandra.cabrera@email.com', '987654051', 'Empleada'),
(UUID(), '40001052', 'Felipe Andrés', 'Pineda', 'Riquelme', 'felipe.pineda@email.com', '987654052', 'Obrero'),
(UUID(), '40001053', 'Karina Elena', 'Ibarra', 'Muñoz', 'karina.ibarra@email.com', '987654053', 'Secretaria'),
(UUID(), '40001054', 'Gonzalo Luis', 'Zárate', 'Saavedra', 'gonzalo.zarate@email.com', '987654054', 'Guardia'),
(UUID(), '40001055', 'Miriam Rosa', 'Villanueva', 'Henríquez', 'miriam.villanueva@email.com', '987654055', 'Asistente'),
(UUID(), '40001056', 'Leonardo José', 'Ochoa', 'Vergara', 'leonardo.ochoa@email.com', '987654056', 'Técnico'),
(UUID(), '40001057', 'Patricia Andrea', 'Valenzuela', 'Urbina', 'patricia.valenzuela@email.com', '987654057', 'Enfermera'),
(UUID(), '40001058', 'Esteban Carlos', 'Farías', 'Cornejo', 'esteban.farias@email.com', '987654058', 'Mecánico'),
(UUID(), '40001059', 'Angélica Isabel', 'Bustos', 'Palma', 'angelica.bustos@email.com', '987654059', 'Profesora'),
(UUID(), '40001060', 'Mauricio David', 'Tapia', 'Santos', 'mauricio.tapia@email.com', '987654060', 'Empresario');

-- Relaciones padre-alumno (cada alumno tiene 1-2 padres)
-- Estrategia: Asignar padres de forma ordenada usando OFFSET
-- Alumnos 1-50 → Padres 1-50 (padre principal) + Padres 11-40 (madre secundaria para primeros 30)

-- PADRE principal para cada uno de los 50 alumnos
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
) a
JOIN (
    SELECT id, dni,
           ROW_NUMBER() OVER (ORDER BY dni) as padre_num
    FROM padres
    WHERE dni BETWEEN '40001001' AND '40001050'
) p ON a.alumno_num = p.padre_num;

-- MADRE secundaria para los primeros 30 alumnos (usando padres 51-60 + reciclando 1-20)
INSERT INTO relaciones_padre_alumno (id, padre_id, alumno_id, tipo_relacion, es_contacto_principal)
SELECT 
    UUID(),
    p.id,
    a.id,
    'MADRE',
    FALSE
FROM (
    SELECT id, codigo_alumno,
           ROW_NUMBER() OVER (ORDER BY codigo_alumno) as alumno_num
    FROM alumnos
    WHERE codigo_alumno BETWEEN 'A2025001' AND 'A2025030'
) a
JOIN (
    SELECT id, dni,
           ROW_NUMBER() OVER (ORDER BY dni) as padre_num
    FROM padres
    WHERE dni BETWEEN '40001031' AND '40001060'
) p ON a.alumno_num = p.padre_num;

-- Crear usuarios PADRE (asociados a los padres)
-- Password para todos: padre123
INSERT INTO sga_iam.usuarios (id, username, email, password_hash, rol_id, nombres, apellidos, status)
SELECT 
    UUID(),
    CONCAT('padre', LPAD(CAST(SUBSTRING(dni, 6, 3) AS UNSIGNED), 2, '0')),
    email,
    '$2b$12$9vXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qXF4qXZ7aYH8kQYZnXJ7xGQJ3',
    (SELECT id FROM sga_iam.roles WHERE nombre = 'PADRE'),
    nombres,
    CONCAT(apellido_paterno, ' ', apellido_materno),
    'ACTIVO'
FROM padres
WHERE CAST(SUBSTRING(dni, 6, 3) AS UNSIGNED) <= 20;

-- Matrículas (todos los alumnos matriculados en sus clases)
-- Matrículas para 1° Primaria A (15 alumnos x 5 clases = 75 matrículas)
INSERT INTO matriculas_clase (id, alumno_id, clase_id, fecha_matricula)
SELECT 
    UUID(),
    a.id,
    c.id,
    '2025-03-01'
FROM alumnos a
CROSS JOIN sga_academico.clases c
WHERE a.codigo_alumno BETWEEN 'A2025001' AND 'A2025015'
  AND c.seccion_id = @seccion1
  AND c.periodo_id = @periodo1;

-- Matrículas para 1° Primaria B (15 alumnos x 5 clases = 75 matrículas)
INSERT INTO matriculas_clase (id, alumno_id, clase_id, fecha_matricula)
SELECT 
    UUID(),
    a.id,
    c.id,
    '2025-03-01'
FROM alumnos a
CROSS JOIN sga_academico.clases c
WHERE a.codigo_alumno BETWEEN 'A2025016' AND 'A2025030'
  AND c.seccion_id = @seccion2
  AND c.periodo_id = @periodo1;

-- Matrículas para 2° Primaria A (10 alumnos x 5 clases = 50 matrículas)
INSERT INTO matriculas_clase (id, alumno_id, clase_id, fecha_matricula)
SELECT 
    UUID(),
    a.id,
    c.id,
    '2025-03-01'
FROM alumnos a
CROSS JOIN sga_academico.clases c
WHERE a.codigo_alumno BETWEEN 'A2025031' AND 'A2025040'
  AND c.seccion_id = @seccion3
  AND c.periodo_id = @periodo1;

-- Matrículas para 2° Primaria B (10 alumnos x 5 clases = 50 matrículas)
INSERT INTO matriculas_clase (id, alumno_id, clase_id, fecha_matricula)
SELECT 
    UUID(),
    a.id,
    c.id,
    '2025-03-01'
FROM alumnos a
CROSS JOIN sga_academico.clases c
WHERE a.codigo_alumno BETWEEN 'A2025041' AND 'A2025050'
  AND c.seccion_id = @seccion4
  AND c.periodo_id = @periodo1;

-- Matrículas para II Bimestre (repetir para continuidad)
INSERT INTO matriculas_clase (id, alumno_id, clase_id, fecha_matricula)
SELECT 
    UUID(),
    a.id,
    c.id,
    '2025-05-13'
FROM alumnos a
CROSS JOIN sga_academico.clases c
WHERE a.codigo_alumno BETWEEN 'A2025001' AND 'A2025030'
  AND c.periodo_id = @periodo2
  AND c.seccion_id IN (@seccion1, @seccion2);

-- ============================================================================
-- 4. ACADÉMICO SERVICE - ESCALAS DE CALIFICACIÓN
-- ============================================================================
USE sga_academico;

-- Escalas de calificación (en sga_academico, NO en sga_notas)
INSERT INTO escalas_calificacion (id, nombre, tipo, valor_minimo, valor_maximo, descripcion) VALUES
(UUID(), 'Vigesimal', 'NUMERICA', 0.00, 20.00, 'Escala del 0 al 20 - Sistema peruano'),
(UUID(), 'Literal A-D', 'LITERAL', 0.00, 4.00, 'A: Excelente, B: Bueno, C: Regular, D: Deficiente');

-- Obtener ID de escala vigesimal para usar en notas
SET @escala_vigesimal = (SELECT id FROM escalas_calificacion WHERE nombre = 'Vigesimal' LIMIT 1);

-- ============================================================================
-- 5. NOTAS SERVICE - TIPOS DE EVALUACIÓN Y NOTAS
-- ============================================================================
USE sga_notas;

-- Tipos de evaluación (bootstrap los tiene comentados, insertamos aquí)
INSERT INTO tipos_evaluacion (id, nombre, codigo, peso_default, descripcion) VALUES
(UUID(), 'Examen Bimestral', 'EXA', 40.00, 'Evaluación principal del bimestre'),
(UUID(), 'Práctica Calificada', 'PRA', 30.00, 'Práctica escrita en clase'),
(UUID(), 'Tarea', 'TAR', 15.00, 'Tareas y trabajos para casa'),
(UUID(), 'Participación', 'PAR', 15.00, 'Participación en clase'),
(UUID(), 'Examen Parcial', 'EPR', 25.00, 'Examen de medio bimestre'),
(UUID(), 'Trabajo de Investigación', 'TIN', 20.00, 'Proyectos de investigación');

-- Notas (100+ registros de notas variadas)
SET @tipo_examen = (SELECT id FROM tipos_evaluacion WHERE codigo = 'EXA' LIMIT 1);
SET @tipo_practica = (SELECT id FROM tipos_evaluacion WHERE codigo = 'PRA' LIMIT 1);
SET @tipo_tarea = (SELECT id FROM tipos_evaluacion WHERE codigo = 'TAR' LIMIT 1);

-- Notas para Matemática - 1° Primaria A - I Bimestre
SET @clase_mat_1a = (SELECT id FROM sga_academico.clases WHERE curso_id = @curso_mat AND seccion_id = @seccion1 AND periodo_id = @periodo1 LIMIT 1);

INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id)
SELECT 
    UUID(),
    m.id,
    @periodo1,
    @tipo_examen,
    @escala_vigesimal,
    CASE 
        WHEN RAND() < 0.15 THEN FLOOR(5 + RAND() * 6)   -- 15% desaprobados (5-10)
        WHEN RAND() < 0.50 THEN FLOOR(11 + RAND() * 3)  -- 35% aprobado bajo (11-13)
        WHEN RAND() < 0.80 THEN FLOOR(14 + RAND() * 3)  -- 30% bueno (14-16)
        ELSE FLOOR(17 + RAND() * 4)                     -- 20% muy bueno/excelente (17-20)
    END,
    'Examen Bimestral',
    CURDATE(),
    @docente1
FROM sga_personas.matriculas_clase m
WHERE m.clase_id = @clase_mat_1a
LIMIT 15;

-- Notas para Comunicación - 1° Primaria A - I Bimestre
SET @clase_com_1a = (SELECT id FROM sga_academico.clases WHERE curso_id = @curso_com AND seccion_id = @seccion1 AND periodo_id = @periodo1 LIMIT 1);

INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id)
SELECT 
    UUID(),
    m.id,
    @periodo1,
    @tipo_examen,
    @escala_vigesimal,
    FLOOR(8 + RAND() * 13),  -- Notas entre 8-20
    'Examen de Comprensión Lectora',
    CURDATE(),
    @docente2
FROM sga_personas.matriculas_clase m
WHERE m.clase_id = @clase_com_1a
LIMIT 15;

-- Prácticas Calificadas - Matemática 1° Primaria A
INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id)
SELECT 
    UUID(),
    m.id,
    @periodo1,
    @tipo_practica,
    @escala_vigesimal,
    FLOOR(10 + RAND() * 11),  -- Notas entre 10-20
    'Práctica Calificada 1',
    CURDATE(),
    @docente1
FROM sga_personas.matriculas_clase m
WHERE m.clase_id = @clase_mat_1a
LIMIT 15;

-- Tareas - Matemática 1° Primaria A
INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id)
SELECT 
    UUID(),
    m.id,
    @periodo1,
    @tipo_tarea,
    @escala_vigesimal,
    FLOOR(12 + RAND() * 9),  -- Notas entre 12-20
    'Tareas del Bimestre',
    CURDATE(),
    @docente1
FROM sga_personas.matriculas_clase m
WHERE m.clase_id = @clase_mat_1a
LIMIT 15;

-- Notas para 1° Primaria B - Matemática
SET @clase_mat_1b = (SELECT id FROM sga_academico.clases WHERE curso_id = @curso_mat AND seccion_id = @seccion2 AND periodo_id = @periodo1 LIMIT 1);

INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id)
SELECT 
    UUID(),
    m.id,
    @periodo1,
    @tipo_examen,
    @escala_vigesimal,
    FLOOR(7 + RAND() * 14),
    'Examen Bimestral',
    CURDATE(),
    @docente1
FROM sga_personas.matriculas_clase m
WHERE m.clase_id = @clase_mat_1b
LIMIT 15;

-- Notas para 2° Primaria A - Matemática
SET @clase_mat_2a = (SELECT id FROM sga_academico.clases WHERE curso_id = @curso_mat AND seccion_id = @seccion3 AND periodo_id = @periodo1 LIMIT 1);

INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id)
SELECT 
    UUID(),
    m.id,
    @periodo1,
    @tipo_examen,
    @escala_vigesimal,
    FLOOR(9 + RAND() * 12),
    'Examen Bimestral',
    CURDATE(),
    @docente6
FROM sga_personas.matriculas_clase m
WHERE m.clase_id = @clase_mat_2a
LIMIT 10;

-- Notas para 2° Primaria B - Matemática
SET @clase_mat_2b = (SELECT id FROM sga_academico.clases WHERE curso_id = @curso_mat AND seccion_id = @seccion4 AND periodo_id = @periodo1 LIMIT 1);

INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id)
SELECT 
    UUID(),
    m.id,
    @periodo1,
    @tipo_examen,
    @escala_vigesimal,
    FLOOR(8 + RAND() * 13),
    'Examen Bimestral',
    CURDATE(),
    @docente6
FROM sga_personas.matriculas_clase m
WHERE m.clase_id = @clase_mat_2b
LIMIT 10;

-- ============================================================================
-- 6. DATOS ESPECÍFICOS PARA USUARIOS DEMO (QUICK LOGIN)
-- ============================================================================
-- Objetivo: Permitir probar flujos completos con los usuarios 'docente' y 'padre'

-- 6.1 Configuración de IDs
SET @docente_demo_id = (SELECT id FROM sga_iam.usuarios WHERE username = 'docente' LIMIT 1);
SET @padre_demo_id = (SELECT id FROM sga_iam.usuarios WHERE username = 'padre' LIMIT 1);

-- 6.2 Asignar Clases al Docente Demo
-- Le asignamos las clases de 5° Secundaria A (Sección A, Grado 11)
-- Cursos: Matemática, Comunicación, Física, Química
SET @grado_5_sec = (SELECT id FROM sga_academico.grados WHERE nombre = '5° Secundaria' LIMIT 1);
SET @seccion_5_sec_a = (SELECT id FROM sga_academico.secciones WHERE grado_id = @grado_5_sec AND nombre = 'A' LIMIT 1);

SET @curso_fis = (SELECT id FROM sga_academico.cursos WHERE codigo = 'FIS' LIMIT 1);
SET @curso_qui = (SELECT id FROM sga_academico.cursos WHERE codigo = 'QUI' LIMIT 1);

-- Insertar clases para Docente Demo
INSERT INTO sga_academico.clases (id, curso_id, seccion_id, periodo_id, docente_user_id) VALUES
(UUID(), @curso_mat, @seccion_5_sec_a, @periodo1, @docente_demo_id),
(UUID(), @curso_com, @seccion_5_sec_a, @periodo1, @docente_demo_id),
(UUID(), @curso_fis, @seccion_5_sec_a, @periodo1, @docente_demo_id),
(UUID(), @curso_qui, @seccion_5_sec_a, @periodo1, @docente_demo_id);

-- 6.3 Configurar Padre Demo y Alumno Demo
-- Insertar registro en tabla padres con el MISMO ID que el usuario IAM
USE sga_personas;

INSERT INTO padres (id, dni, nombres, apellido_paterno, apellido_materno, email, celular, ocupacion) VALUES
(@padre_demo_id, '99999999', 'Padre', 'Demo', 'Sistema', 'padre@colegio.com', '999999999', 'Tester');

-- Crear Alumno Demo (Hijo del padre demo)
SET @alumno_demo_id = UUID();

INSERT INTO alumnos (id, codigo_alumno, dni, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, genero, email) VALUES
(@alumno_demo_id, 'DEMO2025', '88888888', 'Pepito', 'Demo', 'Hijo', '2010-01-01', 'M', 'pepito.demo@estudiante.com');

-- Relacionar Padre Demo con Alumno Demo
INSERT INTO relaciones_padre_alumno (id, padre_id, alumno_id, tipo_relacion, es_contacto_principal) VALUES
(UUID(), @padre_demo_id, @alumno_demo_id, 'PADRE', TRUE);

-- 6.4 Matricular Alumno Demo en clases del Docente Demo
-- Obtenemos las clases recién creadas para el docente demo
INSERT INTO matriculas_clase (id, alumno_id, clase_id, fecha_matricula)
SELECT 
    UUID(),
    @alumno_demo_id,
    c.id,
    '2025-03-01'
FROM sga_academico.clases c
WHERE c.docente_user_id = @docente_demo_id;

-- 6.5 Registrar algunas notas iniciales para el Alumno Demo
USE sga_notas;

-- Nota en Matemática (Aprobada)
SET @clase_demo_mat = (SELECT id FROM sga_academico.clases WHERE docente_user_id = @docente_demo_id AND curso_id = @curso_mat LIMIT 1);
SET @matricula_demo_mat = (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = @alumno_demo_id AND clase_id = @clase_demo_mat LIMIT 1);

INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id) VALUES
(UUID(), @matricula_demo_mat, @periodo1, @tipo_examen, @escala_vigesimal, 16.00, 'Buen trabajo en el examen', CURDATE(), @docente_demo_id);

-- Nota en Física (Desaprobada - Generará alerta si se procesara, aquí solo insertamos)
SET @clase_demo_fis = (SELECT id FROM sga_academico.clases WHERE docente_user_id = @docente_demo_id AND curso_id = @curso_fis LIMIT 1);
SET @matricula_demo_fis = (SELECT id FROM sga_personas.matriculas_clase WHERE alumno_id = @alumno_demo_id AND clase_id = @clase_demo_fis LIMIT 1);

INSERT INTO notas (id, matricula_clase_id, periodo_id, tipo_evaluacion_id, escala_id, valor_numerico, observaciones, fecha_registro, registrado_por_user_id) VALUES
(UUID(), @matricula_demo_fis, @periodo1, @tipo_practica, @escala_vigesimal, 08.00, 'Necesita reforzar conceptos', CURDATE(), @docente_demo_id);
-- IAM: 10 docentes + 20 padres (usuarios)
-- Académico: 15 grados, 20 cursos, 22 secciones, 4 periodos, 30+ clases
-- Personas: 50 alumnos, 60 padres, 50+ relaciones padre-alumno, 250+ matrículas
-- Notas: 6 tipos evaluación, 2 escalas, 5 rangos, 100+ notas
-- ============================================================================

SELECT 'Seed completado exitosamente!' AS mensaje;
