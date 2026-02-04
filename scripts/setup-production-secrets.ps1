# Script to setup Firebase Functions Secrets for Production
Write-Host "Configurando Secretos para CENLAE (Producción)..." -ForegroundColor Cyan

$secrets = @(
    "STRIPE_SECRET_KEY",
    "TILOPAY_API_KEY",
    "TILOPAY_API_USER",
    "TILOPAY_API_PASSWORD",
    "POWERTRANZ_ID",
    "POWERTRANZ_PASSWORD"
)

foreach ($secret in $secrets) {
    Write-Host "------------------------------------------------"
    Write-Host "Configurando: $secret" -ForegroundColor Yellow
    
    # Check if secret exists (optional, but complicates script, just overwrite/set)
    $val = Read-Host "Ingrese el valor para $secret (o presione Enter para saltar si ya existe)"
    
    if (-not [string]::IsNullOrWhiteSpace($val)) {
        # Pipe input to firebase command to avoid history/display issues if possible, 
        # but firebase CLI usually expects interactive or file. 
        # We generally execute: firebase functions:secrets:set KEY
        # But that prompts for input. 
        # We can pipe it: echo VAL | firebase functions:secrets:set KEY
        
        Write-Host "Guardando secreto..."
        $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c echo $val| firebase functions:secrets:set $secret --force" -NoNewWindow -Wait -PassThru
        
        if ($process.ExitCode -eq 0) {
            Write-Host "✅ $secret configurado exitosamente." -ForegroundColor Green
        } else {
            Write-Host "❌ Error configurando $secret." -ForegroundColor Red
        }
    } else {
        Write-Host "Saltando $secret..." -ForegroundColor Gray
    }
}

Write-Host "------------------------------------------------"
Write-Host "Configuración de secretos finalizada." -ForegroundColor Cyan
Write-Host "Ahora puedes ejecutar: firebase deploy --only functions" -ForegroundColor Yellow
