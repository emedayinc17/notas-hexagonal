# IAM Service - Main Application
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from shared.common import get_settings, create_db_engine, create_session_factory
from app.infrastructure.http import dependencies
from app.infrastructure.http.router_public import router as public_router
from app.infrastructure.http.router_admin import router as admin_router


# Configuración
settings = get_settings()
settings.APP_NAME = "IAM Service"
settings.DB_NAME = "sga_iam"

# Debug: Imprimir configuración CORS
print(f"🔧 CORS_ORIGINS type: {type(settings.CORS_ORIGINS)}")
print(f"🔧 CORS_ORIGINS value: {settings.CORS_ORIGINS}")

# Crear engine y session factory
engine = create_db_engine(settings.DATABASE_URL, echo=settings.DEBUG)
session_factory = create_session_factory(engine)
SessionLocal = session_factory  # Exportar para uso en routers

# Inyectar session factory en dependencies
dependencies.set_session_factory(session_factory)

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

# CORS - Configuración explícita
cors_origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["http://localhost:8080"]
print(f"✅ Configurando CORS con orígenes: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(public_router)
app.include_router(admin_router)


@app.get("/")
async def root():
    """Health check"""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
