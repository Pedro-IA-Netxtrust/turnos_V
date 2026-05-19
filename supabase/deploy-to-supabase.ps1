# ============================================================
# Script de Deploy del Schema a Supabase (Windows PowerShell)
# Uso: .\deploy-to-supabase.ps1
# ============================================================

$ErrorActionPreference = "Stop"

# Colores
function Write-Success($message) {
  Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Error($message) {
  Write-Host "❌ Error: $message" -ForegroundColor Red
  exit 1
}

function Write-Info($message) {
  Write-Host "ℹ️  $message" -ForegroundColor Cyan
}

function Write-Step($step, $total, $message) {
  Write-Host "[$step/$total] $message" -ForegroundColor Yellow
}

# Header
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║  Deploy Schema a Supabase - Sistema Asistencia Faena  ║" -ForegroundColor Blue
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# ============================================================
# Paso 1: Verificar Supabase CLI
# ============================================================
Write-Step "1" "5" "Verificando Supabase CLI..."
try {
  $supabaseVersion = supabase --version 2>&1
  Write-Success "Supabase CLI encontrado ($supabaseVersion)"
} catch {
  Write-Error "Supabase CLI no está instalado. Instálalo con: npm install -g @supabase/cli"
}

# ============================================================
# Paso 2: Verificar autenticación
# ============================================================
Write-Host ""
Write-Step "2" "5" "Verificando autenticación..."

$configPath = "$env:USERPROFILE\.supabase\config.json"
if (-not (Test-Path $configPath)) {
  Write-Info "No estás autenticado. Por favor, ejecuta:"
  Write-Host "  supabase login"
  Write-Host ""
  $auth = Read-Host "¿Ya completaste la autenticación? (s/n)"
  if ($auth -ne "s") {
    Write-Error "Autenticación requerida"
  }
}
Write-Success "Autenticación verificada"

# ============================================================
# Paso 3: Solicitar Project Ref
# ============================================================
Write-Host ""
Write-Step "3" "5" "Configuración del proyecto..."

$configFile = "supabase\config.toml"
if (Test-Path $configFile) {
  $config = Get-Content $configFile -Raw
  if ($config -match 'project_ref\s*=\s*"([^"]+)"') {
    $PROJECT_REF = $matches[1]
  }
}

if ([string]::IsNullOrEmpty($PROJECT_REF)) {
  $PROJECT_REF = Read-Host "Ingresa tu Project Ref de Supabase"
}

if ([string]::IsNullOrEmpty($PROJECT_REF)) {
  Write-Error "Project Ref es requerido"
}

Write-Info "Project Ref: $PROJECT_REF"

# Verificar si ya está linkeado
$supabaseConfigPath = ".supabase\config.json"
if (-not (Test-Path $supabaseConfigPath)) {
  Write-Info "Linkeando proyecto..."
  try {
    supabase link --project-ref $PROJECT_REF 2>&1 | Out-Null
    Write-Success "Proyecto linkeado"
  } catch {
    Write-Error "No se pudo linkear el proyecto"
  }
} else {
  Write-Success "Proyecto ya configurado"
}

# ============================================================
# Paso 4: Ejecutar migraciones
# ============================================================
Write-Host ""
Write-Step "4" "5" "Ejecutando migraciones..."
Write-Info "Esto aplicará todas las migraciones en orden..."

try {
  $output = supabase db push 2>&1
  Write-Success "Migraciones ejecutadas correctamente"
  Write-Host $output -ForegroundColor Gray
} catch {
  Write-Error "Error en migraciones: $_"
}

# ============================================================
# Paso 5: Información final
# ============================================================
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║        ✅ Deploy Completado Exitosamente            ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "Próximos pasos:" -ForegroundColor White
Write-Host ""
Write-Host "1. Configura variables de ambiente en .env.local:" -ForegroundColor White
Write-Host "   NEXT_PUBLIC_SUPABASE_URL=https://$PROJECT_REF.supabase.co"
Write-Host "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
Write-Host ""

Write-Host "2. Habilita autenticación en Supabase Dashboard:" -ForegroundColor White
Write-Host "   - Authentication → Providers → Email/Password"
Write-Host ""

Write-Host "3. Ejecuta el Setup Wizard:" -ForegroundColor White
Write-Host "   npm run dev"
Write-Host "   Navega a http://localhost:3000/setup"
Write-Host ""

Write-Host "4. Completa la configuración inicial:" -ForegroundColor White
Write-Host "   - Crear áreas"
Write-Host "   - Crear patrones semanales"
Write-Host "   - Crear usuario administrador"
Write-Host "   - Registrar empleados"
Write-Host ""

Write-Info "Para más detalles, consulta: supabase/DEPLOY.md"
Write-Host ""

Write-Success "¡Todo listo para usar!"
