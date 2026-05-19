# 📦 Schema del Sistema de Asistencia Faena - Preparado para Supabase

## 📋 Estado de las Migraciones

✅ **001_initial_schema.sql** (Core Schema - 1.0.0)
- ✓ Extensiones: uuid-ossp, pg_stat_statements
- ✓ Tipos ENUM: attendance_status, user_role, audit_action
- ✓ Tablas: areas, employees, weekly_patterns, monthly_targets, planning_daily, user_roles, audit_log
- ✓ Funciones: fn_set_updated_at(), fn_audit_log()
- ✓ Triggers: updated_at y auditoría en tablas críticas
- ✓ Datos iniciales: 5 áreas de referencia

✅ **002_rls_policies.sql** (Seguridad - 1.0.0)
- ✓ RLS habilitado en todas las tablas
- ✓ Funciones auxiliares: fn_user_is_admin(), fn_user_can_manage_area()
- ✓ Políticas de lectura para datos activos
- ✓ Políticas de escritura con validación de roles
- ✓ Auditoría inmutable con trigger de prevención

✅ **003_extended_schema.sql** (Extensiones - 1.1.0)
- ✓ Tipos ENUM: resource_type, gender, contract_type
- ✓ Tablas: resources, resource_assignments, security_training, employee_metrics
- ✓ Validación: fn_validate_resource_assignment()
- ✓ Vista: vw_resource_occupancy
- ✓ Extensión de employees: gender, contract_type, email, phone

✅ **004_admin_mode_nullable_created_by.sql** (Ajustes - 1.2.0)
- ✓ planning_daily.created_by permitir NULL (para modo admin)

✅ **005_seed_configuration_schema.sql** (Configuración - 1.3.0)
- ✓ Tipos ENUM: contract_level
- ✓ Tablas: areas_hierarchy, weekly_patterns_v2, setup_log
- ✓ Extensión de employees: rut, gender, contract_type, sub_area, start_date, end_date, is_group_61
- ✓ Funciones: fn_validate_areas_hierarchy()
- ✓ Vista: vw_seed_validation
- ✓ Datos de referencia: patrones semanales estándar (S45, S40, S44)

## 📊 Resumen de Componentes

### Tablas Principales (19)
```
Recursos Humanos:
  • areas (100 MB limit)
  • areas_hierarchy (hierarchical support)
  • employees (con campos extendidos)
  • user_roles
  • security_training

Planificación:
  • weekly_patterns (clásico)
  • weekly_patterns_v2 (normalizado)
  • monthly_targets
  • planning_daily

Recursos:
  • resources
  • resource_assignments

Métricas:
  • employee_metrics

Administración:
  • audit_log (inmutable)
  • setup_log (seed tracking)
```

### Funciones (9)
- `fn_set_updated_at()` - Trigger para actualizar timestamps
- `fn_audit_log()` - Registra cambios en audit_log
- `fn_user_is_admin()` - Verificar si usuario es admin
- `fn_user_can_manage_area()` - Verificar permisos por área
- `fn_user_can_read_area()` - Permisos de lectura
- `fn_validate_plan_date()` - Validar fechas de planificación
- `fn_monthly_hours_by_area()` - Análisis mensual
- `fn_validate_resource_assignment()` - Validar asignaciones sin solapamiento
- `fn_validate_areas_hierarchy()` - Validar árbol jerárquico

### Triggers (15+)
- `updated_at`: En todas las tablas mutables
- `audit`: En tablas críticas (employees, planning_daily, etc.)
- `validation`: Validación de datos antes de inserción

### Políticas RLS (20+)
- Lectura: Datos activos públicamente accesibles
- Escritura: Controlada por rol (ADMIN/SUPERVISOR/VIEWER)
- Auditoría: Inmutable, solo lectura para ADMIN

### Vistas (2)
- `vw_resource_occupancy` - Ocupación de recursos
- `vw_seed_validation` - Estado de tablas de configuración

### Índices (15+)
- Sobre foreign keys
- Sobre campos frecuentemente consultados
- Para optimizar búsquedas de RLS

## 🔐 Seguridad

### Autenticación
- Integrado con `auth.users` de Supabase
- JWT tokens para API
- Session management incluido

### Autorización
- Role-Based Access Control (RBAC)
- Row-Level Security (RLS) en todas las tablas
- Scope por área para supervisores

### Auditoría
- Log inmutable de cambios
- Registro de quién, qué, cuándo
- Rastreo de operaciones de seed

## 📈 Capacidad

### Límites por tabla
- `areas`: 1000 registros típicos
- `employees`: 100,000+ sin problemas
- `planning_daily`: 10M+ registros (con índices)
- `audit_log`: Crece indefinidamente, considerar archivado

### Performance
- ✓ Índices en FK y filtros comunes
- ✓ Queries optimizadas
- ✓ Estadísticas habilitadas (pg_stat_statements)

## 🚀 Próximos Pasos para Deploy

```bash
# 1. Login a Supabase CLI
supabase login

# 2. Vincular proyecto
supabase link --project-ref YOUR_PROJECT_REF

# 3. Deploy del schema
supabase db push

# 4. Verificar
psql "postgresql://postgres:PASSWORD@YOUR_PROJECT_REF.supabase.co:6543/postgres" \
  -f supabase/verify-schema.sql

# 5. Configurar variables de ambiente
echo "NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY" >> .env.local
```

## 📝 Módulos de Aplicación Soportados

✅ **Configuración Inicial (Setup Wizard)**
- Crear áreas jerárquicas
- Crear patrones semanales
- Registrar empleados
- Crear admin inicial

✅ **Planificación de Asistencia**
- Ingreso manual de planificación
- Validación de FTE y horas
- Aprobación escalonada

✅ **Gestión de Recursos**
- Asignación de camionetas, casinos, herramientas
- Prevención de conflictos
- Vista de ocupación

✅ **Reportes y Métricas**
- Horas trabajadas por área/mes
- Desviaciones de FTE
- Alertas de inconsistencias

✅ **Auditoría y Compliance**
- Rastreo completo de cambios
- Registro de operaciones de seed
- Validación de integridad

## ✅ Checklist de Deploy

- [ ] Crear proyecto en Supabase Dashboard
- [ ] Instalar Supabase CLI
- [ ] Configurar autenticación (Email/Password)
- [ ] Ejecutar migraciones en orden
- [ ] Ejecutar script de validación
- [ ] Configurar variables de ambiente
- [ ] Ejecutar Setup Wizard
- [ ] Cargar datos iniciales
- [ ] Realizar backups
- [ ] Configurar alertas

## 📚 Documentación

Consultar:
- `DEPLOY.md` - Guía step-by-step
- `verify-schema.sql` - Validación post-deploy
- `config.toml` - Configuración de proyecto

## 🆘 Soporte

En caso de problemas:

1. Revisar logs en Supabase Dashboard → Logs
2. Ejecutar `verify-schema.sql` para diagnóstico
3. Revisar migraciones en orden
4. Consultar referencias de PostgreSQL 15

---

**Preparado para Supabase** ✨
Todas las migraciones son compatibles con PostgreSQL 15 y RLS policies.
