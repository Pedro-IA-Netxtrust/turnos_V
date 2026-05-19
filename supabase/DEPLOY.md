# 🚀 Deploy Schema a Supabase

Esta guía explica cómo desplegar el esquema de la base de datos a tu proyecto Supabase.

## 📋 Requisitos previos

- Tener una cuenta en [Supabase](https://supabase.com)
- Crear un nuevo proyecto Supabase
- Instalar [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)
- Node.js 16+ y npm instalados

## 🔧 Configuración inicial

### 1. Crear proyecto en Supabase

```bash
# Si aún no tienes un proyecto, crea uno en dashboard.supabase.com
# Anota tu Project URL y Anon Key
```

### 2. Configurar Supabase CLI

```bash
# Login a Supabase
supabase login

# Vincular proyecto local con Supabase Cloud
supabase link --project-ref YOUR_PROJECT_REF

# Autenticar
supabase auth:set-access-token YOUR_ACCESS_TOKEN
```

### 3. Variables de entorno

Crear archivo `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🗄️ Deploy del Schema

### Opción A: Mediante Supabase CLI (Recomendado)

```bash
# Ejecutar todas las migraciones en orden
supabase db push

# Ver estado de migraciones
supabase migration list

# Rollback de última migración (si es necesario)
supabase db reset
```

### Opción B: Mediante SQL directo en Supabase Dashboard

1. Ir a **SQL Editor** en Supabase Dashboard
2. Crear una nueva consulta
3. Copiar y ejecutar el contenido de cada migración en orden:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_extended_schema.sql`
   - `004_admin_mode_nullable_created_by.sql`
   - `005_seed_configuration_schema.sql`

> ⚠️ **Importante**: Ejecutar en orden, ya que hay dependencias entre migraciones.

### Opción C: Usar API REST de Supabase

```bash
# Script de deploy con curl
#!/bin/bash

PROJECT_REF="your-project-ref"
SERVICE_ROLE_KEY="your-service-role-key"

for migration in supabase/migrations/*.sql; do
  echo "Ejecutando: $migration"
  curl -X POST "https://${PROJECT_REF}.supabase.co/rest/v1/rpc/sql" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$(cat $migration | sed 's/"/\\"/g')\"}"
done
```

## ✅ Verificar Deploy

### 1. Verificar tablas creadas

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 2. Verificar RLS está habilitado

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### 3. Validar extensiones

```sql
SELECT extname, extversion 
FROM pg_extension;
```

### 4. Usar vista de validación

```sql
SELECT * FROM vw_seed_validation;
```

## 🔐 Configurar Autenticación

### 1. Habilitar Auth en Supabase

1. Ir a **Authentication** → **Providers**
2. Habilitar los métodos de autenticación deseados:
   - ✅ Email/Password (recomendado para empezar)
   - Google OAuth (opcional)
   - GitHub OAuth (opcional)

### 2. Configurar variables de ambiente

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🌱 Seed Inicial (Configuración de áreas, patrones, admin)

Después del deploy del schema, ejecutar el módulo de Setup Wizard:

```bash
# En la aplicación Next.js
# Navegar a /setup para completar la configuración inicial

# O mediante script de seed
npm run seed:initial
```

El Setup Wizard permitirá:
1. ✅ Crear patrones semanales
2. ✅ Crear estructura de áreas
3. ✅ Crear usuario administrador inicial
4. ✅ Registrar empleados

## 🔄 Migraciones futuras

Para futuras migraciones:

```bash
# Crear nueva migración
supabase migration new nombre_migracion

# Editar: supabase/migrations/TIMESTAMP_nombre_migracion.sql

# Ejecutar
supabase db push
```

## 🐛 Troubleshooting

### Error: "Connection refused"

```bash
# Verificar que estés logueado
supabase auth:set-access-token YOUR_ACCESS_TOKEN

# Verificar project ref
supabase projects list
```

### Error: "Permission denied"

- Usar `SUPABASE_SERVICE_ROLE_KEY` para operaciones administrativas
- No usar `ANON_KEY` para migraciones

### Error: "RLS policy violation"

- Verificar que las políticas RLS estén bien configuradas
- Ver: `002_rls_policies.sql`

### Error: "Relation does not exist"

- Verificar que todas las migraciones se hayan ejecutado en orden
- Ver estado: `supabase migration list`

## 📊 Estructura del Schema

```
📦 Database
├── 🔐 Autenticación
│   └── auth.users (tabla de Supabase)
├── 👥 Recursos humanos
│   ├── areas / areas_hierarchy
│   ├── employees
│   ├── user_roles
│   └── security_training
├── ⏰ Planificación y asistencia
│   ├── weekly_patterns / weekly_patterns_v2
│   ├── monthly_targets
│   └── planning_daily
├── 🚗 Recursos
│   ├── resources
│   └── resource_assignments
├── 📊 Métricas
│   └── employee_metrics
├── 📝 Auditoría
│   └── audit_log / setup_log
└── 🔒 RLS Policies
    └── Seguridad a nivel de fila
```

## 🎯 Próximos pasos

1. ✅ Deploy del schema
2. ✅ Configurar autenticación
3. ✅ Ejecutar Setup Wizard para datos iniciales
4. ✅ Configurar Storage para documentos
5. ✅ Configurar Realtime (si necesario)
6. ✅ Backup automático en dashboard

## 📚 Referencias

- [Docs Supabase](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [CLI Guide](https://supabase.com/docs/guides/cli)

---

**¿Preguntas o problemas?**
Revisar logs en Supabase Dashboard → Logs → Database
