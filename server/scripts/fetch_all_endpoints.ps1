# Simple endpoint checker for server API
# Usage: powershell -File fetch_all_endpoints.ps1 -Token <JWT>
param(
  [Parameter(Mandatory=$false)]
  [string]$Token
)

if (-not $Token) {
  Write-Host "Token not provided. Looking in environment variable TOKEN..."
  $Token = $Env:TOKEN
}

if (-not $Token) {
  Write-Host "No token found. You can pass it via -Token or set env var TOKEN." -ForegroundColor Yellow
}

$base = "http://localhost:4500/api"
$endpoints = @(
  "/superadmin/bookings",
  "/superadmin/analytics",
  "/superadmin/revenue/statistics",
  "/superadmin/turfs",
  "/superadmin/users/statistics",
  "/superadmin/dashboard-stats",
  "/superadmin/revenue/recent-transactions",
  "/analytics/total-bookings",
  "/analytics/total-revenue",
  "/bookings/all"
)

foreach ($ep in $endpoints) {
  $url = "$base$ep"
  Write-Host "GET $url"
  try {
    $headers = @{}
    if ($Token) { $headers = @{ Authorization = "Bearer $Token" } }
    $res = Invoke-RestMethod -Uri $url -Headers $headers -Method Get -ErrorAction Stop
    Write-Host "Status: OK" -ForegroundColor Green
    $json = $res | ConvertTo-Json -Depth 5
    Write-Host $json.Substring(0, [Math]::Min(600, $json.Length))
    Write-Host "\n---\n"
  } catch {
    Write-Host "Failed: $_" -ForegroundColor Red
  }
}
