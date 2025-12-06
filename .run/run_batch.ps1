# Run batch test: activate venv, login to IAM, post batch to Notas and save outputs
Set-StrictMode -Version Latest
Push-Location 'E:\Notas-hexagonal'

# Activate virtualenv if present
if (Test-Path .\Scripts\Activate.ps1) {
    try { & .\Scripts\Activate.ps1 } catch { Write-Output "Failed to run Activate.ps1: $_" }
} elseif (Test-Path .\Scripts\activate) {
    try { & .\Scripts\activate } catch { Write-Output "Failed to run activate: $_" }
} else {
    Write-Output "No activation script found in .\Scripts; continuing without venv activation"
}

# Ensure output folder
New-Item -Path 'E:\Notas-hexagonal\.run' -ItemType Directory -Force | Out-Null

# Login to IAM (use email field expected by IAM)
try {
    $login = Invoke-RestMethod -Method Post -Uri 'http://localhost:8001/v1/auth/login' -ContentType 'application/json' -Body (@{ email='admin@colegio.com'; password='Admin123!' } | ConvertTo-Json) -ErrorAction Stop
    $login | ConvertTo-Json -Depth 5 | Out-File -FilePath 'E:\Notas-hexagonal\.run\login.json' -Encoding utf8
    $login.access_token | Out-File -FilePath 'E:\Notas-hexagonal\.run\token.txt' -Encoding utf8
    Write-Output "LOGIN_OK"
} catch {
    $_ | Out-File -FilePath 'E:\Notas-hexagonal\.run\login_error.txt' -Encoding utf8
    Write-Output "LOGIN_FAILED"
    Pop-Location
    exit 1
}

# Create a sample batch.json with placeholder IDs (edit if you have real IDs)
@'
[
  {
    "matricula_clase_id":"00000000-0000-0000-0000-000000000000",
    "tipo_evaluacion_id":"00000000-0000-0000-0000-000000000000",
    "periodo_id":"00000000-0000-0000-0000-000000000000",
    "escala_id":"00000000-0000-0000-0000-000000000000",
    "valor_numerico":12.5,
    "fecha_registro":"2025-05-01",
    "columna_nota":"N1",
    "observaciones":"prueba desde script"
  }
]
'@ | Out-File -FilePath 'E:\Notas-hexagonal\.run\batch.json' -Encoding utf8

# Execute batch POST
$token = Get-Content 'E:\Notas-hexagonal\.run\token.txt' -Raw
$headers = @{ Authorization = "Bearer $token" }
$batchBody = Get-Content -Raw 'E:\Notas-hexagonal\.run\batch.json'
try {
    $resp = Invoke-RestMethod -Method Post -Uri 'http://localhost:8004/v1/notas/batch' -Headers $headers -ContentType 'application/json' -Body $batchBody -ErrorAction Stop
    $resp | ConvertTo-Json -Depth 5 | Out-File -FilePath 'E:\Notas-hexagonal\.run\batch_response.json' -Encoding utf8
    Write-Output "BATCH_OK"
} catch {
    # Save full error
    $_ | Out-File -FilePath 'E:\Notas-hexagonal\.run\batch_error.txt' -Encoding utf8
    Write-Output "BATCH_FAILED"
    Pop-Location
    exit 2
}

Pop-Location
exit 0
