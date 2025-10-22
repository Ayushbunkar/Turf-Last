# Fetch all SuperAdmin GET endpoints and save JSON responses to scripts/superadmin-responses
# Usage:
#   $env:SUPERADMIN_TOKEN = '<your_jwt_here>'
#   pwsh ./scripts/fetch_superadmin_endpoints.ps1

param(
    [string]$ApiBase = "http://localhost:4500/superadmin",
    [string]$OutDir = "./scripts/superadmin-responses"
)

if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

$endpoints = @(
    'emails/campaigns',
    'emails/templates',
    'emails/analytics',
    'emails/stats',
    'database/stats',
    'database/backups',
    'database/queries',
    'database/performance',
    'revenue/statistics',
    'revenue/chart',
    'revenue/top-turfs',
    'revenue/recent-transactions?limit=100',
    'turfs',
    'turfs/statistics',
    'turfs/statistics/public',
    'bookings',
    'bookings/statistics',
    'turfadmins',
    'turfadmins/statistics',
    'users',
    'users/statistics',
    'users/recent',
    'analytics',
    'dashboard-stats',
    'recent-activities',
    'support/tickets',
    'support/analytics',
    'notifications',
    'profile',
    'settings/system',
    'settings/notifications',
    'settings/security',
    'system/metrics',
    'system/services',
    'system/performance'
)

# Use token from env variable if present
$token = $env:SUPERADMIN_TOKEN
$useAuth = -not [string]::IsNullOrEmpty($token)

foreach ($ep in $endpoints) {
    try {
        $url = "$ApiBase/$ep"
        Write-Host "Fetching: $url"
        $headers = @{
            'Accept' = 'application/json'
        }
        if ($useAuth) { $headers['Authorization'] = "Bearer $token" }

        # Use Invoke-RestMethod to parse JSON automatically
        $resp = Invoke-RestMethod -Uri $url -Method Get -Headers $headers -ErrorAction Stop -TimeoutSec 30

        $safeName = $ep -replace '[\/:?&=]', '_' -replace '__+', '_'
        $outFile = Join-Path $OutDir ("$safeName.json")
        $json = $resp | ConvertTo-Json -Depth 10
        Set-Content -Path $outFile -Value $json -Encoding UTF8
        Write-Host "Saved: $outFile`n"
    } catch {
        Write-Warning "Failed to fetch $ep: $($_.Exception.Message)"
        $errOut = Join-Path $OutDir ("${ep -replace '[\/:?&=]', '_'}_error.txt")
        "$($_.Exception.Message)`n$($_.Exception | Out-String)`n" | Out-File -FilePath $errOut -Encoding utf8
    }
}

Write-Host "Done. Responses saved to: $OutDir"
