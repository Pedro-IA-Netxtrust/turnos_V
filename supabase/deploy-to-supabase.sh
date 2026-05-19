#!/usr/bin/env bash

# ============================================================
# Script de Deploy del Schema a Supabase
# Uso: ./deploy-to-supabase.sh
# ============================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Deploy Schema a Supabase - Sistema Asistencia Faena  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================
# Función: Mostrar error y salir
# ============================================================
error() {
  echo -e "${RED}❌ Error: $1${NC}" >&2
  exit 1
}

# ============================================================
# Función: Mostrar éxito
# ============================================================
success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# ============================================================
# Función: Mostrar info
# ============================================================
info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# ============================================================
# Paso 1: Verificar Supabase CLI
# ============================================================
echo -e "${YELLOW}[1/5]${NC} Verificando Supabase CLI..."
if ! command -v supabase &> /dev/null; then
  error "Supabase CLI no está instalado. Instálalo con: npm install -g @supabase/cli"
fi
success "Supabase CLI encontrado"

# ============================================================
# Paso 2: Verificar autenticación
# ============================================================
echo ""
echo -e "${YELLOW}[2/5]${NC} Verificando autenticación..."
if [ ! -f ~/.supabase/config.json ]; then
  info "No estás autenticado. Por favor, ejecuta:"
  echo "  supabase login"
  read -p "¿Ya completaste la autenticación? (s/n): " auth_confirmed
  if [ "$auth_confirmed" != "s" ]; then
    error "Autenticación requerida"
  fi
fi
success "Autenticación verificada"

# ============================================================
# Paso 3: Solicitar Project Ref
# ============================================================
echo ""
echo -e "${YELLOW}[3/5]${NC} Configuración del proyecto..."

# Intentar obtener el project ref del config local
PROJECT_REF=$(grep -oP 'project_ref\s*=\s*"\K[^"]+' supabase/config.toml 2>/dev/null || true)

if [ -z "$PROJECT_REF" ]; then
  read -p "Ingresa tu Project Ref de Supabase: " PROJECT_REF
fi

if [ -z "$PROJECT_REF" ]; then
  error "Project Ref es requerido"
fi

info "Project Ref: $PROJECT_REF"

# Verificar si ya está linkeado
if [ -f .supabase/config.json ]; then
  success "Proyecto ya configurado"
else
  info "Linkeando proyecto..."
  supabase link --project-ref "$PROJECT_REF" || error "No se pudo linkear el proyecto"
  success "Proyecto linkeado"
fi

# ============================================================
# Paso 4: Ejecutar migraciones
# ============================================================
echo ""
echo -e "${YELLOW}[4/5]${NC} Ejecutando migraciones..."
info "Esto aplicará todas las migraciones en orden..."

supabase db push || error "Error en migraciones"
success "Migraciones ejecutadas correctamente"

# ============================================================
# Paso 5: Validar schema
# ============================================================
echo ""
echo -e "${YELLOW}[5/5]${NC} Validando schema..."

# Obtener credenciales
echo ""
read -sp "Ingresa contraseña de postgres: " DB_PASSWORD
echo ""

DB_HOST="${PROJECT_REF}.supabase.co"
DB_USER="postgres"
DB_PORT="6543"
DB_NAME="postgres"

info "Ejecutando validación..."

# Intentar conectar y validar
if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" \
  -c "SELECT COUNT(*) as tablas FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | grep -q '[0-9]'; then
  success "Conexión a base de datos exitosa"
else
  error "No se pudo conectar a la base de datos"
fi

# ============================================================
# Resumen final
# ============================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        ✅ Deploy Completado Exitosamente            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Próximos pasos:"
echo ""
echo "1. Configura variables de ambiente en .env.local:"
echo "   NEXT_PUBLIC_SUPABASE_URL=https://${PROJECT_REF}.supabase.co"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
echo ""
echo "2. Habilita autenticación en Supabase Dashboard:"
echo "   - Authentication → Providers → Email/Password"
echo ""
echo "3. Ejecuta el Setup Wizard:"
echo "   npm run dev"
echo "   Navega a http://localhost:3000/setup"
echo ""
echo "4. Completa la configuración inicial:"
echo "   - Crear áreas"
echo "   - Crear patrones semanales"
echo "   - Crear usuario administrador"
echo "   - Registrar empleados"
echo ""
echo -e "${BLUE}Para más detalles, consulta: supabase/DEPLOY.md${NC}"
echo ""

success "¡Todo listo para usar!"
