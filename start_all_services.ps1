# Script para iniciar todos los microservicios del Sistema de Gestión de Notas
# Asegúrate de haber instalado las dependencias en cada servicio antes de ejecutar este script.

Write-Host "🚀 Iniciando Sistema de Gestión de Notas - Arquitectura Hexagonal" -ForegroundColor Cyan
Write-Host "------------------------------------------------------------"

$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Función helper para iniciar servicio
function Start-Service-Window {
    param (
        [string]$Name,
        [int]$Port,
        [string]$Path
    )
    
    $cmd = "
        `$host.UI.RawUI.WindowTitle = '$Name ($Port)';
        Write-Host 'Iniciando $Name...' -ForegroundColor Cyan;
        
        # Activar entorno virtual si existe
        if (Test-Path '$rootPath\Scripts\activate.ps1') {
            . '$rootPath\Scripts\activate.ps1'
            Write-Host 'Entorno virtual activado' -ForegroundColor Green
        }

        `$env:PYTHONPATH = '$rootPath';
        cd '$Path';
        if (Test-Path .env) { Write-Host 'Configuración .env encontrada' -ForegroundColor Green } else { Write-Warning 'Archivo .env no encontrado, usando .env.example'; Copy-Item .env.example .env };
        uvicorn app.main:app --reload --port $Port;
    "
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { $cmd }"
}

# 1. IAM Service (Puerto 8001)
Write-Host "Starting IAM Service (Port 8001)..." -ForegroundColor Green
Start-Service-Window -Name "IAM Service" -Port 8001 -Path "$rootPath\services\iam-service"

# 2. Académico Service (Puerto 8002)
Write-Host "Starting Académico Service (Port 8002)..." -ForegroundColor Green
Start-Service-Window -Name "Académico Service" -Port 8002 -Path "$rootPath\services\academico-service"

# 3. Personas Service (Puerto 8003)
Write-Host "Starting Personas Service (Port 8003)..." -ForegroundColor Green
Start-Service-Window -Name "Personas Service" -Port 8003 -Path "$rootPath\services\personas-service"

# 4. Notas Service (Puerto 8004)
Write-Host "Starting Notas Service (Port 8004)..." -ForegroundColor Green
Start-Service-Window -Name "Notas Service" -Port 8004 -Path "$rootPath\services\notas-service"

Write-Host "------------------------------------------------------------"
Write-Host "✅ Todos los servicios se están iniciando en ventanas separadas." -ForegroundColor Cyan
Write-Host "NOTA: Si ves errores de importación, este script ya configura PYTHONPATH automáticamente." -ForegroundColor Yellow
