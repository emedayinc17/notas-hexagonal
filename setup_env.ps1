# ============================================
# Script para configurar archivos .env
# ============================================

Write-Host "🔧 Configurando archivos .env para todos los servicios..." -ForegroundColor Cyan
Write-Host ""

$services = @(
    "iam-service",
    "academico-service",
    "personas-service",
    "notas-service"
)

foreach ($service in $services) {
    $envExample = "services\$service\.env.example"
    $envFile = "services\$service\.env"
    
    if (Test-Path $envExample) {
        if (Test-Path $envFile) {
            Write-Host "⚠️  $service - .env ya existe" -ForegroundColor Yellow
            $response = Read-Host "   ¿Sobrescribir? (s/N)"
            if ($response -ne "s" -and $response -ne "S") {
                Write-Host "   ⏭️  Saltando..." -ForegroundColor Gray
                continue
            }
        }
        
        Copy-Item $envExample $envFile
        Write-Host "✅ $service - .env creado correctamente" -ForegroundColor Green
    } else {
        Write-Host "❌ $service - .env.example no encontrado" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📝 IMPORTANTE: Revisa y actualiza las contraseñas de base de datos en cada archivo .env" -ForegroundColor Yellow
Write-Host ""
Write-Host "Archivos creados:" -ForegroundColor Cyan
Write-Host "  - services\iam-service\.env" -ForegroundColor Gray
Write-Host "  - services\academico-service\.env" -ForegroundColor Gray
Write-Host "  - services\personas-service\.env" -ForegroundColor Gray
Write-Host "  - services\notas-service\.env" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ Configuración completada. Ahora reinicia los servicios." -ForegroundColor Green
