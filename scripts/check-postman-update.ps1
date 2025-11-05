# Script para verificar si se actualizó Postman después de cambios en endpoints
# Uso: .\scripts\check-postman-update.ps1

Write-Host ""
Write-Host "🔍 Verificando cambios en endpoints..." -ForegroundColor Cyan
Write-Host ""

# Buscar archivos de rutas modificados (staged y unstaged)
$stagedFiles = git diff --cached --name-only 2>$null | Where-Object { $_ -match "routes/.*\.ts$|controllers/.*\.ts$" }
$unstagedFiles = git diff --name-only 2>$null | Where-Object { $_ -match "routes/.*\.ts$|controllers/.*\.ts$" }

$allChangedFiles = @()
$allChangedFiles += $stagedFiles
$allChangedFiles += $unstagedFiles
$allChangedFiles = $allChangedFiles | Select-Object -Unique

if ($allChangedFiles.Count -gt 0) {
    Write-Host "⚠️  ATENCIÓN: Detectados cambios en endpoints:" -ForegroundColor Yellow
    Write-Host ""
    $allChangedFiles | ForEach-Object { 
        Write-Host "   📝 $_" -ForegroundColor Gray 
    }
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "📮 ¿Actualizaste la collection de Postman?" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Proceso recomendado:" -ForegroundColor White
    Write-Host "   1️⃣  Abre Postman" -ForegroundColor Cyan
    Write-Host "   2️⃣  Edita/Agrega los endpoints modificados" -ForegroundColor Cyan
    Write-Host "   3️⃣  Prueba que funcionen correctamente" -ForegroundColor Cyan
    Write-Host "   4️⃣  Click derecho en la collection → Export" -ForegroundColor Cyan
    Write-Host "   5️⃣  Selecciona 'Collection v2.1'" -ForegroundColor Cyan
    Write-Host "   6️⃣  Sobrescribe: SmartBudget.postman_collection.json" -ForegroundColor Cyan
    Write-Host "   7️⃣  Stage el archivo JSON: git add SmartBudget.postman_collection.json" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    
    # Verificar si el archivo de collection fue modificado
    $postmanFile = "SmartBudget.postman_collection.json"
    $postmanChanged = git diff --name-only 2>$null | Where-Object { $_ -eq $postmanFile }
    $postmanStaged = git diff --cached --name-only 2>$null | Where-Object { $_ -eq $postmanFile }
    
    if ($postmanStaged) {
        Write-Host "✅ Detectado: $postmanFile está staged" -ForegroundColor Green
        Write-Host "   ¡Perfecto! La collection fue actualizada." -ForegroundColor Green
        Write-Host ""
    }
    elseif ($postmanChanged) {
        Write-Host "⚠️  Detectado: $postmanFile tiene cambios sin stage" -ForegroundColor Yellow
        Write-Host "   Ejecuta: git add $postmanFile" -ForegroundColor Yellow
        Write-Host ""
        
        $addFile = Read-Host "¿Quieres agregarlo ahora? (s/n)"
        if ($addFile -eq "s" -or $addFile -eq "S") {
            git add $postmanFile
            Write-Host "✅ Archivo agregado" -ForegroundColor Green
            Write-Host ""
        }
    }
    else {
        Write-Host "❓ Pregunta interactiva:" -ForegroundColor Cyan
        $response = Read-Host "¿Ya actualizaste y exportaste la collection de Postman? (s/n)"
        Write-Host ""
        
        if ($response -ne "s" -and $response -ne "S") {
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
            Write-Host "❌ RECORDATORIO:" -ForegroundColor Red
            Write-Host "   No olvides actualizar la collection de Postman" -ForegroundColor Red
            Write-Host "   antes de hacer commit de estos cambios." -ForegroundColor Red
            Write-Host ""
            Write-Host "   Esto asegura que el equipo tenga los endpoints actualizados." -ForegroundColor Gray
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
            Write-Host ""
            exit 1
        }
        else {
            Write-Host "✅ Perfecto! No olvides exportar y commitear el JSON." -ForegroundColor Green
            Write-Host ""
        }
    }
}
else {
    Write-Host "✅ No se detectaron cambios en endpoints" -ForegroundColor Green
    Write-Host "   (No es necesario actualizar Postman)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "✅ Verificación completa!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
