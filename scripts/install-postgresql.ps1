param(
    [string]$Version = '17.10-2',
    [string]$SuperUser = 'postgres',
    [string]$SuperPassword = 'postgres',
    [int]$Port = 5432,
    [string]$ServiceName = 'postgresql-x64-17',
    [string]$InstallRoot = 'C:\Program Files\PostgreSQL'
)

$majorVersion = ($Version -split '\.')[0]
$versionRoot = Join-Path $InstallRoot $majorVersion
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if ($service) {
    Write-Host "PostgreSQL service '$ServiceName' already exists."
    $service | Select-Object Status, Name, DisplayName
    exit 0
}

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)

if (-not $isAdmin) {
    $argumentList = @(
        '-ExecutionPolicy', 'Bypass',
        '-File', ('"{0}"' -f $PSCommandPath),
        '-Version', ('"{0}"' -f $Version),
        '-SuperUser', ('"{0}"' -f $SuperUser),
        '-SuperPassword', ('"{0}"' -f $SuperPassword),
        '-Port', $Port,
        '-ServiceName', ('"{0}"' -f $ServiceName),
        '-InstallRoot', ('"{0}"' -f $InstallRoot)
    ) -join ' '

    Write-Host 'Restarting the installer in an elevated PowerShell session...'
    Start-Process -FilePath 'powershell.exe' -Verb RunAs -Wait -ArgumentList $argumentList
    exit $LASTEXITCODE
}

$installer = Join-Path $env:TEMP "postgresql-$Version-windows-x64.exe"
$installerUrl = "https://get.enterprisedb.com/postgresql/postgresql-$Version-windows-x64.exe"

if (-not (Test-Path $installer)) {
    Invoke-WebRequest -Uri $installerUrl -OutFile $installer
}

& $installer `
    --mode unattended `
    --unattendedmodeui minimal `
    --superaccount $SuperUser `
    --superpassword $SuperPassword `
    --servicepassword $SuperPassword `
    --serverport $Port `
    --servicename $ServiceName `
    --prefix $versionRoot `
    --datadir (Join-Path $versionRoot 'data') `
    --disable-components pgAdmin,stackbuilder

if ($LASTEXITCODE -ne 0) {
    throw "PostgreSQL installer failed with exit code $LASTEXITCODE."
}

Get-Service | Where-Object { $_.Name -eq $ServiceName -or $_.DisplayName -match 'PostgreSQL' } |
    Select-Object Status, Name, DisplayName