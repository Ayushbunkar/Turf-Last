Quick helper scripts to fetch all SuperAdmin endpoints and save responses locally.

PowerShell (recommended on Windows):
- Set your JWT token (if your server requires auth):
  $env:SUPERADMIN_TOKEN = '<your_jwt_here>'
- Run the script:
  pwsh ./scripts/fetch_superadmin_endpoints.ps1

Node (cross-platform):
- Set your JWT token (if required):
  Windows PowerShell: $env:SUPERADMIN_TOKEN = '<jwt>' ; node ./scripts/fetch_superadmin_endpoints.js
  Linux/macOS: SUPERADMIN_TOKEN='<jwt>' node ./scripts/fetch_superadmin_endpoints.js

Outputs are written to ./scripts/superadmin-responses/*.json
