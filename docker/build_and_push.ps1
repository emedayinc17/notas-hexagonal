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
    [switch]$Push = $true
)

function Write-Info($m){ Write-Host "[info] $m" -ForegroundColor Cyan }
function Write-ErrorAndExit($m){ Write-Host "[error] $m" -ForegroundColor Red; exit 1 }

$services = @(
    @{ name = 'frontend'; path = '.'; dockerfile = 'Dockerfile.frontend'; image = 'sga-frontend' },
    @{ name = 'iam'; path = 'services/iam-service'; dockerfile = 'Dockerfile'; image = 'iam-service' },
    @{ name = 'academico'; path = 'services/academico-service'; dockerfile = 'Dockerfile'; image = 'academico-service' },
    @{ name = 'personas'; path = 'services/personas-service'; dockerfile = 'Dockerfile'; image = 'personas-service' },
    @{ name = 'notas'; path = 'services/notas-service'; dockerfile = 'Dockerfile'; image = 'notas-service' }
)

foreach ($svc in $services) {
    $img = "${Registry}/${($svc.image)}:${Tag}"
    $context = Join-Path -Path (Get-Location) -ChildPath $svc.path

    if (-not (Test-Path $context)){
        Write-Host "[warn] Context path for $($svc.name) not found: $context" -ForegroundColor Yellow
        continue
    }

    $dockerfilePath = Join-Path -Path $context -ChildPath $svc.dockerfile
    if (-not (Test-Path $dockerfilePath)){
        Write-Host "[warn] Dockerfile not found for $($svc.name) at $dockerfilePath" -ForegroundColor Yellow
        # Try default docker build context if no Dockerfile present
        $buildArgs = "-t $img $context"
    } else {
        $buildArgs = "-f `"$dockerfilePath`" -t $img $context"
    }

    Write-Info "Building $($svc.name) -> $img"
    $buildCmd = "docker build $buildArgs"
    Write-Host $buildCmd
    $b = cmd /c $buildCmd
    if ($LASTEXITCODE -ne 0) { Write-ErrorAndExit "Build failed for $($svc.name)" }

    if ($Push) {
        Write-Info "Pushing $img"
        $pushCmd = "docker push $img"
        Write-Host $pushCmd
        $p = cmd /c $pushCmd
        if ($LASTEXITCODE -ne 0) { Write-ErrorAndExit "Push failed for $img" }
    }
}

Write-Info "All done."
