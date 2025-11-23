-- ============================================================================
-- SISTEMA DE GESTIÓN DE NOTAS - BOOTSTRAP DATABASE
-- MySQL 8.0+ | InnoDB | utf8mb4
-- Arquitectura: Hexagonal con 4 bounded contexts
-- ============================================================================

-- Configuración inicial
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 1. IAM SERVICE SCHEMA (sga_iam)
-- Responsabilidad: Autenticación, autorización y gestión de usuarios
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS sga_iam DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sga_iam;

-- Tabla: roles
CREATE TABLE IF NOT EXISTS roles (
    id CHAR(36) NOT NULL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id CHAR(36) NOT NULL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id CHAR(36) NOT NULL,
    nombres VARCHAR(100),
    apellidos VARCHAR(100),
    status ENUM('ACTIVO', 'INACTIVO', 'BLOQUEADO') NOT NULL DEFAULT 'ACTIVO',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id),
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_rol (rol_id),
    INDEX idx_status (status),
    CHECK (status IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: sesiones (para tracking de tokens)
CREATE TABLE IF NOT EXISTS sesiones (
    id CHAR(36) NOT NULL PRIMARY KEY,
    usuario_id CHAR(36) NOT NULL,
    token_jti VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_token (token_jti),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: auditoria_logs (Trazabilidad de acciones)
CREATE TABLE IF NOT EXISTS auditoria_logs (
    id CHAR(36) NOT NULL PRIMARY KEY,
    
    -- Información del Usuario
    user_id CHAR(36),
    username VARCHAR(100),
    rol_nombre VARCHAR(50),
    
    -- Información de la Acción
    accion VARCHAR(50) NOT NULL,           -- LOGIN, LOGOUT, CREATE, UPDATE, DELETE, etc.
    entidad VARCHAR(100) NOT NULL,         -- Usuario, Rol, Sesion, etc.
    entidad_id CHAR(36),                   -- ID del registro afectado
    
    -- Detalles de la Operación
    descripcion TEXT,                      -- Descripción legible de la acción
    datos_anteriores JSON,                 -- Estado antes del cambio (para UPDATE/DELETE)
    datos_nuevos JSON,                     -- Estado después del cambio (para CREATE/UPDATE)
    
    -- Metadata de la Petición
    ip_address VARCHAR(45),                -- IPv4 o IPv6
    user_agent TEXT,                       -- Navegador/Cliente
    endpoint VARCHAR(255),                 -- Endpoint HTTP llamado
    metodo_http VARCHAR(10),               -- GET, POST, PUT, DELETE
    
    -- Resultado
    exitoso BOOLEAN NOT NULL DEFAULT TRUE,
    codigo_respuesta INT,                  -- HTTP status code
    mensaje_error TEXT,                    -- Si hubo error
    
    -- Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para búsqueda eficiente
    INDEX idx_user_id (user_id),
    INDEX idx_entidad (entidad, entidad_id),
    INDEX idx_accion (accion),
    INDEX idx_created_at (created_at),
    INDEX idx_exitoso (exitoso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vista: usuarios con rol
CREATE OR REPLACE VIEW v_usuarios_con_rol AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.nombres,
    u.apellidos,
    u.status,
    r.id AS rol_id,
    r.nombre AS rol_nombre,
    r.descripcion AS rol_descripcion,
    u.created_at,
    u.updated_at
FROM usuarios u
INNER JOIN roles r ON u.rol_id = r.id
WHERE u.is_deleted = FALSE;

-- ============================================================================
-- 2. ACADÉMICO SERVICE SCHEMA (sga_academico)
-- Responsabilidad: Estructura académica, periodos, escalas y umbrales
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS sga_academico DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sga_academico;

-- Tabla: grados
CREATE TABLE IF NOT EXISTS grados (
    id CHAR(36) NOT NULL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    nivel ENUM('INICIAL', 'PRIMARIA', 'SECUNDARIA') NOT NULL,
    orden INT NOT NULL,
    descripcion TEXT,
    status ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_nivel_orden (nivel, orden),
    INDEX idx_nivel (nivel),
    INDEX idx_status (status),
    CHECK (nivel IN ('INICIAL', 'PRIMARIA', 'SECUNDARIA')),
    CHECK (status IN ('ACTIVO', 'INACTIVO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: secciones
CREATE TABLE IF NOT EXISTS secciones (
    id CHAR(36) NOT NULL PRIMARY KEY,
    grado_id CHAR(36) NOT NULL,
    nombre VARCHAR(10) NOT NULL,
    año_escolar YEAR NOT NULL,
    capacidad_maxima INT,
    status ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (grado_id) REFERENCES grados(id),
    UNIQUE KEY uk_grado_nombre_año (grado_id, nombre, año_escolar),
    INDEX idx_grado (grado_id),
    INDEX idx_año (año_escolar),
    CHECK (status IN ('ACTIVO', 'INACTIVO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: cursos
CREATE TABLE IF NOT EXISTS cursos (
    id CHAR(36) NOT NULL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    horas_semanales INT,
    status ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_codigo (codigo),
    INDEX idx_status (status),
    CHECK (status IN ('ACTIVO', 'INACTIVO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: periodo_tipos
CREATE TABLE IF NOT EXISTS periodo_tipos (
    id CHAR(36) NOT NULL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    num_periodos INT NOT NULL,
    descripcion VARCHAR(255),
    status ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (num_periodos > 0 AND num_periodos <= 12),
    CHECK (status IN ('ACTIVO', 'INACTIVO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: periodos
CREATE TABLE IF NOT EXISTS periodos (
    id CHAR(36) NOT NULL PRIMARY KEY,
    año_escolar YEAR NOT NULL,
    tipo_id CHAR(36) NOT NULL,
    numero INT NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    status ENUM('ACTIVO', 'CERRADO') NOT NULL DEFAULT 'ACTIVO',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_id) REFERENCES periodo_tipos(id),
    UNIQUE KEY uk_año_tipo_numero (año_escolar, tipo_id, numero),
    INDEX idx_año (año_escolar),
    INDEX idx_tipo (tipo_id),
    INDEX idx_fechas (fecha_inicio, fecha_fin),
    CHECK (fecha_fin > fecha_inicio),
    CHECK (status IN ('ACTIVO', 'CERRADO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: clases
CREATE TABLE IF NOT EXISTS clases (
    id CHAR(36) NOT NULL PRIMARY KEY,
    curso_id CHAR(36) NOT NULL,
    seccion_id CHAR(36) NOT NULL,
    periodo_id CHAR(36) NOT NULL,
    docente_user_id CHAR(36) NOT NULL,
    status ENUM('ACTIVA', 'FINALIZADA', 'CANCELADA') NOT NULL DEFAULT 'ACTIVA',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (curso_id) REFERENCES cursos(id),
    FOREIGN KEY (seccion_id) REFERENCES secciones(id),
    FOREIGN KEY (periodo_id) REFERENCES periodos(id),
    UNIQUE KEY uk_curso_seccion_periodo (curso_id, seccion_id, periodo_id),
    INDEX idx_curso (curso_id),
    INDEX idx_seccion (seccion_id),
    INDEX idx_periodo (periodo_id),
    INDEX idx_docente (docente_user_id),
    CHECK (status IN ('ACTIVA', 'FINALIZADA', 'CANCELADA'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: escalas_calificacion
CREATE TABLE IF NOT EXISTS escalas_calificacion (
    id CHAR(36) NOT NULL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    tipo ENUM('NUMERICA', 'LITERAL') NOT NULL,
    valor_minimo DECIMAL(5,2),
    valor_maximo DECIMAL(5,2),
    descripcion TEXT,
    status ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo (tipo),
    INDEX idx_status (status),
    CHECK (tipo IN ('NUMERICA', 'LITERAL')),
    CHECK (status IN ('ACTIVO', 'INACTIVO')),
    CHECK (tipo = 'LITERAL' OR (valor_maximo > valor_minimo))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: valores_escala
CREATE TABLE IF NOT EXISTS valores_escala (
    id CHAR(36) NOT NULL PRIMARY KEY,
    escala_id CHAR(36) NOT NULL,
    valor VARCHAR(10) NOT NULL,
    equivalente_numerico DECIMAL(5,2),
    descripcion VARCHAR(100),
    orden INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (escala_id) REFERENCES escalas_calificacion(id) ON DELETE CASCADE,
    UNIQUE KEY uk_escala_valor (escala_id, valor),
    INDEX idx_escala (escala_id),
    INDEX idx_orden (orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: umbrales_alerta
CREATE TABLE IF NOT EXISTS umbrales_alerta (
    id CHAR(36) NOT NULL PRIMARY KEY,
    grado_id CHAR(36),
    curso_id CHAR(36),
    escala_id CHAR(36) NOT NULL,
    valor_minimo_literal VARCHAR(10),
    valor_minimo_numerico DECIMAL(5,2),
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (grado_id) REFERENCES grados(id),
    FOREIGN KEY (curso_id) REFERENCES cursos(id),
    FOREIGN KEY (escala_id) REFERENCES escalas_calificacion(id),
    INDEX idx_grado (grado_id),
    INDEX idx_curso (curso_id),
    INDEX idx_escala (escala_id),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: auditoria_logs (Trazabilidad de acciones académicas)
CREATE TABLE IF NOT EXISTS auditoria_logs (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36),
    username VARCHAR(100),
    rol_nombre VARCHAR(50),
    accion VARCHAR(50) NOT NULL,
    entidad VARCHAR(100) NOT NULL,
    entidad_id CHAR(36),
    descripcion TEXT,
    datos_anteriores JSON,
    datos_nuevos JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    endpoint VARCHAR(255),
    metodo_http VARCHAR(10),
    exitoso BOOLEAN NOT NULL DEFAULT TRUE,
    codigo_respuesta INT,
    mensaje_error TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_entidad (entidad, entidad_id),
    INDEX idx_accion (accion),
    INDEX idx_created_at (created_at),
    INDEX idx_exitoso (exitoso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vista: clases_detalle
CREATE OR REPLACE VIEW v_clases_detalle AS
SELECT 
    c.id AS clase_id,
    cur.codigo AS curso_codigo,
    cur.nombre AS curso_nombre,
    g.nombre AS grado_nombre,
    g.nivel AS grado_nivel,
    s.nombre AS seccion_nombre,
    s.año_escolar,
    p.nombre AS periodo_nombre,
    p.fecha_inicio AS periodo_inicio,
    p.fecha_fin AS periodo_fin,
    c.docente_user_id,
    c.status,
    c.created_at
FROM clases c
INNER JOIN cursos cur ON c.curso_id = cur.id
INNER JOIN secciones s ON c.seccion_id = s.id
INNER JOIN grados g ON s.grado_id = g.id
INNER JOIN periodos p ON c.periodo_id = p.id
WHERE c.is_deleted = FALSE;

-- Vista: escalas_con_valores
CREATE OR REPLACE VIEW v_escalas_con_valores AS
SELECT 
    e.id AS escala_id,
    e.nombre AS escala_nombre,
    e.tipo,
    e.valor_minimo,
    e.valor_maximo,
    v.id AS valor_id,
    v.valor,
    v.equivalente_numerico,
    v.descripcion AS valor_descripcion,
    v.orden
FROM escalas_calificacion e
LEFT JOIN valores_escala v ON e.id = v.escala_id
WHERE e.is_deleted = FALSE
ORDER BY e.nombre, v.orden;

-- ============================================================================
-- 3. PERSONAS SERVICE SCHEMA (sga_personas)
-- Responsabilidad: Gestión de alumnos, padres y relaciones
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS sga_personas DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sga_personas;

-- Tabla: alumnos
CREATE TABLE IF NOT EXISTS alumnos (
    id CHAR(36) NOT NULL PRIMARY KEY,
    codigo_alumno VARCHAR(20) NOT NULL UNIQUE,
    dni VARCHAR(20) UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    fecha_nacimiento DATE NOT NULL,
    genero ENUM('M', 'F', 'OTRO') NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(255),
    foto_url VARCHAR(500),
    status ENUM('ACTIVO', 'RETIRADO', 'TRASLADADO') NOT NULL DEFAULT 'ACTIVO',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_codigo (codigo_alumno),
    INDEX idx_dni (dni),
    INDEX idx_nombres (nombres, apellido_paterno),
    INDEX idx_status (status),
    CHECK (genero IN ('M', 'F', 'OTRO')),
    CHECK (status IN ('ACTIVO', 'RETIRADO', 'TRASLADADO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: padres
CREATE TABLE IF NOT EXISTS padres (
    id CHAR(36) NOT NULL PRIMARY KEY,
    dni VARCHAR(20) UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    telefono VARCHAR(20),
    celular VARCHAR(20),
    email VARCHAR(255) NOT NULL,
    direccion TEXT,
    ocupacion VARCHAR(100),
    status ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dni (dni),
    INDEX idx_nombres (nombres, apellido_paterno),
    INDEX idx_email (email),
    INDEX idx_status (status),
    CHECK (status IN ('ACTIVO', 'INACTIVO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: relaciones_padre_alumno
CREATE TABLE IF NOT EXISTS relaciones_padre_alumno (
    id CHAR(36) NOT NULL PRIMARY KEY,
    padre_id CHAR(36) NOT NULL,
    alumno_id CHAR(36) NOT NULL,
    tipo_relacion ENUM('PADRE', 'MADRE', 'TUTOR', 'APODERADO') NOT NULL,
    es_contacto_principal BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (padre_id) REFERENCES padres(id),
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
    UNIQUE KEY uk_padre_alumno (padre_id, alumno_id),
    INDEX idx_padre (padre_id),
    INDEX idx_alumno (alumno_id),
    INDEX idx_tipo (tipo_relacion),
    CHECK (tipo_relacion IN ('PADRE', 'MADRE', 'TUTOR', 'APODERADO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: matriculas_clase
CREATE TABLE IF NOT EXISTS matriculas_clase (
    id CHAR(36) NOT NULL PRIMARY KEY,
    alumno_id CHAR(36) NOT NULL,
    clase_id CHAR(36) NOT NULL,
    fecha_matricula DATE NOT NULL,
    status ENUM('ACTIVO', 'RETIRADO', 'CONGELADO') NOT NULL DEFAULT 'ACTIVO',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
    UNIQUE KEY uk_alumno_clase (alumno_id, clase_id),
    INDEX idx_alumno (alumno_id),
    INDEX idx_clase (clase_id),
    INDEX idx_status (status),
    CHECK (status IN ('ACTIVO', 'RETIRADO', 'CONGELADO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: auditoria_logs (Trazabilidad de acciones de personas)
CREATE TABLE IF NOT EXISTS auditoria_logs (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36),
    username VARCHAR(100),
    rol_nombre VARCHAR(50),
    accion VARCHAR(50) NOT NULL,
    entidad VARCHAR(100) NOT NULL,
    entidad_id CHAR(36),
    descripcion TEXT,
    datos_anteriores JSON,
    datos_nuevos JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    endpoint VARCHAR(255),
    metodo_http VARCHAR(10),
    exitoso BOOLEAN NOT NULL DEFAULT TRUE,
    codigo_respuesta INT,
    mensaje_error TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_entidad (entidad, entidad_id),
    INDEX idx_accion (accion),
    INDEX idx_created_at (created_at),
    INDEX idx_exitoso (exitoso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vista: alumnos_con_padres
CREATE OR REPLACE VIEW v_alumnos_con_padres AS
SELECT 
    a.id AS alumno_id,
    a.codigo_alumno,
    a.dni AS alumno_dni,
    CONCAT(a.nombres, ' ', a.apellido_paterno, ' ', IFNULL(a.apellido_materno, '')) AS alumno_nombre_completo,
    a.fecha_nacimiento,
    a.genero,
    a.status AS alumno_status,
    p.id AS padre_id,
    p.dni AS padre_dni,
    CONCAT(p.nombres, ' ', p.apellido_paterno, ' ', IFNULL(p.apellido_materno, '')) AS padre_nombre_completo,
    p.email AS padre_email,
    p.celular AS padre_celular,
    r.tipo_relacion,
    r.es_contacto_principal
FROM alumnos a
LEFT JOIN relaciones_padre_alumno r ON a.id = r.alumno_id AND r.is_deleted = FALSE
LEFT JOIN padres p ON r.padre_id = p.id AND p.is_deleted = FALSE
WHERE a.is_deleted = FALSE;

-- Vista: matriculas_detalle
CREATE OR REPLACE VIEW v_matriculas_detalle AS
SELECT 
    m.id AS matricula_id,
    m.alumno_id,
    a.codigo_alumno,
    CONCAT(a.nombres, ' ', a.apellido_paterno, ' ', IFNULL(a.apellido_materno, '')) AS alumno_nombre_completo,
    m.clase_id,
    m.fecha_matricula,
    m.status AS matricula_status,
    m.created_at
FROM matriculas_clase m
INNER JOIN alumnos a ON m.alumno_id = a.id
WHERE m.is_deleted = FALSE AND a.is_deleted = FALSE;

-- ============================================================================
-- 4. NOTAS SERVICE SCHEMA (sga_notas)
-- Responsabilidad: Registro de notas, evaluaciones y notificaciones
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS sga_notas DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sga_notas;

-- Tabla: tipos_evaluacion
CREATE TABLE IF NOT EXISTS tipos_evaluacion (
    id CHAR(36) NOT NULL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    peso_default DECIMAL(5,2),
    descripcion TEXT,
    status ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_codigo (codigo),
    INDEX idx_status (status),
    CHECK (status IN ('ACTIVO', 'INACTIVO')),
    CHECK (peso_default IS NULL OR (peso_default >= 0 AND peso_default <= 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: notas
CREATE TABLE IF NOT EXISTS notas (
    id CHAR(36) NOT NULL PRIMARY KEY,
    matricula_clase_id CHAR(36) NOT NULL,
    tipo_evaluacion_id CHAR(36) NOT NULL,
    periodo_id CHAR(36) NOT NULL,
    escala_id CHAR(36) NOT NULL,
    valor_literal VARCHAR(10),
    valor_numerico DECIMAL(5,2),
    peso DECIMAL(5,2),
    observaciones TEXT,
    fecha_registro DATE NOT NULL,
    registrado_por_user_id CHAR(36) NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_evaluacion_id) REFERENCES tipos_evaluacion(id),
    INDEX idx_matricula (matricula_clase_id),
    INDEX idx_tipo_evaluacion (tipo_evaluacion_id),
    INDEX idx_periodo (periodo_id),
    INDEX idx_escala (escala_id),
    INDEX idx_fecha (fecha_registro),
    INDEX idx_registrado_por (registrado_por_user_id),
    CHECK (valor_literal IS NOT NULL OR valor_numerico IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: alertas_notificacion
CREATE TABLE IF NOT EXISTS alertas_notificacion (
    id CHAR(36) NOT NULL PRIMARY KEY,
    nota_id CHAR(36) NOT NULL,
    alumno_id CHAR(36) NOT NULL,
    padre_id CHAR(36),
    tipo_alerta ENUM('NOTA_BAJA', 'PROMEDIO_BAJO', 'RIESGO_DESAPROBACION') NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_lectura TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nota_id) REFERENCES notas(id),
    INDEX idx_nota (nota_id),
    INDEX idx_alumno (alumno_id),
    INDEX idx_padre (padre_id),
    INDEX idx_leida (leida),
    INDEX idx_tipo (tipo_alerta),
    CHECK (tipo_alerta IN ('NOTA_BAJA', 'PROMEDIO_BAJO', 'RIESGO_DESAPROBACION'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: outbox_notificaciones (patrón Outbox para envío async)
CREATE TABLE IF NOT EXISTS outbox_notificaciones (
    id CHAR(36) NOT NULL PRIMARY KEY,
    alerta_id CHAR(36),
    tipo ENUM('EMAIL', 'SMS', 'PUSH') NOT NULL,
    destinatario VARCHAR(255) NOT NULL,
    asunto VARCHAR(255),
    mensaje TEXT NOT NULL,
    metadata JSON,
    estado ENUM('PENDIENTE', 'PROCESANDO', 'ENVIADO', 'FALLIDO') NOT NULL DEFAULT 'PENDIENTE',
    intentos INT NOT NULL DEFAULT 0,
    ultimo_error TEXT,
    fecha_envio TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (alerta_id) REFERENCES alertas_notificacion(id),
    INDEX idx_alerta (alerta_id),
    INDEX idx_estado (estado),
    INDEX idx_tipo (tipo),
    INDEX idx_created (created_at),
    CHECK (tipo IN ('EMAIL', 'SMS', 'PUSH')),
    CHECK (estado IN ('PENDIENTE', 'PROCESANDO', 'ENVIADO', 'FALLIDO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: auditoria_logs (Trazabilidad de acciones de notas y alertas)
CREATE TABLE IF NOT EXISTS auditoria_logs (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36),
    username VARCHAR(100),
    rol_nombre VARCHAR(50),
    accion VARCHAR(50) NOT NULL,
    entidad VARCHAR(100) NOT NULL,
    entidad_id CHAR(36),
    descripcion TEXT,
    datos_anteriores JSON,
    datos_nuevos JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    endpoint VARCHAR(255),
    metodo_http VARCHAR(10),
    exitoso BOOLEAN NOT NULL DEFAULT TRUE,
    codigo_respuesta INT,
    mensaje_error TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_entidad (entidad, entidad_id),
    INDEX idx_accion (accion),
    INDEX idx_created_at (created_at),
    INDEX idx_exitoso (exitoso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vista: notas_detalle
CREATE OR REPLACE VIEW v_notas_detalle AS
SELECT 
    n.id AS nota_id,
    n.matricula_clase_id,
    n.periodo_id,
    te.nombre AS tipo_evaluacion,
    te.codigo AS tipo_evaluacion_codigo,
    n.valor_literal,
    n.valor_numerico,
    n.peso,
    n.observaciones,
    n.fecha_registro,
    n.registrado_por_user_id,
    n.escala_id,
    n.created_at
FROM notas n
INNER JOIN tipos_evaluacion te ON n.tipo_evaluacion_id = te.id
WHERE n.is_deleted = FALSE;

-- Vista: alertas_pendientes
CREATE OR REPLACE VIEW v_alertas_pendientes AS
SELECT 
    a.id AS alerta_id,
    a.alumno_id,
    a.padre_id,
    a.tipo_alerta,
    a.mensaje,
    a.leida,
    o.id AS outbox_id,
    o.tipo AS tipo_notificacion,
    o.destinatario,
    o.estado AS estado_envio,
    o.intentos,
    a.created_at
FROM alertas_notificacion a
LEFT JOIN outbox_notificaciones o ON a.id = o.alerta_id
WHERE a.leida = FALSE OR o.estado IN ('PENDIENTE', 'FALLIDO');

-- ============================================================================
-- 5. SEEDS / DATOS INICIALES
-- ============================================================================

-- IAM: Roles
USE sga_iam;

INSERT INTO roles (id, nombre, descripcion) VALUES
(UUID(), 'ADMIN', 'Administrador del sistema con acceso completo'),
(UUID(), 'DOCENTE', 'Docente que puede registrar notas y ver sus clases'),
(UUID(), 'PADRE', 'Padre o tutor que puede ver información de sus hijos');

-- IAM: Usuario administrador default
SET @admin_rol_id = (SELECT id FROM roles WHERE nombre = 'ADMIN' LIMIT 1);

INSERT INTO usuarios (id, username, email, password_hash, rol_id, nombres, apellidos, status)
VALUES (
    UUID(),
    'admin',
    'admin@colegio.com',
    '$2b$12$sEk01eBfa464Rjwyr2HwkugG5252KkjmvUPdwF1nFyrAykcOt9NQO', -- Password: Admin123!
    @admin_rol_id,
    'Administrador',
    'Sistema',
    'ACTIVO'
);

-- ACADÉMICO: Período tipos
USE sga_academico;

/*INSERT INTO periodo_tipos (id, nombre, num_periodos, descripcion) VALUES
(UUID(), 'BIMESTRE', 4, 'Año escolar dividido en 4 bimestres'),
(UUID(), 'TRIMESTRE', 3, 'Año escolar dividido en 3 trimestres'),
(UUID(), 'SEMESTRE', 2, 'Año escolar dividido en 2 semestres'),
(UUID(), 'ANUAL', 1, 'Año escolar completo sin divisiones');

-- ACADÉMICO: Grados
INSERT INTO grados (id, nombre, nivel, orden, descripcion) VALUES
(UUID(), '1ro Primaria', 'PRIMARIA', 1, 'Primer grado de educación primaria'),
(UUID(), '2do Primaria', 'PRIMARIA', 2, 'Segundo grado de educación primaria'),
(UUID(), '3ro Primaria', 'PRIMARIA', 3, 'Tercer grado de educación primaria'),
(UUID(), '1ro Secundaria', 'SECUNDARIA', 1, 'Primer grado de educación secundaria'),
(UUID(), '2do Secundaria', 'SECUNDARIA', 2, 'Segundo grado de educación secundaria');*/

-- ACADÉMICO: Secciones (año 2025)
SET @grado_1_prim = (SELECT id FROM grados WHERE nombre = '1ro Primaria' LIMIT 1);
SET @grado_2_prim = (SELECT id FROM grados WHERE nombre = '2do Primaria' LIMIT 1);

/*INSERT INTO secciones (id, grado_id, nombre, año_escolar, capacidad_maxima) VALUES
(UUID(), @grado_1_prim, 'A', 2025, 30),
(UUID(), @grado_1_prim, 'B', 2025, 30),
(UUID(), @grado_2_prim, 'A', 2025, 30),
(UUID(), @grado_2_prim, 'B', 2025, 30);*/

-- ACADÉMICO: Cursos
/*INSERT INTO cursos (id, codigo, nombre, descripcion, horas_semanales) VALUES
(UUID(), 'MAT', 'Matemática', 'Curso de matemáticas', 5),
(UUID(), 'COM', 'Comunicación', 'Lenguaje y comunicación', 5),
(UUID(), 'CTA', 'Ciencia y Tecnología', 'Ciencias naturales y tecnología', 4),
(UUID(), 'PS', 'Personal Social', 'Ciencias sociales y formación ciudadana', 3),
(UUID(), 'ART', 'Arte y Cultura', 'Educación artística', 2);*/

-- ACADÉMICO: Escalas de calificación
/*INSERT INTO escalas_calificacion (id, nombre, tipo, valor_minimo, valor_maximo, descripcion) VALUES
(UUID(), 'Escala Vigesimal (0-20)', 'NUMERICA', 0, 20, 'Escala numérica del 0 al 20'),
(UUID(), 'Escala Centesimal (0-100)', 'NUMERICA', 0, 100, 'Escala numérica del 0 al 100'),
(UUID(), 'Escala Literal AD-A-B-C', 'LITERAL', NULL, NULL, 'Escala literal: AD (Logro destacado), A (Logro esperado), B (En proceso), C (En inicio)');
*/
-- ACADÉMICO: Valores de escala literal
SET @escala_literal_id = (SELECT id FROM escalas_calificacion WHERE nombre = 'Escala Literal AD-A-B-C' LIMIT 1);

/*INSERT INTO valores_escala (id, escala_id, valor, equivalente_numerico, descripcion, orden) VALUES
(UUID(), @escala_literal_id, 'AD', 18.00, 'Logro destacado', 1),
(UUID(), @escala_literal_id, 'A', 14.00, 'Logro esperado', 2),
(UUID(), @escala_literal_id, 'B', 11.00, 'En proceso', 3),
(UUID(), @escala_literal_id, 'C', 8.00, 'En inicio', 4);*/

-- ACADÉMICO: Umbrales de alerta globales
SET @escala_0_20 = (SELECT id FROM escalas_calificacion WHERE nombre = 'Escala Vigesimal (0-20)' LIMIT 1);

/*INSERT INTO umbrales_alerta (id, grado_id, curso_id, escala_id, valor_minimo_numerico, descripcion, activo) VALUES
(UUID(), NULL, NULL, @escala_0_20, 11.00, 'Umbral global para escala 0-20: nota menor a 11', TRUE),
(UUID(), NULL, NULL, @escala_literal_id, NULL, 'Umbral global para escala literal: nota menor a B', TRUE);*/

UPDATE umbrales_alerta 
SET valor_minimo_literal = 'B' 
WHERE escala_id = @escala_literal_id AND valor_minimo_literal IS NULL;

-- ACADÉMICO: Periodos (bimestres 2025)
SET @tipo_bimestre = (SELECT id FROM periodo_tipos WHERE nombre = 'BIMESTRE' LIMIT 1);

/*INSERT INTO periodos (id, año_escolar, tipo_id, numero, nombre, fecha_inicio, fecha_fin) VALUES
(UUID(), 2025, @tipo_bimestre, 1, 'I Bimestre', '2025-03-01', '2025-05-15'),
(UUID(), 2025, @tipo_bimestre, 2, 'II Bimestre', '2025-05-16', '2025-07-31'),
(UUID(), 2025, @tipo_bimestre, 3, 'III Bimestre', '2025-08-01', '2025-10-15'),
(UUID(), 2025, @tipo_bimestre, 4, 'IV Bimestre', '2025-10-16', '2025-12-20');*/

-- PERSONAS: Alumnos de ejemplo
USE sga_personas;

/*INSERT INTO alumnos (id, codigo_alumno, dni, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, genero, email) VALUES
(UUID(), 'ALU2025001', '12345678', 'Juan Carlos', 'Pérez', 'García', '2018-05-10', 'M', 'juan.perez@estudiante.com'),
(UUID(), 'ALU2025002', '23456789', 'María Fernanda', 'López', 'Martínez', '2018-03-15', 'F', 'maria.lopez@estudiante.com'),
(UUID(), 'ALU2025003', '34567890', 'Pedro Antonio', 'Rodríguez', 'Sánchez', '2017-08-20', 'M', 'pedro.rodriguez@estudiante.com'),
(UUID(), 'ALU2025004', '45678901', 'Ana Lucía', 'Torres', 'Díaz', '2017-11-05', 'F', 'ana.torres@estudiante.com');

-- PERSONAS: Padres de ejemplo
INSERT INTO padres (id, dni, nombres, apellido_paterno, apellido_materno, email, celular) VALUES
(UUID(), '87654321', 'Carlos Alberto', 'Pérez', 'Ruiz', 'carlos.perez@email.com', '987654321'),
(UUID(), '98765432', 'Rosa María', 'García', 'Flores', 'rosa.garcia@email.com', '987654322'),
(UUID(), '76543210', 'José Luis', 'López', 'Castro', 'jose.lopez@email.com', '987654323'),
(UUID(), '65432109', 'Carmen Elena', 'Martínez', 'Vera', 'carmen.martinez@email.com', '987654324');
*/
-- PERSONAS: Relaciones padre-alumno
SET @alumno1 = (SELECT id FROM alumnos WHERE codigo_alumno = 'ALU2025001' LIMIT 1);
SET @alumno2 = (SELECT id FROM alumnos WHERE codigo_alumno = 'ALU2025002' LIMIT 1);
SET @padre1 = (SELECT id FROM padres WHERE dni = '87654321' LIMIT 1);
SET @padre2 = (SELECT id FROM padres WHERE dni = '98765432' LIMIT 1);
SET @padre3 = (SELECT id FROM padres WHERE dni = '76543210' LIMIT 1);
SET @padre4 = (SELECT id FROM padres WHERE dni = '65432109' LIMIT 1);

/*INSERT INTO relaciones_padre_alumno (id, padre_id, alumno_id, tipo_relacion, es_contacto_principal) VALUES
(UUID(), @padre1, @alumno1, 'PADRE', TRUE),
(UUID(), @padre2, @alumno1, 'MADRE', FALSE),
(UUID(), @padre3, @alumno2, 'PADRE', TRUE),
(UUID(), @padre4, @alumno2, 'MADRE', FALSE);
*/
-- NOTAS: Tipos de evaluación
USE sga_notas;

/*INSERT INTO tipos_evaluacion (id, nombre, codigo, peso_default, descripcion) VALUES
(UUID(), 'Examen Bimestral', 'EXA', 40.00, 'Evaluación principal del bimestre'),
(UUID(), 'Práctica Calificada', 'PRA', 30.00, 'Práctica escrita en clase'),
(UUID(), 'Tarea', 'TAR', 15.00, 'Tareas y trabajos para casa'),
(UUID(), 'Trabajo Grupal', 'TRG', 15.00, 'Proyectos y trabajos en equipo'),
(UUID(), 'Participación', 'PAR', 10.00, 'Participación en clase');
*/
-- ============================================================================
-- 6. USUARIOS DE APLICACIÓN (GRANTS)
-- ============================================================================

-- Crear usuarios de aplicación para cada servicio (Host: %)
CREATE USER IF NOT EXISTS 'app_iam'@'%' IDENTIFIED BY 'iam_pass_2025';
CREATE USER IF NOT EXISTS 'app_academico'@'%' IDENTIFIED BY 'academico_pass_2025';
CREATE USER IF NOT EXISTS 'app_personas'@'%' IDENTIFIED BY 'personas_pass_2025';
CREATE USER IF NOT EXISTS 'app_notas'@'%' IDENTIFIED BY 'notas_pass_2025';

-- Crear usuarios de aplicación para cada servicio (Host: localhost) - Para evitar problemas de conexión local
CREATE USER IF NOT EXISTS 'app_iam'@'localhost' IDENTIFIED BY 'iam_pass_2025';
CREATE USER IF NOT EXISTS 'app_academico'@'localhost' IDENTIFIED BY 'academico_pass_2025';
CREATE USER IF NOT EXISTS 'app_personas'@'localhost' IDENTIFIED BY 'personas_pass_2025';
CREATE USER IF NOT EXISTS 'app_notas'@'localhost' IDENTIFIED BY 'notas_pass_2025';

-- Grants para IAM service
GRANT SELECT, INSERT, UPDATE, DELETE ON sga_iam.* TO 'app_iam'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON sga_iam.* TO 'app_iam'@'localhost';

-- Grants para Académico service
GRANT SELECT, INSERT, UPDATE, DELETE ON sga_academico.* TO 'app_academico'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON sga_academico.* TO 'app_academico'@'localhost';

-- Grants para Personas service
GRANT SELECT, INSERT, UPDATE, DELETE ON sga_personas.* TO 'app_personas'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON sga_personas.* TO 'app_personas'@'localhost';

-- Grants para Notas service
GRANT SELECT, INSERT, UPDATE, DELETE ON sga_notas.* TO 'app_notas'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON sga_notas.* TO 'app_notas'@'localhost';

-- Notas service también necesita leer de académico
GRANT SELECT ON sga_academico.umbrales_alerta TO 'app_notas'@'%';
GRANT SELECT ON sga_academico.escalas_calificacion TO 'app_notas'@'%';
GRANT SELECT ON sga_academico.valores_escala TO 'app_notas'@'%';

GRANT SELECT ON sga_academico.umbrales_alerta TO 'app_notas'@'localhost';
GRANT SELECT ON sga_academico.escalas_calificacion TO 'app_notas'@'localhost';
GRANT SELECT ON sga_academico.valores_escala TO 'app_notas'@'localhost';

FLUSH PRIVILEGES;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

SELECT 'Base de datos creada exitosamente!' AS status;
SELECT 'Esquemas creados: sga_iam, sga_academico, sga_personas, sga_notas' AS info;
SELECT 'Usuario admin: admin@colegio.com / Admin123!' AS credentials;
