-- ============================================================
-- VALIDACIÓN POST-DEPLOY
-- Script para verificar que todas las tablas y políticas estén creadas correctamente
-- ============================================================

-- 1. Verificar tablas creadas
SELECT 
  COUNT(*) as tabla_count,
  STRING_AGG(tablename, ', ' ORDER BY tablename) as tables
FROM pg_tables 
WHERE schemaname = 'public';

-- 2. Verificar extensiones
SELECT 
  extname,
  extversion
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pg_stat_statements')
ORDER BY extname;

-- 3. Verificar tipos ENUM
SELECT 
  t.typname,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typnamespace = 'public'::regnamespace
GROUP BY t.typname
ORDER BY t.typname;

-- 4. Verificar RLS habilitado en tablas
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅' ELSE '❌' END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5. Verificar políticas RLS
SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 6. Verificar funciones creadas
SELECT 
  proname,
  pg_get_function_identity_arguments(oid) as arguments,
  CASE WHEN prosecdef THEN 'SECURITY DEFINER' ELSE 'normal' END as security
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname LIKE 'fn_%'
ORDER BY proname;

-- 7. Verificar triggers
SELECT 
  t.tgname,
  c.relname as table_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relnamespace = 'public'::regnamespace
ORDER BY c.relname, t.tgname;

-- 8. Verificar índices
SELECT 
  t.relname as table_name,
  i.relname as index_name,
  a.attname as column_name,
  CASE WHEN ix.indisprimary THEN 'PRIMARY' 
       WHEN ix.indisunique THEN 'UNIQUE'
       ELSE 'INDEX' END as index_type
FROM pg_index ix
JOIN pg_class t ON ix.indrelid = t.oid
JOIN pg_class i ON ix.indexrelid = i.oid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE t.relnamespace = 'public'::regnamespace
ORDER BY t.relname, i.relname;

-- 9. Estado de tablas principales
SELECT
  'areas' as tabla,
  COUNT(*) as registros,
  COUNT(*) FILTER (WHERE is_active = TRUE) as activos
FROM areas
UNION ALL
SELECT 'employees', COUNT(*), COUNT(*) FILTER (WHERE is_active = TRUE) FROM employees
UNION ALL
SELECT 'areas_hierarchy', COUNT(*), COUNT(*) FILTER (WHERE is_active = TRUE) FROM areas_hierarchy
UNION ALL
SELECT 'weekly_patterns', COUNT(*), COUNT(*) FILTER (WHERE is_default = TRUE) FROM weekly_patterns
UNION ALL
SELECT 'weekly_patterns_v2', COUNT(*), COUNT(*) FILTER (WHERE is_active = TRUE) FROM weekly_patterns_v2
UNION ALL
SELECT 'user_roles', COUNT(*), COUNT(*) FROM user_roles
UNION ALL
SELECT 'planning_daily', COUNT(*), COUNT(*) FROM planning_daily;

-- 10. Verificar vista de validación de seed
SELECT * FROM vw_seed_validation;

-- 11. Verificar constraints
SELECT 
  t.tablename,
  c.conname as constraint_name,
  pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class cla ON c.conrelid = cla.oid
JOIN pg_tables t ON cla.relname = t.tablename AND t.schemaname = 'public'
ORDER BY t.tablename, c.conname;

-- 12. Verificar referential integrity (foreign keys)
SELECT 
  t.tablename,
  a.attname as column_name,
  f.relname as foreign_table,
  fa.attname as foreign_column,
  CASE WHEN c.confdeltype = 'c' THEN 'CASCADE'
       WHEN c.confdeltype = 'r' THEN 'RESTRICT'
       WHEN c.confdeltype = 's' THEN 'SET NULL'
       WHEN c.confdeltype = 'd' THEN 'SET DEFAULT'
       ELSE c.confdeltype END as on_delete
FROM pg_constraint c
JOIN pg_class cla ON c.conrelid = cla.oid
JOIN pg_class f ON c.confrelid = f.oid
JOIN pg_attribute a ON a.attrelid = cla.oid AND a.attnum = c.conkey[1]
JOIN pg_attribute fa ON fa.attrelid = f.oid AND fa.attnum = c.confkey[1]
JOIN pg_tables t ON cla.relname = t.tablename AND t.schemaname = 'public'
WHERE c.contype = 'f'
ORDER BY t.tablename;

-- 13. Validar árbol jerárquico de áreas
SELECT * FROM fn_validate_areas_hierarchy();

-- 14. Datos de referencia
SELECT 
  'weekly_patterns_v2' as tabla,
  COUNT(*) as count,
  STRING_AGG(code || ' (' || total_weekly_hours::text || 'h)', ', ') as patterns
FROM weekly_patterns_v2
WHERE is_active = TRUE
GROUP BY 1;

-- 15. Resumen de migración
SELECT 
  'Schema Principal' as componente,
  COUNT(*) as elementos
FROM information_schema.tables
WHERE table_schema = 'public'
UNION ALL
SELECT 'Políticas RLS', COUNT(*) FROM pg_policies WHERE schemaname = 'public'
UNION ALL
SELECT 'Funciones', COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname LIKE 'fn_%'
UNION ALL
SELECT 'Triggers', COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relnamespace = 'public'::regnamespace
UNION ALL
SELECT 'Tipos Enum', COUNT(*) FROM pg_type t WHERE t.typnamespace = 'public'::regnamespace AND t.typtype = 'e'
UNION ALL
SELECT 'Índices', COUNT(*) FROM pg_index ix JOIN pg_class t ON ix.indrelid = t.oid WHERE t.relnamespace = 'public'::regnamespace;

-- ============================================================
-- NOTA: Si todos estos queries ejecutan exitosamente,
-- el schema está completamente deployado en Supabase
-- ============================================================
