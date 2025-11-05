#!/bin/sh
# Script para verificar si se actualizó Postman después de cambios en endpoints
# Compatible con Docker (sh/bash)
# Uso: npm run postman:check

echo ""
echo "🔍 Verificando cambios en endpoints..."
echo ""

# Buscar archivos de rutas modificados (staged y unstaged)
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null | grep -E "routes/.*\.ts$|controllers/.*\.ts$" || true)
UNSTAGED_FILES=$(git diff --name-only 2>/dev/null | grep -E "routes/.*\.ts$|controllers/.*\.ts$" || true)

# Combinar y obtener archivos únicos
ALL_CHANGED_FILES=$(echo "$STAGED_FILES $UNSTAGED_FILES" | tr ' ' '\n' | sort -u | grep -v '^$')

if [ -n "$ALL_CHANGED_FILES" ]; then
    echo "⚠️  ATENCIÓN: Detectados cambios en endpoints:"
    echo ""
    echo "$ALL_CHANGED_FILES" | while read -r file; do
        [ -n "$file" ] && echo "   📝 $file"
    done
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📮 ¿Actualizaste la collection de Postman?"
    echo ""
    echo "   Proceso recomendado:"
    echo "   1️⃣  Abre Postman"
    echo "   2️⃣  Edita/Agrega los endpoints modificados"
    echo "   3️⃣  Prueba que funcionen correctamente"
    echo "   4️⃣  Click derecho en la collection → Export"
    echo "   5️⃣  Selecciona 'Collection v2.1'"
    echo "   6️⃣  Sobrescribe: SmartBudget.postman_collection.json"
    echo "   7️⃣  Stage el archivo JSON: git add SmartBudget.postman_collection.json"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Verificar si el archivo de collection fue modificado
    POSTMAN_FILE="SmartBudget.postman_collection.json"
    POSTMAN_STAGED=$(git diff --cached --name-only 2>/dev/null | grep "$POSTMAN_FILE" || true)
    POSTMAN_CHANGED=$(git diff --name-only 2>/dev/null | grep "$POSTMAN_FILE" || true)
    
    if [ -n "$POSTMAN_STAGED" ]; then
        echo "✅ Detectado: $POSTMAN_FILE está staged"
        echo "   ¡Perfecto! La collection fue actualizada."
        echo ""
    elif [ -n "$POSTMAN_CHANGED" ]; then
        echo "⚠️  Detectado: $POSTMAN_FILE tiene cambios sin stage"
        echo "   Ejecuta: git add $POSTMAN_FILE"
        echo ""
        echo "❌ RECORDATORIO:"
        echo "   Stage el archivo de Postman antes de continuar"
        echo ""
        exit 1
    else
        echo "❌ RECORDATORIO:"
        echo "   No olvides actualizar la collection de Postman"
        echo "   antes de hacer commit de estos cambios."
        echo ""
        echo "   Esto asegura que el equipo tenga los endpoints actualizados."
        echo ""
        exit 1
    fi
else
    echo "✅ No se detectaron cambios en endpoints"
    echo "   (No es necesario actualizar Postman)"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Verificación completa!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
