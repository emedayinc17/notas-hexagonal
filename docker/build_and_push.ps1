<#
.SYNOPSIS
  Build and optionally push Docker images for this project to a registry.

USAGE
  .\build_and_push.ps1 -Registry emeday17 -Tag v1.0.0 -Push

Notes:
  - Make sure you are logged in: `docker login` before pushing.
  - Adjust image names/tags as needed.
#>

[CmdletBinding()]
param(
    [string]$Registry = "emeday17",
    [string]$Tag = "latest",
    [switch]$Push = $false
)

function Write-Info($m){ Write-Host "[info] $m" -ForegroundColor Cyan }
function Write-ErrorAndExit($m){ Write-Host "[error] $m" -ForegroundColor Red; exit 1 }

$services = @(
    @{ name = 'frontend'; path = '.'; dockerfile = 'Dockerfile.frontend' },
    @{ name = 'iam'; path = 'services/iam-service'; dockerfile = 'Dockerfile' },
    @{ name = 'academico'; path = 'services/academico-service'; dockerfile = 'Dockerfile' },
    @{ name = 'personas'; path = 'services/personas-service'; dockerfile = 'Dockerfile' },
    @{ name = 'notas'; path = 'services/notas-service'; dockerfile = 'Dockerfile' }
)

foreach ($svc in $services) {
    # Use service name as image name (frontend -> frontend, iam -> iam, etc.)
    $serviceName = $svc['name']
    # Use $() to avoid PowerShell parsing issues with ':' after variable names
    $img = "$Registry/$($serviceName):$($Tag)"
    # Use repo root as build context so Dockerfiles can COPY shared/ and service folders
    $repoRoot = (Get-Location)
    $context = $repoRoot

    if (-not (Test-Path $context)){
        Write-Host "[warn] Context path for $($svc.name) not found: $context" -ForegroundColor Yellow
        continue
    }

    # Dockerfile path should be under the service folder inside the repo root
    $dockerfilePath = Join-Path -Path $repoRoot -ChildPath $svc.path
    $dockerfilePath = Join-Path -Path $dockerfilePath -ChildPath $svc.dockerfile
    if (-not (Test-Path $dockerfilePath)){
        Write-Host "[warn] Dockerfile not found for $($svc.name) at $dockerfilePath" -ForegroundColor Yellow
        # Try default docker build context if no Dockerfile present
        $buildArgs = "-t $img $context"
    } else {
        # Pass the service path as a build-arg so Dockerfile can COPY the correct service files
        $buildArgs = "-f `"$dockerfilePath`" --build-arg SERVICE_DIR=`"$($svc.path)`" -t $img $context"
    }

    Write-Info "Building $($svc.name) -> $img"
    $buildCmd = "docker build $buildArgs"
    Write-Host $buildCmd
    cmd /c $buildCmd
    if ($LASTEXITCODE -ne 0) { Write-ErrorAndExit "Build failed for $serviceName" }

    if ($Push) {
        Write-Info "Pushing $img"
        $pushCmd = "docker push $img"
        Write-Host $pushCmd
        cmd /c $pushCmd
        if ($LASTEXITCODE -ne 0) { Write-ErrorAndExit "Push failed for $img" }
    }
}

Write-Info "All done."
