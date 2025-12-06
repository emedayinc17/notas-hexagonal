# Notas Service - HTTP Router Admin
from fastapi import APIRouter, Depends, Header, status, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from shared.common import DomainException, extract_bearer_token, decode_jwt_token, AuditHelper, AccionAuditoria
from app.infrastructure.http.dependencies import *
import asyncio


router = APIRouter(prefix="/v1", tags=["notas"])


def _extract_user_and_role(payload: dict):
    """Extrae user_id y rol de un payload JWT con nombres de claim alternativos."""
    user_id = payload.get('user_id') or payload.get('sub')
    rol = (payload.get('rol_nombre') or payload.get('rol') or payload.get('role') or '')
    if isinstance(rol, str):
        rol = rol.upper()
    return user_id, rol


def _log_http_response(label: str, resp, url: str = None):
    try:
        text = None
        try:
            text = resp.text
        except Exception:
            text = '<no-text>'
        print(f"[DEBUG HTTP] {label} url={url or ''} status={getattr(resp, 'status_code', None)} body={str(text)[:400]}")
    except Exception as e:
        print(f"[DEBUG HTTP] Error logging http response: {e}")


# Request Models
class RegistrarNotaRequest(BaseModel):
    matricula_clase_id: str
    tipo_evaluacion_id: str
    periodo_id: str
    escala_id: str
    valor_literal: Optional[str] = None
    valor_numerico: Optional[float] = None
    peso: Optional[float] = None
    observaciones: Optional[str] = None
    columna_nota: Optional[str] = "N1"


class RegistrarNotasBatchRequest(BaseModel):
    notas: list[RegistrarNotaRequest]
    idempotency_key: Optional[str] = None


class UpdateNotaRequest(BaseModel):
    tipo_evaluacion_id: Optional[str] = None
    escala_id: Optional[str] = None
    valor_literal: Optional[str] = None
    valor_numerico: Optional[float] = None
    peso: Optional[float] = None
    observaciones: Optional[str] = None


class CreateTipoEvaluacionRequest(BaseModel):
    codigo: str
    nombre: str
    peso_default: Optional[float] = None
    descripcion: Optional[str] = None


class UpdateTipoEvaluacionRequest(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    peso_default: Optional[float] = None
    descripcion: Optional[str] = None


class CreateEscalaRequest(BaseModel):
    nombre: str
    tipo: str  # NUMERICA, LITERAL, CONCEPTUAL
    valor_minimo: Optional[float] = None
    valor_maximo: Optional[float] = None
    descripcion: Optional[str] = None


class UpdateEscalaRequest(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    valor_minimo: Optional[float] = None
    valor_maximo: Optional[float] = None
    descripcion: Optional[str] = None


# Endpoints
@router.post("/notas", status_code=status.HTTP_201_CREATED)
async def registrar_nota(
    request: RegistrarNotaRequest,
    authorization: Optional[str] = Header(None),
    use_case = Depends(get_registrar_nota_use_case),
    settings = Depends(get_settings),
):
    try:
        import httpx
        
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        user_id, rol = _extract_user_and_role(payload)
        
        if rol not in ["DOCENTE", "ADMIN"]:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo DOCENTE o ADMIN pueden registrar notas"}
            )
        
        # Si es DOCENTE, validar que la matrícula pertenece a una de sus clases
        if rol == "DOCENTE":
            async with httpx.AsyncClient() as client:
                # Obtener la matrícula para saber a qué clase pertenece
                mat_response = await client.get(
                    f"{settings.PERSONAS_SERVICE_URL}/v1/matriculas/{request.matricula_clase_id}",
                    headers={"Authorization": f"Bearer {token}"}
                )
                _log_http_response("registrar_nota.get_matricula", mat_response, f"{settings.PERSONAS_SERVICE_URL}/v1/matriculas/{request.matricula_clase_id}")
                if mat_response.status_code != 200:
                    return JSONResponse(
                        status_code=status.HTTP_404_NOT_FOUND,
                        content={"error": "NotFound", "message": "Matrícula no encontrada"}
                    )
                
                matricula = mat_response.json()
                clase_id = matricula.get("clase_id")
                
                # Verificar que el docente tiene asignada esa clase
                clases_response = await client.get(
                    f"{settings.ACADEMICO_SERVICE_URL}/v1/docente/clases?limit=100",
                    headers={"Authorization": f"Bearer {token}"}
                )
                _log_http_response("registrar_nota.get_clases_docente", clases_response, f"{settings.ACADEMICO_SERVICE_URL}/v1/docente/clases?limit=100")
                if clases_response.status_code != 200:
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={"error": "Forbidden", "message": "No se pudieron verificar las clases del docente"}
                    )
                
                clases_docente = clases_response.json().get("clases", [])
                clase_ids_docente = [c["id"] for c in clases_docente]
                
                if clase_id not in clase_ids_docente:
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={"error": "Forbidden", "message": "No tienes permiso para registrar notas en esta clase"}
                    )
        
        # Pasar el token original para las llamadas a otros servicios
        result = await use_case.execute(
            matricula_clase_id=request.matricula_clase_id,
            tipo_evaluacion_id=request.tipo_evaluacion_id,
            periodo_id=request.periodo_id,
            escala_id=request.escala_id,
            registrado_por_user_id=user_id,
            valor_literal=request.valor_literal,
            valor_numerico=request.valor_numerico,
            peso=request.peso,
            observaciones=request.observaciones,
            columna_nota=request.columna_nota,
            auth_token=token  # Token para llamadas HTTP a otros servicios
        )
        
        return result
        
    except DomainException as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": e.code, "message": e.message}
        )


@router.post("/notas/batch")
async def registrar_notas_batch(
    request: RegistrarNotasBatchRequest,
    authorization: Optional[str] = Header(None),
    use_case = Depends(get_registrar_nota_use_case),
    settings = Depends(get_settings),
):
    """Registrar un lote de notas por parte de un docente.
    Devuelve resultado por item sin detener el procesamiento ante errores parciales.
    """
    try:
        import httpx

        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        user_id, rol = _extract_user_and_role(payload)

        if rol not in ["DOCENTE", "ADMIN"]:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo DOCENTE o ADMIN pueden registrar notas"}
            )

        # Obtener clases del docente (para verificar pertenencia)
        clase_ids_docente = []
        if rol == "DOCENTE":
            async with httpx.AsyncClient() as client:
                resp = await client.get(f"{settings.ACADEMICO_SERVICE_URL}/v1/docente/clases?limit=100", headers={"Authorization": f"Bearer {token}"})
                _log_http_response("registrar_notas_batch.get_clases_docente", resp, f"{settings.ACADEMICO_SERVICE_URL}/v1/docente/clases?limit=100")
                if resp.status_code == 200:
                    clase_ids_docente = [c.get("id") for c in resp.json().get("clases", [])]
                else:
                    return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"error": "Forbidden", "message": "No se pudieron obtener las clases del docente"})

        results = []
        
        # 1. Identificar matrículas únicas para consultar en paralelo
        unique_matricula_ids = list(set(n.matricula_clase_id for n in request.notas))
        matriculas_map = {} # matricula_id -> { clase_id: ... }

        # 2. Consultar matrículas en paralelo
        async with httpx.AsyncClient() as client:
            # Función auxiliar para fetch
            async def fetch_matricula(mid):
                try:
                    resp = await client.get(
                        f"{settings.PERSONAS_SERVICE_URL}/v1/matriculas/{mid}", 
                        headers={"Authorization": f"Bearer {token}"}
                    )
                    if resp.status_code == 200:
                        return mid, resp.json()
                except Exception as e:
                    print(f"Error fetching matricula {mid}: {e}")
                return mid, None

            # Ejecutar consultas
            tasks = [fetch_matricula(mid) for mid in unique_matricula_ids]
            responses = await asyncio.gather(*tasks)
            
            for mid, data in responses:
                if data:
                    matriculas_map[mid] = data

        # 3. Consultar Umbrales en paralelo (Optimización)
        unique_escala_ids = list(set(n.escala_id for n in request.notas if n.escala_id))
        umbrales_map = {}
        
        if unique_escala_ids:
            async with httpx.AsyncClient() as client:
                async def fetch_umbral(eid):
                    try:
                        resp = await client.get(
                            f"{settings.ACADEMICO_SERVICE_URL}/v1/escalas/{eid}/umbral", # Asumiendo endpoint, si no existe el use case lo maneja
                            headers={"Authorization": f"Bearer {token}"}
                        )
                        # Nota: El cliente academico usa get_umbral_alerta que llama a /v1/configuracion/umbral-alerta?escala_id=...
                        # Vamos a replicar la logica del cliente para ser consistentes o usar el cliente si es posible.
                        # Dado que no tenemos el cliente instanciado aqui facilmente (esta en use_case), hacemos la llamada directa.
                        # Mejor aun: instanciamos el cliente o hacemos la llamada HTTP raw correcta.
                        # Endpoint real usado en AcademicoServiceClient: /v1/configuracion/umbral-alerta
                        resp = await client.get(
                            f"{settings.ACADEMICO_SERVICE_URL}/v1/configuracion/umbral-alerta",
                            params={"escala_id": eid},
                            headers={"Authorization": f"Bearer {token}"}
                        )
                        if resp.status_code == 200:
                            return eid, resp.json()
                    except Exception:
                        pass
                    return eid, None

                tasks_umbral = [fetch_umbral(eid) for eid in unique_escala_ids]
                responses_umbral = await asyncio.gather(*tasks_umbral)
                for eid, data in responses_umbral:
                    if data:
                        umbrales_map[eid] = data

        # 4. Procesar notas en paralelo
        async def process_single_note(n):
            try:
                # Verificar matricula
                mdata = matriculas_map.get(n.matricula_clase_id)
                if not mdata:
                    return {"matricula_clase_id": n.matricula_clase_id, "status": "error", "message": "Matrícula no encontrada (o error de conexión)"}
                
                clase_id = mdata.get("clase_id")

                # Verificar pertenencia del docente a la clase (si es docente)
                if rol == "DOCENTE" and clase_id not in clase_ids_docente:
                    return {"matricula_clase_id": n.matricula_clase_id, "status": "error", "message": "Sin permiso para registrar nota en esta clase"}

                # Llamar al caso de uso existente (ahora optimizado con cache)
                out = await use_case.execute(
                    matricula_clase_id=n.matricula_clase_id,
                    tipo_evaluacion_id=n.tipo_evaluacion_id,
                    periodo_id=n.periodo_id,
                    escala_id=n.escala_id,
                    registrado_por_user_id=user_id,
                    valor_literal=n.valor_literal,
                    valor_numerico=n.valor_numerico,
                    peso=n.peso,
                    observaciones=n.observaciones,
                    columna_nota=n.columna_nota,
                    auth_token=token,
                    matricula_info_cache=mdata,
                    umbral_cache=umbrales_map.get(n.escala_id)
                )
                nota_id = out.get("nota", {}).get("id")
                return {"matricula_clase_id": n.matricula_clase_id, "status": "ok", "nota_id": nota_id}

            except DomainException as de:
                return {"matricula_clase_id": n.matricula_clase_id, "status": "error", "message": de.message}
            except Exception as e:
                return {"matricula_clase_id": n.matricula_clase_id, "status": "error", "message": str(e)}

        # Ejecutar todas las notas en paralelo
        # Usamos return_exceptions=False porque manejamos excepciones dentro de process_single_note
        results = await asyncio.gather(*[process_single_note(n) for n in request.notas])

        return {"results": results}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"error": "INTERNAL_ERROR", "message": str(e)})


@router.get("/notas")
async def list_notas(
    alumno_id: Optional[str] = Query(None),
    clase_id: Optional[str] = Query(None),
    periodo_id: Optional[str] = Query(None),
    tipo_evaluacion_id: Optional[str] = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=1000),
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
):
    """Listar notas con filtros basados en rol"""
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        user_id, rol = _extract_user_and_role(payload)
        
        from app.infrastructure.db.repositories import SqlAlchemyNotaRepository
        from app.infrastructure.db.models import NotaModel
        from sqlalchemy import and_
        import httpx
        
        repo = SqlAlchemyNotaRepository(db)
        
        # Construir query base
        query = db.query(NotaModel).filter(NotaModel.is_deleted == False)
        
        # PADRE: Solo puede ver notas de sus hijos
        if rol == "PADRE":
            # Obtener IDs de hijos del padre usando el endpoint de relaciones
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.PERSONAS_SERVICE_URL}/v1/relaciones/padre/{user_id}",
                    headers={"Authorization": f"Bearer {token}"}
                )
                _log_http_response("list_notas.padre.get_hijos", response, f"{settings.PERSONAS_SERVICE_URL}/v1/relaciones/padre/{user_id}")
                if response.status_code != 200:
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={"error": "Forbidden", "message": "No se pudieron obtener los hijos del padre"}
                    )
                hijos_data = response.json()
                hijo_ids = [h.get("alumno_id") for h in hijos_data.get("hijos", [])]

                if not hijo_ids:
                    return {"notas": [], "total": 0}

                # Obtener matrículas de los hijos
                matriculas_ids = []
                for hijo_id in hijo_ids:
                    mat_response = await client.get(
                        f"{settings.PERSONAS_SERVICE_URL}/v1/matriculas?alumno_id={hijo_id}&limit=100",
                        headers={"Authorization": f"Bearer {token}"}
                    )
                    _log_http_response("list_notas.padre.get_matriculas_hijo", mat_response, f"{settings.PERSONAS_SERVICE_URL}/v1/matriculas?alumno_id={hijo_id}&limit=100")
                    if mat_response.status_code == 200:
                        mats = mat_response.json().get("matriculas", [])
                        matriculas_ids.extend([m["id"] for m in mats])

                if not matriculas_ids:
                    return {"notas": [], "total": 0}

                query = query.filter(NotaModel.matricula_clase_id.in_(matriculas_ids))
        
        # DOCENTE: Solo puede ver notas de sus clases asignadas
        elif rol == "DOCENTE":
            # Obtener clases del docente
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.ACADEMICO_SERVICE_URL}/v1/docente/clases?limit=100",
                    headers={"Authorization": f"Bearer {token}"}
                )
                _log_http_response("list_notas.docente.get_clases", response, f"{settings.ACADEMICO_SERVICE_URL}/v1/docente/clases?limit=100")
                if response.status_code != 200:
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={"error": "Forbidden", "message": "No se pudieron obtener las clases del docente"}
                    )
                clases_data = response.json()
                clase_ids = [c["id"] for c in clases_data.get("clases", [])]
                
                if not clase_ids:
                    return {"notas": [], "total": 0}
                
                # Obtener matrículas de esas clases
                matriculas_ids = []
                for cid in clase_ids:
                    mat_response = await client.get(
                        f"{settings.PERSONAS_SERVICE_URL}/v1/matriculas?clase_id={cid}&limit=100",
                        headers={"Authorization": f"Bearer {token}"}
                    )
                    _log_http_response("list_notas.docente.get_matriculas_clase", mat_response, f"{settings.PERSONAS_SERVICE_URL}/v1/matriculas?clase_id={cid}&limit=100")
                    if mat_response.status_code == 200:
                        mats = mat_response.json().get("matriculas", [])
                        matriculas_ids.extend([m["id"] for m in mats])
                
                if not matriculas_ids:
                    return {"notas": [], "total": 0}
                
                query = query.filter(NotaModel.matricula_clase_id.in_(matriculas_ids))
        
        # ADMIN: Puede ver todas las notas (no se aplica filtro adicional)
        
        # Aplicar filtros adicionales
        if periodo_id:
            query = query.filter(NotaModel.periodo_id == periodo_id)
        if tipo_evaluacion_id:
            query = query.filter(NotaModel.tipo_evaluacion_id == tipo_evaluacion_id)
        if clase_id and rol == "ADMIN":  # Solo ADMIN puede filtrar por clase específica directamente
            async with httpx.AsyncClient() as client:
                mat_response = await client.get(
                    f"{settings.PERSONAS_SERVICE_URL}/v1/matriculas?clase_id={clase_id}&limit=100",
                    headers={"Authorization": f"Bearer {token}"}
                )
                _log_http_response("list_notas.admin.get_matriculas_clase", mat_response, f"{settings.PERSONAS_SERVICE_URL}/v1/matriculas?clase_id={clase_id}&limit=100")
                if mat_response.status_code == 200:
                    mats = mat_response.json().get("matriculas", [])
                    mat_ids = [m["id"] for m in mats]
                    if mat_ids:
                        query = query.filter(NotaModel.matricula_clase_id.in_(mat_ids))
        if alumno_id and rol in ["ADMIN", "DOCENTE"]:  # DOCENTE puede filtrar por alumno si está en sus clases
            async with httpx.AsyncClient() as client:
                mat_response = await client.get(
                    f"{settings.PERSONAS_SERVICE_URL}/v1/matriculas?alumno_id={alumno_id}&limit=100",
                    headers={"Authorization": f"Bearer {token}"}
                )
                _log_http_response("list_notas.filter.alumno.get_matriculas", mat_response, f"{settings.PERSONAS_SERVICE_URL}/v1/matriculas?alumno_id={alumno_id}&limit=100")
                if mat_response.status_code == 200:
                    mats = mat_response.json().get("matriculas", [])
                    mat_ids = [m["id"] for m in mats]
                    if mat_ids:
                        query = query.filter(NotaModel.matricula_clase_id.in_(mat_ids))
        
        # Paginación
        total = query.count()
        models = query.order_by(NotaModel.created_at.desc()).offset(offset).limit(limit).all()
        
        from app.infrastructure.db.repositories import nota_model_to_domain
        notas = [nota_model_to_domain(m) for m in models]

        # Enriquecer las notas con clase_id y curso_id consultando Personas/Académico
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                # Map matricula_id -> {clase_id, alumno_id}
                matricula_map = {}
                for n in notas:
                    mid = n.matricula_clase_id
                    if mid in matricula_map:
                        continue
                    try:
                        resp = await client.get(f"{settings.PERSONAS_SERVICE_URL}/v1/matriculas/{mid}", headers={"Authorization": f"Bearer {token}"})
                        _log_http_response("list_notas.get_matricula", resp, f"{settings.PERSONAS_SERVICE_URL}/v1/matriculas/{mid}")
                        if resp.status_code == 200:
                            mdata = resp.json()
                            matricula_map[mid] = {
                                "clase_id": mdata.get("clase_id"),
                                "alumno_id": mdata.get("alumno_id")
                            }
                        else:
                            matricula_map[mid] = {"clase_id": None, "alumno_id": None}
                    except Exception:
                        matricula_map[mid] = {"clase_id": None, "alumno_id": None}

                # Map clase_id -> curso_id
                clase_map = {}
                clase_ids = set([v.get("clase_id") for v in matricula_map.values() if v.get("clase_id")])
                for cid in clase_ids:
                    try:
                        resp = await client.get(f"{settings.ACADEMICO_SERVICE_URL}/v1/clases/{cid}", headers={"Authorization": f"Bearer {token}"})
                        _log_http_response("list_notas.get_clase", resp, f"{settings.ACADEMICO_SERVICE_URL}/v1/clases/{cid}")
                        if resp.status_code == 200:
                            cdata = resp.json()
                            clase_map[cid] = cdata.get("curso_id")
                        else:
                            clase_map[cid] = None
                    except Exception:
                        clase_map[cid] = None

        except Exception as e:
            # No bloquear la respuesta si falla el enriquecimiento; devolver sin curso/clase
            print(f"[DEBUG NOTAS] Enriquecimiento notas falló: {e}")

        notas_out = []
        for n in notas:
            clase_id = None
            curso_id = None
            try:
                mm = matricula_map.get(n.matricula_clase_id) if 'matricula_map' in locals() else None
                if mm:
                    clase_id = mm.get('clase_id')
                    curso_id = clase_map.get(clase_id) if clase_id and 'clase_map' in locals() else None
            except Exception:
                pass

            notas_out.append({
                "id": n.id,
                "matricula_clase_id": n.matricula_clase_id,
                "clase_id": clase_id,
                "curso_id": curso_id,
                "tipo_evaluacion_id": n.tipo_evaluacion_id,
                "periodo_id": n.periodo_id,
                "escala_id": n.escala_id,
                "fecha_registro": n.fecha_registro.isoformat() if n.fecha_registro else None,
                "registrado_por_user_id": n.registrado_por_user_id,
                "valor_literal": n.valor_literal,
                "valor_numerico": n.valor_numerico,
                "peso": n.peso,
                "observaciones": n.observaciones,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            })

        return {"notas": notas_out, "total": total}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "InternalError", "message": str(e)}
        )


@router.get("/notas/export")
async def export_notas_csv(
    grado_id: Optional[str] = Query(None),
    seccion_id: Optional[str] = Query(None),
    curso_id: Optional[str] = Query(None),
    periodo_id: Optional[str] = Query(None),
    format: str = Query('csv', regex='^(csv|xlsx)$'),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    settings = Depends(get_settings),
):
    """Exportar notas como CSV o XLSX - consulta optimizada con JOINs y streaming.
    - DOCENTE solo exporta sus clases (filtrado por clases.docente_user_id)
    - ADMIN puede exportar todo o filtrar por grado/seccion/curso/periodo
    - Query param `format` acepta 'csv' (default) or 'xlsx'
    """
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        user_id, rol = _extract_user_and_role(payload)

        from sqlalchemy import text

        # Base SQL con joins para enriquecer en una sola consulta
        sql = """
        SELECT
            g.id AS grado_id, g.nombre AS grado_nombre,
            s.id AS seccion_id, s.nombre AS seccion_nombre,
            a.id AS alumno_id, a.nombres AS alumno_nombres, a.apellido_paterno AS alumno_apellidos, a.numero_documento,
            c.id AS curso_id, c.nombre AS curso_nombre,
            cl.id AS clase_id,
            n.matricula_clase_id, n.columna_nota, n.valor_numerico, n.valor_literal, n.periodo_id, n.created_at
        FROM sga_notas.notas n
        JOIN sga_personas.matriculas_clase m ON n.matricula_clase_id = m.id
        JOIN sga_personas.alumnos a ON m.alumno_id = a.id
        JOIN sga_academico.clases cl ON m.clase_id = cl.id
        JOIN sga_academico.cursos c ON cl.curso_id = c.id
        JOIN sga_academico.secciones s ON cl.seccion_id = s.id
        JOIN sga_academico.grados g ON s.grado_id = g.id
        WHERE n.is_deleted = FALSE
        """

        params = {}

        # Rol-based restriction: si es DOCENTE, filtrar por su user_id en clases
        if rol == 'DOCENTE':
            sql += " AND cl.docente_user_id = :docente_user_id"
            params['docente_user_id'] = user_id

        # Aplicar filtros opcionales
        if grado_id:
            sql += " AND g.id = :grado_id"
            params['grado_id'] = grado_id
        if seccion_id:
            sql += " AND s.id = :seccion_id"
            params['seccion_id'] = seccion_id
        if curso_id:
            sql += " AND c.id = :curso_id"
            params['curso_id'] = curso_id
        if periodo_id:
            sql += " AND n.periodo_id = :periodo_id"
            params['periodo_id'] = periodo_id

        sql += " ORDER BY g.nombre, s.nombre, a.apellido_paterno, a.nombres, c.nombre, n.created_at"

        # Ejecutar la consulta en modo streaming
        conn = db.connection().execution_options(stream_results=True)
        result = conn.execute(text(sql), params)

        from fastapi.responses import StreamingResponse
        import csv
        import io

        # CSV export (default)
        if format == 'csv':
            def row_generator():
                # Cabecera
                header = ['grado_id','grado_nombre','seccion_id','seccion_nombre','alumno_id','alumno_apellidos','alumno_nombres','numero_documento','curso_id','curso_nombre','clase_id','matricula_clase_id','columna_nota','valor_numerico','valor_literal','periodo_id','created_at']
                output = io.StringIO()
                writer = csv.writer(output)
                writer.writerow(header)
                yield output.getvalue()
                output.seek(0)
                output.truncate(0)

                for row in result:
                    try:
                        writer.writerow([row['grado_id'], row['grado_nombre'], row['seccion_id'], row['seccion_nombre'], row['alumno_id'], row['alumno_apellidos'], row['alumno_nombres'], row['numero_documento'], row['curso_id'], row['curso_nombre'], row['clase_id'], row['matricula_clase_id'], row['columna_nota'], row['valor_numerico'], row['valor_literal'], row['periodo_id'], row['created_at'].isoformat() if row['created_at'] else ''])
                        yield output.getvalue()
                        output.seek(0)
                        output.truncate(0)
                    except Exception:
                        # no bloquear por fila con problema
                        continue

            filename = f"notas_export_{rol.lower()}_{(grado_id or 'all')}.csv"
            headers = {"Content-Disposition": f"attachment; filename=\"{filename}\""}
            return StreamingResponse(row_generator(), media_type='text/csv', headers=headers)

        # XLSX export using openpyxl
        else:
            try:
                from openpyxl import Workbook
            except Exception:
                return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"error": "MissingDependency", "message": "openpyxl is required for xlsx export"})

            wb = Workbook(write_only=True)
            ws = wb.create_sheet()
            header = ['grado_id','grado_nombre','seccion_id','seccion_nombre','alumno_id','alumno_apellidos','alumno_nombres','numero_documento','curso_id','curso_nombre','clase_id','matricula_clase_id','columna_nota','valor_numerico','valor_literal','periodo_id','created_at']
            ws.append(header)

            for row in result:
                try:
                    ws.append([row['grado_id'], row['grado_nombre'], row['seccion_id'], row['seccion_nombre'], row['alumno_id'], row['alumno_apellidos'], row['alumno_nombres'], row['numero_documento'], row['curso_id'], row['curso_nombre'], row['clase_id'], row['matricula_clase_id'], row['columna_nota'], row['valor_numerico'], row['valor_literal'], row['periodo_id'], row['created_at'].isoformat() if row['created_at'] else ''])
                except Exception:
                    continue

            bio = io.BytesIO()
            wb.save(bio)
            bio.seek(0)

            filename = f"notas_export_{rol.lower()}_{(grado_id or 'all')}.xlsx"
            headers = {"Content-Disposition": f"attachment; filename=\"{filename}\""}
            return StreamingResponse(iter([bio.getvalue()]), media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers=headers)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"error": "INTERNAL_ERROR", "message": str(e)})


@router.get("/alertas")
async def list_alertas(
    padre_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        user_id = payload.get("user_id")

        # Si es PADRE, forzamos a ver solo sus alertas
        if rol == "PADRE":
            # Aquí idealmente buscaríamos el ID de padre asociado al usuario, 
            # por simplicidad asumimos que el user_id es el padre_id o se pasa por query validado
            # En un sistema real, consultaríamos Personas Service para mapear User -> Padre
            target_padre_id = padre_id or user_id 
        else:
            target_padre_id = padre_id

        from app.infrastructure.db.repositories import SqlAlchemyAlertaRepository
        repo = SqlAlchemyAlertaRepository(db)
        
        if target_padre_id:
            alertas = repo.find_by_padre(target_padre_id)
        else:
            # Admin ve todo (no implementado find_all en repo, retornamos vacio por seguridad)
            alertas = []

        return {
            "alertas": [
                {
                    "id": a.id,
                    "tipo": a.tipo_alerta,
                    "mensaje": a.mensaje,
                    "fecha": a.created_at,
                    "leida": a.leida
                } for a in alertas
            ]
        }
    except Exception as e:
         return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "InternalError", "message": str(e)}
        )


@router.get("/dashboard/admin")
async def dashboard_admin(
    db: Session = Depends(get_db),
    settings = Depends(get_settings),
):
    """Métricas agregadas para el dashboard de ADMIN.
    - conteo en tercios/quintos/décimos (top por nota)
    - cursos con mayor promedio
    - alumnos con promedios más bajos
    - porcentaje por género
    """
    try:
        from sqlalchemy import text, bindparam

        # 1) Top tercio/quinto/décimo
        q_rank = text("""
        WITH ranked AS (
            SELECT n.id, n.valor_numerico, m.alumno_id,
                ROW_NUMBER() OVER (ORDER BY n.valor_numerico DESC) AS rn,
                COUNT(*) OVER () AS total
            FROM sga_notas.notas n
            JOIN sga_personas.matriculas_clase m ON n.matricula_clase_id = m.id
            WHERE n.is_deleted = FALSE AND n.valor_numerico IS NOT NULL
        )
        SELECT
            COALESCE(SUM(CASE WHEN rn <= FLOOR(total/3) THEN 1 ELSE 0 END),0) AS tercio_top_count,
            COALESCE(SUM(CASE WHEN rn <= FLOOR(total/5) THEN 1 ELSE 0 END),0) AS quinto_top_count,
            COALESCE(SUM(CASE WHEN rn <= FLOOR(total/10) THEN 1 ELSE 0 END),0) AS decimo_top_count,
            COALESCE(MAX(total),0) AS total_count
        FROM ranked;
        """)

        r = db.execute(q_rank).fetchone()
        tercio = int(r[0] or 0)
        quinto = int(r[1] or 0)
        decimo = int(r[2] or 0)
        total_notes = int(r[3] or 0)

        # 2) Cursos con promedio más alto (con manejo de errores)
        try:
            q_courses = text("""
                SELECT c.id AS curso_id, c.nombre AS curso_nombre, AVG(n.valor_numerico) AS avg_grade, COUNT(*) AS cnt
                FROM sga_notas.notas n
                JOIN sga_personas.matriculas_clase m ON n.matricula_clase_id = m.id
                JOIN sga_academico.clases cl ON m.clase_id = cl.id
                JOIN sga_academico.cursos c ON cl.curso_id = c.id
                WHERE n.is_deleted = FALSE AND n.valor_numerico IS NOT NULL
                GROUP BY c.id, c.nombre
                ORDER BY avg_grade DESC
                LIMIT 5;
                """)
            courses = []
            for row in db.execute(q_courses).fetchall():
                try:
                    courses.append(dict(row._mapping))
                except Exception:
                    try:
                        courses.append(dict(row))
                    except Exception:
                        # best-effort: convert to tuple values with numbered keys
                        courses.append({f"col_{i}": v for i, v in enumerate(row)})
        except Exception as e:
            print("[DEBUG DASHBOARD ADMIN] courses query failed:", e)
            courses = []

        # 3) Alumnos con notas más bajas (promedio) (con manejo de errores)
        try:
            q_low_students = text("""
                SELECT a.id AS alumno_id, CONCAT(a.nombres, ' ', a.apellido_paterno) AS nombre, AVG(n.valor_numerico) AS avg_grade
                FROM sga_notas.notas n
                JOIN sga_personas.matriculas_clase m ON n.matricula_clase_id = m.id
                JOIN sga_personas.alumnos a ON m.alumno_id = a.id
                WHERE n.is_deleted = FALSE AND n.valor_numerico IS NOT NULL AND a.is_deleted = FALSE
                GROUP BY a.id, a.nombres, a.apellido_paterno
                ORDER BY avg_grade ASC
                LIMIT 10;
                """)
            low_students = []
            for row in db.execute(q_low_students).fetchall():
                try:
                    low_students.append(dict(row._mapping))
                except Exception:
                    try:
                        low_students.append(dict(row))
                    except Exception:
                        low_students.append({f"col_{i}": v for i, v in enumerate(row)})
        except Exception as e:
            print("[DEBUG DASHBOARD ADMIN] low_students query failed:", e)
            low_students = []

        # 4) Porcentaje por género (con manejo de errores)
        try:
            q_gender = text("""
                SELECT
                    SUM(CASE WHEN a.genero = 'M' THEN 1 ELSE 0 END) AS male,
                    SUM(CASE WHEN a.genero = 'F' THEN 1 ELSE 0 END) AS female,
                    SUM(CASE WHEN a.genero NOT IN ('M','F') THEN 1 ELSE 0 END) AS other,
                    COUNT(*) AS total
                FROM sga_personas.alumnos a
                WHERE a.is_deleted = FALSE;
                """)
            g = db.execute(q_gender).fetchone()
            male = int(g[0] or 0)
            female = int(g[1] or 0)
            other = int(g[2] or 0)
            total_students = int(g[3] or 0)
            gender_pct = {
                "male_pct": round((male/total_students*100) if total_students>0 else 0,2),
                "female_pct": round((female/total_students*100) if total_students>0 else 0,2),
                "other_pct": round((other/total_students*100) if total_students>0 else 0,2),
                "total_students": total_students
            }
        except Exception as e:
            print("[DEBUG DASHBOARD ADMIN] gender query failed:", e)
            gender_pct = {"male_pct":0,"female_pct":0,"other_pct":0,"total_students":0}

        return {
            "tercio_top_count": tercio,
            "quinto_top_count": quinto,
            "decimo_top_count": decimo,
            "total_notes": total_notes,
            "top_courses": courses,
            "low_students": low_students,
            "gender": gender_pct
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"error":"INTERNAL_ERROR","message":str(e)})


@router.get("/dashboard/docente")
async def dashboard_docente(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    settings = Depends(get_settings),
):
    """Métricas del dashboard para DOCENTE (limitadas a sus clases)."""
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        user_id = payload.get('user_id') or payload.get('sub')

        from sqlalchemy import text, bindparam

        # Obtener clases del docente
        q_clases = text("SELECT id FROM sga_academico.clases WHERE docente_user_id = :user_id AND is_deleted = FALSE")
        clase_rows = db.execute(q_clases, {"user_id": user_id}).fetchall()
        clase_ids = [r[0] for r in clase_rows]
        if not clase_ids:
            return {"message": "No hay clases asignadas", "top_courses": [], "low_students": [], "gender": {}}

        # Filtrar notas por clases del docente (mediante matriculas)
        q_rank = text(f"""
        WITH ranked AS (
            SELECT n.id, n.valor_numerico, m.alumno_id,
                ROW_NUMBER() OVER (ORDER BY n.valor_numerico DESC) AS rn,
                COUNT(*) OVER () AS total
            FROM sga_notas.notas n
            JOIN sga_personas.matriculas_clase m ON n.matricula_clase_id = m.id
            JOIN sga_academico.clases cl ON m.clase_id = cl.id
            WHERE n.is_deleted = FALSE AND n.valor_numerico IS NOT NULL AND cl.id IN :clase_ids
        )
        SELECT
            COALESCE(SUM(CASE WHEN rn <= FLOOR(total/3) THEN 1 ELSE 0 END),0) AS tercio_top_count,
            COALESCE(SUM(CASE WHEN rn <= FLOOR(total/5) THEN 1 ELSE 0 END),0) AS quinto_top_count,
            COALESCE(SUM(CASE WHEN rn <= FLOOR(total/10) THEN 1 ELSE 0 END),0) AS decimo_top_count,
            COALESCE(MAX(total),0) AS total_count
        FROM ranked;
        """)
        q_rank = q_rank.bindparams(bindparam('clase_ids', expanding=True))
        r = db.execute(q_rank, {"clase_ids": clase_ids}).fetchone()
        tercio = int(r[0] or 0)
        quinto = int(r[1] or 0)
        decimo = int(r[2] or 0)

        # Top cursos (por promedio) dentro de sus clases
        q_courses = text(f"""
        SELECT c.id AS curso_id, c.nombre AS curso_nombre, AVG(n.valor_numerico) AS avg_grade
        FROM sga_notas.notas n
        JOIN sga_personas.matriculas_clase m ON n.matricula_clase_id = m.id
        JOIN sga_academico.clases cl ON m.clase_id = cl.id
        JOIN sga_academico.cursos c ON cl.curso_id = c.id
        WHERE n.is_deleted = FALSE AND n.valor_numerico IS NOT NULL AND cl.id IN :clase_ids
        GROUP BY c.id, c.nombre
        ORDER BY avg_grade DESC
        LIMIT 5;
        """)
        q_courses = q_courses.bindparams(bindparam('clase_ids', expanding=True))
        courses = []
        for row in db.execute(q_courses, {"clase_ids": clase_ids}).fetchall():
            try:
                courses.append(dict(row._mapping))
            except Exception:
                try:
                    courses.append(dict(row))
                except Exception:
                    courses.append({f"col_{i}": v for i, v in enumerate(row)})

        # Alumnos con peores promedios dentro de sus clases
        q_low_students = text(f"""
        SELECT a.id AS alumno_id, CONCAT(a.nombres, ' ', a.apellido_paterno) AS nombre, AVG(n.valor_numerico) AS avg_grade
        FROM sga_notas.notas n
        JOIN sga_personas.matriculas_clase m ON n.matricula_clase_id = m.id
        JOIN sga_personas.alumnos a ON m.alumno_id = a.id
        JOIN sga_academico.clases cl ON m.clase_id = cl.id
        WHERE n.is_deleted = FALSE AND n.valor_numerico IS NOT NULL AND cl.id IN :clase_ids
        GROUP BY a.id, a.nombres, a.apellido_paterno
        ORDER BY avg_grade ASC
        LIMIT 10;
        """)
        q_low_students = q_low_students.bindparams(bindparam('clase_ids', expanding=True))
        low_students = []
        for row in db.execute(q_low_students, {"clase_ids": clase_ids}).fetchall():
            try:
                low_students.append(dict(row._mapping))
            except Exception:
                try:
                    low_students.append(dict(row))
                except Exception:
                    low_students.append({f"col_{i}": v for i, v in enumerate(row)})

        # Género entre sus alumnos
        q_gender = text(f"""
        SELECT
            SUM(CASE WHEN a.genero = 'M' THEN 1 ELSE 0 END) AS male,
            SUM(CASE WHEN a.genero = 'F' THEN 1 ELSE 0 END) AS female,
            SUM(CASE WHEN a.genero NOT IN ('M','F') THEN 1 ELSE 0 END) AS other,
            COUNT(DISTINCT a.id) AS total
        FROM sga_personas.alumnos a
        JOIN sga_personas.matriculas_clase m ON a.id = m.alumno_id
        WHERE m.clase_id IN :clase_ids AND a.is_deleted = FALSE;
        """)
        q_gender = q_gender.bindparams(bindparam('clase_ids', expanding=True))
        g = db.execute(q_gender, {"clase_ids": clase_ids}).fetchone()
        male = int(g[0] or 0); female = int(g[1] or 0); other = int(g[2] or 0); total_students = int(g[3] or 0)
        gender_pct = {
            "male_pct": round((male/total_students*100) if total_students>0 else 0,2),
            "female_pct": round((female/total_students*100) if total_students>0 else 0,2),
            "other_pct": round((other/total_students*100) if total_students>0 else 0,2),
            "total_students": total_students
        }

        return {
            "tercio_top_count": tercio,
            "quinto_top_count": quinto,
            "decimo_top_count": decimo,
            "top_courses": courses,
            "low_students": low_students,
            "gender": gender_pct
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"error":"INTERNAL_ERROR","message":str(e)})


@router.get("/dashboard/padre")
async def dashboard_padre(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    settings = Depends(get_settings),
):
    """Métricas del dashboard para PADRE: centradas en sus hijos."""
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        user_id = payload.get('user_id') or payload.get('sub')
        import httpx

        # Pedir al servicio de personas los hijos del padre
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{settings.PERSONAS_SERVICE_URL}/v1/relaciones/padre/{user_id}", headers={"Authorization": f"Bearer {token}"})
            if resp.status_code != 200:
                return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"error":"Forbidden","message":"No se pudieron obtener los hijos del padre"})
            hijos = resp.json().get("hijos", [])
            alumno_ids = [h.get("alumno_id") for h in hijos]

        if not alumno_ids:
            return {"message": "No tiene hijos asociados", "top_courses": [], "low_students": [], "gender": {}}

        from sqlalchemy import text

        # Promedios de sus hijos
        q_low_students = text("""
        SELECT a.id AS alumno_id, CONCAT(a.nombres, ' ', a.apellido_paterno) AS nombre, AVG(n.valor_numerico) AS avg_grade
        FROM sga_notas.notas n
        JOIN sga_personas.matriculas_clase m ON n.matricula_clase_id = m.id
        JOIN sga_personas.alumnos a ON m.alumno_id = a.id
        WHERE n.is_deleted = FALSE AND n.valor_numerico IS NOT NULL AND a.id IN :alumno_ids
        GROUP BY a.id, a.nombres, a.apellido_paterno
        ORDER BY avg_grade ASC
        LIMIT 10;
        """)
        q_low_students = q_low_students.bindparams(bindparam('alumno_ids', expanding=True))
        low_students = []
        for row in db.execute(q_low_students, {"alumno_ids": alumno_ids}).fetchall():
            try:
                low_students.append(dict(row._mapping))
            except Exception:
                try:
                    low_students.append(dict(row))
                except Exception:
                    low_students.append({f"col_{i}": v for i, v in enumerate(row)})

        # Género de sus hijos
        q_gender = text("""
        SELECT
            SUM(CASE WHEN a.genero = 'M' THEN 1 ELSE 0 END) AS male,
            SUM(CASE WHEN a.genero = 'F' THEN 1 ELSE 0 END) AS female,
            SUM(CASE WHEN a.genero NOT IN ('M','F') THEN 1 ELSE 0 END) AS other,
            COUNT(*) AS total
        FROM sga_personas.alumnos a
        WHERE a.id IN :alumno_ids AND a.is_deleted = FALSE;
        """)
        q_gender = q_gender.bindparams(bindparam('alumno_ids', expanding=True))
        g = db.execute(q_gender, {"alumno_ids": alumno_ids}).fetchone()
        male = int(g[0] or 0); female = int(g[1] or 0); other = int(g[2] or 0); total_students = int(g[3] or 0)
        gender_pct = {
            "male_pct": round((male/total_students*100) if total_students>0 else 0,2),
            "female_pct": round((female/total_students*100) if total_students>0 else 0,2),
            "other_pct": round((other/total_students*100) if total_students>0 else 0,2),
            "total_children": total_students
        }

        return {"low_students": low_students, "gender": gender_pct}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"error":"INTERNAL_ERROR","message":str(e)})


# ============================================================================
# CRUD TIPOS DE EVALUACIÓN
# ============================================================================

@router.post("/tipos-evaluacion", status_code=status.HTTP_201_CREATED)
async def create_tipo_evaluacion(
    request: CreateTipoEvaluacionRequest,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede crear tipos de evaluación"}
            )
        
        from app.infrastructure.db.models import TipoEvaluacionModel
        import uuid
        
        tipo = TipoEvaluacionModel(
            id=str(uuid.uuid4()),
            codigo=request.codigo,
            nombre=request.nombre,
            peso_default=request.peso_default,
            descripcion=request.descripcion,
            status="ACTIVO"
        )
        
        db.add(tipo)
        db.commit()
        db.refresh(tipo)
        
        return {
            "id": tipo.id,
            "codigo": tipo.codigo,
            "nombre": tipo.nombre,
            "peso_default": tipo.peso_default,
            "status": tipo.status
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.get("/tipos-evaluacion")
async def list_tipos_evaluacion(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    try:
        from app.infrastructure.db.models import TipoEvaluacionModel
        
        query = db.query(TipoEvaluacionModel).filter(TipoEvaluacionModel.status == "ACTIVO")
        total = query.count()
        tipos = query.offset(offset).limit(limit).all()
        
        return {
            "tipos_evaluacion": [
                {
                    "id": t.id,
                    "codigo": t.codigo,
                    "nombre": t.nombre,
                    "peso_default": float(t.peso_default) if t.peso_default else None,
                    "descripcion": t.descripcion,
                    "status": t.status
                } for t in tipos
            ],
            "total": total
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.put("/tipos-evaluacion/{tipo_id}")
async def update_tipo_evaluacion(
    tipo_id: str,
    request: UpdateTipoEvaluacionRequest,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede actualizar tipos de evaluación"}
            )
        
        from app.infrastructure.db.models import TipoEvaluacionModel
        tipo = db.query(TipoEvaluacionModel).filter(TipoEvaluacionModel.id == tipo_id).first()
        
        if not tipo:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Tipo de evaluación no encontrado"}
            )
        
        if request.codigo is not None:
            tipo.codigo = request.codigo
        if request.nombre is not None:
            tipo.nombre = request.nombre
        if request.peso_default is not None:
            tipo.peso_default = request.peso_default
        if request.descripcion is not None:
            tipo.descripcion = request.descripcion
        
        db.commit()
        db.refresh(tipo)
        
        return {
            "id": tipo.id,
            "codigo": tipo.codigo,
            "nombre": tipo.nombre,
            "peso_default": float(tipo.peso_default) if tipo.peso_default else None,
            "status": tipo.status
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.delete("/tipos-evaluacion/{tipo_id}")
async def delete_tipo_evaluacion(
    tipo_id: str,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede eliminar tipos de evaluación"}
            )
        
        from app.infrastructure.db.models import TipoEvaluacionModel
        tipo = db.query(TipoEvaluacionModel).filter(TipoEvaluacionModel.id == tipo_id).first()
        
        if not tipo:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Tipo de evaluación no encontrado"}
            )
        
        tipo.status = "INACTIVO"
        db.commit()
        
        return {"message": "Tipo de evaluación eliminado correctamente", "id": tipo_id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


# ============================================================================
# CRUD ESCALAS DE CALIFICACIÓN
# ============================================================================

@router.post("/escalas", status_code=status.HTTP_201_CREATED)
async def create_escala(
    request: CreateEscalaRequest,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede crear escalas"}
            )
        
        from app.infrastructure.db.models import EscalaCalificacionModel
        import uuid
        
        escala = EscalaCalificacionModel(
            id=str(uuid.uuid4()),
            nombre=request.nombre,
            tipo=request.tipo,
            valor_minimo=request.valor_minimo,
            valor_maximo=request.valor_maximo,
            descripcion=request.descripcion
        )
        
        db.add(escala)
        db.commit()
        db.refresh(escala)
        
        return {
            "id": escala.id,
            "nombre": escala.nombre,
            "tipo": escala.tipo,
            "valor_minimo": float(escala.valor_minimo) if escala.valor_minimo else None,
            "valor_maximo": float(escala.valor_maximo) if escala.valor_maximo else None
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.put("/escalas/{escala_id}")
async def update_escala(
    escala_id: str,
    request: UpdateEscalaRequest,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede actualizar escalas"}
            )
        
        from app.infrastructure.db.models import EscalaCalificacionModel
        escala = db.query(EscalaCalificacionModel).filter(EscalaCalificacionModel.id == escala_id).first()
        
        if not escala:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Escala no encontrada"}
            )
        
        if request.nombre is not None:
            escala.nombre = request.nombre
        if request.tipo is not None:
            escala.tipo = request.tipo
        if request.valor_minimo is not None:
            escala.valor_minimo = request.valor_minimo
        if request.valor_maximo is not None:
            escala.valor_maximo = request.valor_maximo
        if request.descripcion is not None:
            escala.descripcion = request.descripcion
        
        db.commit()
        db.refresh(escala)
        
        return {
            "id": escala.id,
            "nombre": escala.nombre,
            "tipo": escala.tipo,
            "valor_minimo": float(escala.valor_minimo) if escala.valor_minimo else None,
            "valor_maximo": float(escala.valor_maximo) if escala.valor_maximo else None
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.delete("/escalas/{escala_id}")
async def delete_escala(
    escala_id: str,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        
        if rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN puede eliminar escalas"}
            )
        
        from app.infrastructure.db.models import EscalaCalificacionModel
        escala = db.query(EscalaCalificacionModel).filter(EscalaCalificacionModel.id == escala_id).first()
        
        if not escala:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Escala no encontrada"}
            )
        
        escala.is_deleted = True
        db.commit()
        
        return {"message": "Escala eliminada correctamente", "id": escala_id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


# ============================================================================
# UPDATE Y DELETE DE NOTAS
# ============================================================================

@router.put("/notas/{nota_id}")
async def update_nota(
    nota_id: str,
    request: UpdateNotaRequest,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        user_id = payload.get("user_id")
        
        if rol not in ["ADMIN", "DOCENTE"]:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN o DOCENTE pueden editar notas"}
            )
        
        from app.infrastructure.db.models import NotaModel
        nota = db.query(NotaModel).filter(NotaModel.id == nota_id, NotaModel.is_deleted == False).first()
        
        if not nota:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Nota no encontrada"}
            )
        
        # Si es DOCENTE, validar que registró esa nota
        if rol == "DOCENTE" and nota.registrado_por_user_id != user_id:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo puedes editar tus propias notas"}
            )
        
        if request.tipo_evaluacion_id is not None:
            nota.tipo_evaluacion_id = request.tipo_evaluacion_id
        if request.escala_id is not None:
            nota.escala_id = request.escala_id
        if request.valor_literal is not None:
            nota.valor_literal = request.valor_literal
        if request.valor_numerico is not None:
            nota.valor_numerico = request.valor_numerico
        if request.peso is not None:
            nota.peso = request.peso
        if request.observaciones is not None:
            nota.observaciones = request.observaciones
        
        db.commit()
        db.refresh(nota)
        
        response_data = {
            "id": nota.id,
            "matricula_clase_id": nota.matricula_clase_id,
            "tipo_evaluacion_id": nota.tipo_evaluacion_id,
            "periodo_id": nota.periodo_id,
            "escala_id": nota.escala_id,
            "valor_literal": nota.valor_literal,
            "valor_numerico": float(nota.valor_numerico) if nota.valor_numerico else None,
            "peso": float(nota.peso) if nota.peso else None,
            "observaciones": nota.observaciones
        }
        
        # AUDITORÍA
        try:
            AuditHelper.log_action(
                session=db,
                user_id=user_id,
                username=payload.get("sub"),
                rol_nombre=rol,
                accion=AccionAuditoria.UPDATE_NOTA,
                entidad="Nota",
                entidad_id=nota.id,
                descripcion=f"Nota actualizada por {rol}",
                datos_nuevos=request.dict(exclude_unset=True),
                endpoint=f"/v1/notas/{nota_id}",
                metodo_http="PUT",
                exitoso=True,
                codigo_respuesta=200
            )
        except Exception as e:
            print(f"Error auditoria: {e}")
            
        return response_data
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )


@router.delete("/notas/{nota_id}")
async def delete_nota(
    nota_id: str,
    authorization: Optional[str] = Header(None),
    settings = Depends(get_settings),
    db: Session = Depends(get_db),
):
    try:
        token = extract_bearer_token(authorization)
        payload = decode_jwt_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
        rol = payload.get("rol_nombre")
        user_id = payload.get("user_id")
        
        if rol not in ["ADMIN", "DOCENTE"]:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo ADMIN o DOCENTE pueden eliminar notas"}
            )
        
        from app.infrastructure.db.models import NotaModel
        nota = db.query(NotaModel).filter(NotaModel.id == nota_id).first()
        
        if not nota:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "NotFound", "message": "Nota no encontrada"}
            )
        
        # Si es DOCENTE, validar que registró esa nota
        if rol == "DOCENTE" and nota.registrado_por_user_id != user_id:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "message": "Solo puedes eliminar tus propias notas"}
            )
        
        nota.is_deleted = True
        db.commit()
        
        # AUDITORÍA
        try:
            AuditHelper.log_action(
                session=db,
                user_id=user_id,
                username=payload.get("sub"),
                rol_nombre=rol,
                accion=AccionAuditoria.DELETE_NOTA,
                entidad="Nota",
                entidad_id=nota_id,
                descripcion=f"Nota eliminada por {rol}",
                datos_nuevos={"is_deleted": True},
                endpoint=f"/v1/notas/{nota_id}",
                metodo_http="DELETE",
                exitoso=True,
                codigo_respuesta=200
            )
        except Exception as e:
            print(f"Error auditoria: {e}")
        
        return {"message": "Nota eliminada correctamente", "id": nota_id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_ERROR", "message": str(e)}
        )

