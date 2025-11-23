# Script para iniciar el Sistema Completo (Backend + Frontend)
# Sistema de Gestión de Notas - Arquitectura Hexagonal

Write-Host "`n🚀 Iniciando Sistema Completo de Gestión de Notas" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$root = Get-Location
$rootPath = $root.Path

# Función helper para iniciar servicio backend
function Start-Service-Window {
    param (
        [string]$Name,
        [int]$Port,
        [string]$Path
    )
    
    $cmd = "
        `$host.UI.RawUI.WindowTitle = '$Name ($Port)';
        Write-Host '🔧 Iniciando $Name...' -ForegroundColor Cyan;
        
        # Activar entorno virtual si existe
        if (Test-Path '$rootPath\Scripts\activate.ps1') {
            . '$rootPath\Scripts\activate.ps1'
            Write-Host '✓ Entorno virtual activado' -ForegroundColor Green
        }

        `$env:PYTHONPATH = '$rootPath';
        cd '$Path';
        if (Test-Path .env) { 
            Write-Host '✓ Configuración .env encontrada' -ForegroundColor Green 
        } else { 
            Write-Warning 'Archivo .env no encontrado, usando .env.example'; 
            Copy-Item .env.example .env 
        };
        uvicorn app.main:app --reload --port $Port;
    "
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { $cmd }"
}

# ============================================
# BACKEND SERVICES
# ============================================
Write-Host "`n📡 Iniciando Microservicios Backend..." -ForegroundColor Yellow

# 1. IAM Service (Puerto 8001)
Write-Host "  → IAM Service (Puerto 8001)..." -ForegroundColor Green
Start-Service-Window -Name "IAM Service" -Port 8001 -Path "$rootPath\services\iam-service"
Start-Sleep -Seconds 1

# 2. Académico Service (Puerto 8002)
Write-Host "  → Académico Service (Puerto 8002)..." -ForegroundColor Green
Start-Service-Window -Name "Académico Service" -Port 8002 -Path "$rootPath\services\academico-service"
Start-Sleep -Seconds 1

# 3. Personas Service (Puerto 8003)
Write-Host "  → Personas Service (Puerto 8003)..." -ForegroundColor Green
Start-Service-Window -Name "Personas Service" -Port 8003 -Path "$rootPath\services\personas-service"
Start-Sleep -Seconds 1

# 4. Notas Service (Puerto 8004)
Write-Host "  → Notas Service (Puerto 8004)..." -ForegroundColor Green
Start-Service-Window -Name "Notas Service" -Port 8004 -Path "$rootPath\services\notas-service"
Start-Sleep -Seconds 2

# ============================================
# FRONTEND
# ============================================
Write-Host "`n🎨 Iniciando Frontend..." -ForegroundColor Yellow

$frontendCmd = "
    `$host.UI.RawUI.WindowTitle = 'Frontend Web (Puerto 8080)';
    Write-Host '🌐 Iniciando servidor HTTP para Frontend...' -ForegroundColor Cyan;
    cd '$rootPath\frontend';
    Write-Host '✓ Servidor corriendo en http://localhost:8080' -ForegroundColor Green;
    Write-Host '✓ Presiona Ctrl+C para detener' -ForegroundColor Yellow;
    python -m http.server 8080;
"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { $frontendCmd }"
Start-Sleep -Seconds 1

# ============================================
# INFORMACIÓN FINAL
# ============================================
Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "✅ Sistema iniciado exitosamente!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan

Write-Host "`n📡 BACKEND - Microservicios API:" -ForegroundColor Yellow
Write-Host "  • IAM Service:       http://localhost:8001/docs" -ForegroundColor White
Write-Host "  • Académico Service: http://localhost:8002/docs" -ForegroundColor White
Write-Host "  • Personas Service:  http://localhost:8003/docs" -ForegroundColor White
Write-Host "  • Notas Service:     http://localhost:8004/docs" -ForegroundColor White

Write-Host "`n🎨 FRONTEND - Aplicación Web:" -ForegroundColor Yellow
Write-Host "  • URL:               http://localhost:8080" -ForegroundColor White
Write-Host "  • Login:             http://localhost:8080/index.html" -ForegroundColor White

Write-Host "`n👤 USUARIOS DE PRUEBA:" -ForegroundColor Yellow
Write-Host "  • Admin:   admin@colegio.com / Admin123!" -ForegroundColor Cyan
Write-Host "  • Docente: docente@colegio.com / Docente123!" -ForegroundColor Cyan
Write-Host "  • Padre:   padre@colegio.com / Padre123!" -ForegroundColor Cyan

Write-Host "`n📝 NOTAS:" -ForegroundColor Yellow
Write-Host "  • Todos los servicios se ejecutan en ventanas separadas" -ForegroundColor Gray
Write-Host "  • Cierra cada ventana individualmente para detener cada servicio" -ForegroundColor Gray
Write-Host "  • El frontend se actualiza automáticamente al guardar archivos" -ForegroundColor Gray
Write-Host "  • Revisa la consola de cada servicio para ver logs" -ForegroundColor Gray

Write-Host "`n🔗 ACCESO RÁPIDO:" -ForegroundColor Yellow
Write-Host "  1. Abre tu navegador en: http://localhost:8080" -ForegroundColor White
Write-Host "  2. Usa los botones de 'Acceso Rápido' en la página de login" -ForegroundColor White
Write-Host "  3. Explora el dashboard según tu rol" -ForegroundColor White

Write-Host "`n🎉 ¡Listo para usar!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan

# Abrir navegador automáticamente (opcional)
Write-Host "`n¿Abrir el navegador automáticamente? (S/N): " -ForegroundColor Cyan -NoNewline
$response = Read-Host

if ($response -eq 'S' -or $response -eq 's') {
    Write-Host "Abriendo navegador..." -ForegroundColor Green
    Start-Process "http://localhost:8080"
}

Write-Host "`nPresiona cualquier tecla para cerrar esta ventana..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
