# Académico Service - Main Application
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from shared.common import get_settings, create_db_engine, create_session_factory
from app.infrastructure.http import dependencies
from app.infrastructure.http.router_admin import router as admin_router
from app.infrastructure.http.router_docente import router as docente_router

settings = get_settings()
settings.APP_NAME = "Académico Service"
settings.DB_NAME = "sga_academico"

# Debug: Imprimir configuración CORS
print(f"🔧 CORS_ORIGINS type: {type(settings.CORS_ORIGINS)}")
print(f"🔧 CORS_ORIGINS value: {settings.CORS_ORIGINS}")

engine = create_db_engine(settings.DATABASE_URL, echo=settings.DEBUG)
session_factory = create_session_factory(engine)
dependencies.set_session_factory(session_factory)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

# CORS - Configuración explícita
cors_origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["http://localhost:8080"]

# En entorno de desarrollo garantizar que las variantes localhost y 127.0.0.1 estén permitidas
if isinstance(cors_origins, list):
    # Si hay un wildcard, dejarlo como tal
    if "*" in cors_origins:
        allow_origins = ["*"]
    else:
        allow_origins = list(dict.fromkeys(cors_origins))  # unique
        # Añadir variantes comunes del host de frontend en desarrollo
        for addition in ["http://localhost:8080", "http://127.0.0.1:8080"]:
            if addition not in allow_origins:
                allow_origins.append(addition)
else:
    allow_origins = ["http://localhost:8080", "http://127.0.0.1:8080"]

print(f"✅ Configurando CORS con orígenes: {allow_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_router)
app.include_router(docente_router)

@app.get("/")
async def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
