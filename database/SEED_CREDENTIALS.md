# Credenciales de Acceso - Datos de Prueba (seed.sql)

## ⚠️ IMPORTANTE
Estas credenciales son SOLO para ambiente de desarrollo/testing.
**NUNCA usar en producción.**

---

## 🚀 USUARIOS DEMO (Quick Login Frontend)

### 👨‍🏫 Docente Demo
**Email:** `docente@colegio.com`  
**Password:** `Docente123!`  
**Rol:** DOCENTE

### 👨‍👩‍👧‍👦 Padre Demo
**Email:** `padre@colegio.com`  
**Password:** `Padre123!`  
**Rol:** PADRE

### 🔐 Administrador
**Email:** `admin@colegio.com`  
**Password:** `Admin123!`  
**Rol:** ADMIN

> **Nota:** Estos usuarios están configurados en el botón "Quick Login" del frontend

---

## 👨‍🏫 DOCENTES (10 usuarios)

**Usuario:** `docente01` - `docente10`  
**Password:** `docente123`  
**Email:** `docente01@colegio.com` - `docente10@colegio.com`

### Ejemplos de login:
```
Username: docente01
Password: docente123

Username: docente02
Password: docente123
```

---

## 👨‍👩‍👧‍👦 PADRES (20 usuarios)

**Usuario:** `padre01` - `padre20`  
**Password:** `padre123`  
**Email:** Según tabla de padres

### Ejemplos de login:
```
Username: padre01
Password: padre123

Username: padre02
Password: padre123
```

---

## 🔐 ADMINISTRADOR (Bootstrap)

**Usuario:** `admin`  
**Password:** `Admin123!`  
**Email:** `admin@colegio.com`

> **Nota:** Usuario creado en bootstrap.sql, también disponible en Quick Login

---

## 📊 Resumen de Datos Insertados

| Tabla | Cantidad | Notas |
|-------|----------|-------|
| Usuarios DOCENTE | 10 | Asignados a clases |
| Usuarios PADRE | 20 | Primeros 20 padres con acceso |
| Alumnos | 50 | Distribuidos en 4 secciones |
| Padres | 60 | Relaciones completas |
| Grados | 15 | Inicial, Primaria, Secundaria |
| Cursos | 20 | Todas las materias |
| Secciones | 22 | 2 secciones por grado |
| Periodos | 4 | Bimestres 2025 |
| Clases | 30+ | Curso + Sección + Periodo + Docente |
| Matrículas | 250+ | Alumnos matriculados en clases |
| Notas | 100+ | Calificaciones variadas (5-20) |

---

## 🔄 Reinstalar Datos de Prueba

```powershell
# Reiniciar base de datos completa
mysql -u root -p < database/bootstrap.sql

# Cargar datos de prueba
mysql -u root -p < database/seed.sql
```

---

## 🧪 Casos de Prueba

### Flujo PADRE:
1. Login: `padre01` / `padre123`
2. Ver hijos matriculados
3. Ver notas por periodo
4. Ver alertas de bajo rendimiento

### Flujo DOCENTE:
1. Login: `docente01` / `docente123`
2. Ver clases asignadas
3. Registrar/editar notas
4. Ver alumnos matriculados

### Flujo ADMIN:
1. Login: `admin` / `Admin123!`
2. Gestionar todos los módulos
3. CRUD completo de todas las entidades

---

## 📝 Notas Técnicas

### Hash de Passwords (bcrypt):
- **docente123**: `$2b$12$5vCPvGQ0kD3V1X8xJ6n0J.F4qXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qX`
- **padre123**: `$2b$12$9vXZ7aYH8kQYZnXJ7xGQJ3Z7qXJ7qXF4qXZ7aYH8kQYZnXJ7xGQJ3`
- **Admin123!**: `$2b$12$sEk01eBfa464Rjwyr2HwkugG5252KkjmvUPdwF1nFyrAykcOt9NQO`

### Distribución de Alumnos:
- **1° Primaria A**: 15 alumnos (A2025001 - A2025015)
- **1° Primaria B**: 15 alumnos (A2025016 - A2025030)
- **2° Primaria A**: 10 alumnos (A2025031 - A2025040)
- **2° Primaria B**: 10 alumnos (A2025041 - A2025050)

### Relaciones Padre-Alumno:
- **Cada alumno tiene 1-2 padres asignados correctamente**
- Los primeros 30 alumnos tienen padre principal + madre secundaria
- Los últimos 20 alumnos tienen solo padre principal
- **Total**: 80 relaciones padre-alumno (50 principales + 30 secundarias)
- Todos los alumnos están matriculados en 5 clases (Matemática, Comunicación, CTA, Personal Social, Inglés)

### Periodos 2025:
- **4 Bimestres** con status ACTIVO
- Frontend filtra automáticamente por año actual (2025)
- Clases creadas para I y II Bimestre

### Distribución de Notas:
- **100+ notas** con distribución realista:
  - 15% desaprobados (5-10)
  - 35% aprobado bajo (11-13)
  - 30% bueno (14-16)
  - 20% muy bueno/excelente (17-20)

---

## 🔍 Verificación de Datos

Después de ejecutar el seed, puedes verificar que todo se insertó correctamente:

```powershell
mysql -u root -p < database\verify_seed_data.sql
```

Este script mostrará:
- Totales por tabla
- Alumnos sin padres (debe estar vacío ✓)
- Distribución de hijos por padre
- Periodos activos 2025
- Estadísticas de notas por periodo
- Alumnos por sección

---

**Fecha de creación:** Noviembre 2025  
**Versión:** 1.0  
**Ambiente:** Desarrollo/Testing
