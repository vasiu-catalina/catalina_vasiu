param(
    [string]$ProjectRoot = 'C:\AIHackathon\catalina_vasiu',
    [string]$InstallRoot = 'C:\Program Files\PostgreSQL'
)

function Get-EnvMap {
    param([string]$Path)

    $map = @{}
    Get-Content $Path | ForEach-Object {
        if ([string]::IsNullOrWhiteSpace($_) -or $_.Trim().StartsWith('#')) {
            return
        }

        $parts = $_ -split '=', 2
        if ($parts.Count -eq 2) {
            $map[$parts[0].Trim()] = $parts[1].Trim()
        }
    }

    return $map
}

function Get-PsqlPath {
    param([string]$Root)

    $command = Get-Command psql.exe -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    if (-not (Test-Path $Root)) {
        return $null
    }

    $candidate = Get-ChildItem $Root -Directory -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending |
        ForEach-Object { Join-Path $_.FullName 'bin\psql.exe' } |
        Where-Object { Test-Path $_ } |
        Select-Object -First 1

    return $candidate
}

$envPath = Join-Path $ProjectRoot 'backend/.env'
if (-not (Test-Path $envPath)) {
    throw "Missing backend env file at $envPath"
}

$envMap = Get-EnvMap -Path $envPath
$psqlPath = Get-PsqlPath -Root $InstallRoot

if ([string]::IsNullOrWhiteSpace($psqlPath) -or -not (Test-Path $psqlPath)) {
    throw "psql.exe was not found. Install PostgreSQL first by running .\scripts\install-postgresql.ps1."
}

$env:PGPASSWORD = $envMap['POSTGRES_PASSWORD']

& $psqlPath `
    -U $envMap['POSTGRES_USER'] `
    -h $envMap['POSTGRES_HOST'] `
    -p $envMap['POSTGRES_PORT'] `
    -d postgres `
    -tAc "SELECT 1 FROM pg_database WHERE datname = '$($envMap['POSTGRES_DB'])';" |
    Set-Variable -Name dbExists

if (-not $dbExists -or -not $dbExists.Trim()) {
    & $psqlPath `
        -U $envMap['POSTGRES_USER'] `
        -h $envMap['POSTGRES_HOST'] `
        -p $envMap['POSTGRES_PORT'] `
        -d postgres `
        -c "CREATE DATABASE $($envMap['POSTGRES_DB']);"

    if ($LASTEXITCODE -ne 0) {
        throw 'Failed to create the air_assist database.'
    }
}

Push-Location (Join-Path $ProjectRoot 'backend')
try {
    .\.venv\Scripts\python manage.py migrate
    if ($LASTEXITCODE -ne 0) {
        throw 'Django migrations failed.'
    }
} finally {
    Pop-Location
}