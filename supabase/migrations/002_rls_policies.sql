-- ============================================================
-- SISTEMA ASISTENCIA FAENA - RLS y Políticas
-- Versión: 1.0.0 | Fecha: 2026-05-12
-- ============================================================

-- Habilitar RLS en las tablas de aplicación
ALTER TABLE IF EXISTS areas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employees      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS weekly_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS monthly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS planning_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_roles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_log      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Funciones auxiliares de roles
-- ============================================================

CREATE OR REPLACE FUNCTION fn_user_can_manage_area(p_area_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('ADMIN', 'SUPERVISOR')
      AND (ur.area_id IS NULL OR ur.area_id = p_area_id)
  );
$$;

CREATE OR REPLACE FUNCTION fn_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION fn_user_can_read_area(p_area_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM areas a
    WHERE a.id = p_area_id
      AND a.is_active = TRUE
  );
$$;

-- ============================================================
-- Políticas de lectura pública para datos activos
-- ============================================================

CREATE POLICY select_active_areas ON areas
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY select_active_employees ON employees
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY select_weekly_patterns ON weekly_patterns
  FOR SELECT
  USING (fn_user_can_read_area(area_id));

CREATE POLICY select_monthly_targets ON monthly_targets
  FOR SELECT
  USING (fn_user_can_read_area(area_id));

CREATE POLICY select_planning_daily ON planning_daily
  FOR SELECT
  USING (
    EXISTS(
      SELECT 1
      FROM employees e
      WHERE e.id = planning_daily.employee_id
        AND e.is_active = TRUE
    )
  );

CREATE POLICY select_user_roles_self_or_admin ON user_roles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (user_id = auth.uid() OR fn_user_is_admin())
  );

CREATE POLICY select_audit_log_admin ON audit_log
  FOR SELECT
  USING (fn_user_is_admin());

-- ============================================================
-- Políticas de escritura para ADMIN/SUPERVISOR por área
-- ============================================================

CREATE POLICY modify_areas_admin ON areas
  FOR INSERT, UPDATE, DELETE
  USING (fn_user_is_admin())
  WITH CHECK (fn_user_is_admin());

CREATE POLICY modify_employees_area ON employees
  FOR INSERT, UPDATE, DELETE
  USING (fn_user_can_manage_area(area_id))
  WITH CHECK (fn_user_can_manage_area(area_id));

CREATE POLICY modify_weekly_patterns_area ON weekly_patterns
  FOR INSERT, UPDATE, DELETE
  USING (fn_user_can_manage_area(area_id))
  WITH CHECK (fn_user_can_manage_area(area_id));

CREATE POLICY modify_monthly_targets_area ON monthly_targets
  FOR INSERT, UPDATE, DELETE
  USING (fn_user_can_manage_area(area_id))
  WITH CHECK (fn_user_can_manage_area(area_id));

CREATE POLICY modify_planning_daily_area ON planning_daily
  FOR INSERT, UPDATE, DELETE
  USING (
    EXISTS(
      SELECT 1
      FROM employees e
      WHERE e.id = planning_daily.employee_id
        AND fn_user_can_manage_area(e.area_id)
    )
  )
  WITH CHECK (
    EXISTS(
      SELECT 1
      FROM employees e
      WHERE e.id = NEW.employee_id
        AND fn_user_can_manage_area(e.area_id)
    )
  );

CREATE POLICY modify_user_roles_admin ON user_roles
  FOR INSERT, UPDATE, DELETE
  USING (fn_user_is_admin())
  WITH CHECK (fn_user_is_admin());

-- ============================================================
-- Auditoría inmutable: no actualizaciones ni borrados directos
-- ============================================================

CREATE POLICY deny_update_delete_audit_log ON audit_log
  FOR UPDATE, DELETE
  USING (false);

CREATE POLICY select_audit_log_service_or_admin ON audit_log
  FOR SELECT
  USING (fn_user_is_admin());

CREATE OR REPLACE FUNCTION fn_prevent_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit log is immutable and cannot be modified directly.';
END;
$$;

CREATE TRIGGER trg_audit_log_no_mutation
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION fn_prevent_audit_log_mutation();
