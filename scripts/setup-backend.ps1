#requires -Version 5.1
<#
    Creates the MyApp solution, adds every project, installs the NuGet
    packages and builds. Safe to re-run: `dotnet add package` is idempotent.

    Usage:  powershell -ExecutionPolicy Bypass -File scripts/setup-backend.ps1
#>

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$solutionDir = Join-Path $root 'MyApp'
if (-not (Test-Path $solutionDir)) { throw "Cannot find $solutionDir" }

# Make sure dotnet is discoverable even in a shell that has not picked up the
# installer's PATH update yet.
$dotnet = 'C:\Program Files\dotnet\dotnet.exe'
if (-not (Test-Path $dotnet)) { $dotnet = 'dotnet' }

function Invoke-Dotnet {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    Write-Host "> dotnet $($Args -join ' ')" -ForegroundColor DarkGray
    & $dotnet @Args
    if ($LASTEXITCODE -ne 0) { throw "dotnet $($Args -join ' ') failed with exit code $LASTEXITCODE" }
}

Push-Location $solutionDir
try {
    if (-not (Test-Path 'MyApp.sln')) {
        Invoke-Dotnet new sln -n MyApp
    }

    $projects = @(
        'src/MyApp.Shared/MyApp.Shared.csproj',
        'src/MyApp.Domain/MyApp.Domain.csproj',
        'src/MyApp.Application/MyApp.Application.csproj',
        'src/MyApp.Infrastructure/MyApp.Infrastructure.csproj',
        'src/MyApp.API/MyApp.API.csproj'
    )

    foreach ($project in $projects) {
        $alreadyAdded = Select-String -Path 'MyApp.sln' -SimpleMatch $project -Quiet -ErrorAction SilentlyContinue
        if (-not $alreadyAdded) { Invoke-Dotnet sln add $project }
    }

    # Pinned to the newest .NET 9 compatible release of each package.
    # (Using `dotnet add package` without a version would pick .NET 10 builds.)
    $packages = @{
        'src/MyApp.Application/MyApp.Application.csproj' = @(
            'Microsoft.EntityFrameworkCore:9.0.20',
            'Microsoft.Extensions.DependencyInjection.Abstractions:9.0.20',
            'Microsoft.Extensions.Options:9.0.20'
        )
        'src/MyApp.Infrastructure/MyApp.Infrastructure.csproj' = @(
            'Microsoft.EntityFrameworkCore:9.0.20',
            'Microsoft.EntityFrameworkCore.Design:9.0.20',
            'Pomelo.EntityFrameworkCore.MySql:9.0.0',
            'BCrypt.Net-Next:4.2.1',
            'MailKit:4.18.1',
            'System.IdentityModel.Tokens.Jwt:8.23.0'
        )
        'src/MyApp.API/MyApp.API.csproj' = @(
            'Microsoft.AspNetCore.Authentication.JwtBearer:9.0.20',
            'Microsoft.EntityFrameworkCore.Design:9.0.20',
            'Swashbuckle.AspNetCore:9.0.6'
        )
    }

    foreach ($project in $packages.Keys) {
        foreach ($entry in $packages[$project]) {
            $parts = $entry.Split(':')
            Invoke-Dotnet add $project package $parts[0] --version $parts[1]
        }
    }

    Invoke-Dotnet build MyApp.sln -c Debug

    Write-Host ''
    Write-Host 'Backend setup complete.' -ForegroundColor Green
}
finally {
    Pop-Location
}
