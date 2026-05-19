-- ============================================================
-- SISTEMA ASISTENCIA FAENA - Schema Principal
-- Versión: 1.0.0 | Fecha: 2026-05-12
-- Compatible con: supabase db push
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================
-- TIPOS ENUM
-- ============================================================

CREATE TYPE attendance_status AS ENUM ('P', 'T', 'V', 'L');
-- P = Presente, T = Turno (libre), V = Vacaciones, L = Licencia

CREATE TYPE user_role AS ENUM ('ADMIN', 'SUPERVISOR', 'VIEWER');

CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- ============================================================
-- TABLA: areas
-- ============================================================

CREATE TABLE IF NOT EXISTS areas (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code         VARCHAR(10)  NOT NULL UNIQUE,
  name         VARCHAR(100) NOT NULL,
  description  TEXT,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE areas IS 'Áreas de la faena (departamentos/sectores)';
COMMENT ON COLUMN areas.code IS 'Código corto único para el área (ej: MANT, OPER)';

-- ============================================================
-- TABLA: employees
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_code   VARCHAR(20)  NOT NULL UNIQUE,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  area_id         UUID         NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
  position        VARCHAR(100),
  fte_percentage  NUMERIC(5,2) NOT NULL DEFAULT 100.00
                    CHECK (fte_percentage > 0 AND fte_percentage <= 100),
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  hire_date       DATE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE employees IS 'Empleados de la faena';
COMMENT ON COLUMN employees.fte_percentage IS 'Porcentaje FTE del empleado (1-100)';

CREATE INDEX idx_employees_area_id    ON employees(area_id);
CREATE INDEX idx_employees_is_active  ON employees(is_active);
CREATE INDEX idx_employees_code       ON employees(employee_code);

-- ============================================================
-- TABLA: weekly_patterns
-- ============================================================
-- Define el patrón de horas por día de la semana para cada área

CREATE TABLE IF NOT EXISTS weekly_patterns (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_id     UUID        NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  -- Horas por día de semana (0=Domingo ... 6=Sábado)
  hours_sun   NUMERIC(4,2) NOT NULL DEFAULT 0   CHECK (hours_sun   >= 0 AND hours_sun   <= 12),
  hours_mon   NUMERIC(4,2) NOT NULL DEFAULT 8   CHECK (hours_mon   >= 0 AND hours_mon   <= 12),
  hours_tue   NUMERIC(4,2) NOT NULL DEFAULT 8   CHECK (hours_tue   >= 0 AND hours_tue   <= 12),
  hours_wed   NUMERIC(4,2) NOT NULL DEFAULT 8   CHECK (hours_wed   >= 0 AND hours_wed   <= 12),
  hours_thu   NUMERIC(4,2) NOT NULL DEFAULT 8   CHECK (hours_thu   >= 0 AND hours_thu   <= 12),
  hours_fri   NUMERIC(4,2) NOT NULL DEFAULT 8   CHECK (hours_fri   >= 0 AND hours_fri   <= 12),
  hours_sat   NUMERIC(4,2) NOT NULL DEFAULT 0   CHECK (hours_sat   >= 0 AND hours_sat   <= 12),
  is_default  BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (area_id, name)
);

COMMENT ON TABLE weekly_patterns IS 'Patrones semanales de horas por área';

CREATE INDEX idx_weekly_patterns_area ON weekly_patterns(area_id);

-- ============================================================
-- TABLA: monthly_targets
-- ============================================================
-- Meta mensual de horas por área/año/mes

CREATE TABLE IF NOT EXISTS monthly_targets (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_id           UUID         NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  year              SMALLINT     NOT NULL CHECK (year >= 2020 AND year <= 2099),
  month             SMALLINT     NOT NULL CHECK (month >= 1 AND month <= 12),
  pattern_id        UUID         NOT NULL REFERENCES weekly_patterns(id) ON DELETE RESTRICT,
  target_hours      NUMERIC(8,2) NOT NULL CHECK (target_hours > 0),
  -- Calculado: Σ(semanas_en_mes × horas_patron × fte_promedio/100)
  computed_fte_hours NUMERIC(8,2),
  notes             TEXT,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (area_id, year, month)
);

COMMENT ON TABLE monthly_targets IS 'Metas mensuales de horas por área';

CREATE INDEX idx_monthly_targets_area       ON monthly_targets(area_id);
CREATE INDEX idx_monthly_targets_year_month ON monthly_targets(year, month);

-- ============================================================
-- TABLA: planning_daily
-- ============================================================

CREATE TABLE IF NOT EXISTS planning_daily (
  id           UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id  UUID             NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  plan_date    DATE             NOT NULL,
  status       attendance_status NOT NULL DEFAULT 'P',
  hours_worked NUMERIC(4,2)     NOT NULL DEFAULT 8
                 CHECK (hours_worked >= 0 AND hours_worked <= 12),
  notes        TEXT,
  approved_by  UUID             REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at  TIMESTAMPTZ,
  created_by   UUID             NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  -- Un empleado solo puede tener un registro por día
  UNIQUE (employee_id, plan_date)
);

COMMENT ON TABLE planning_daily IS 'Planificación diaria de asistencia';
COMMENT ON COLUMN planning_daily.status IS 'P=Presente, T=Turno libre, V=Vacaciones, L=Licencia';

CREATE INDEX idx_planning_employee_date ON planning_daily(employee_id, plan_date);
CREATE INDEX idx_planning_date          ON planning_daily(plan_date);
CREATE INDEX idx_planning_status        ON planning_daily(status);
CREATE INDEX idx_planning_approved      ON planning_daily(approved_by) WHERE approved_by IS NOT NULL;

-- ============================================================
-- TABLA: user_roles
-- ============================================================

CREATE TABLE IF NOT EXISTS user_roles (
  id         UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID      NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       user_role NOT NULL DEFAULT 'VIEWER',
  area_id    UUID      REFERENCES areas(id) ON DELETE CASCADE,
  -- NULL en area_id = acceso global (solo ADMIN)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, area_id)
);

COMMENT ON TABLE user_roles IS 'Roles de usuario por área. area_id NULL = acceso global';

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_area_id ON user_roles(area_id);

-- ============================================================
-- TABLA: audit_log
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL    PRIMARY KEY,
  table_name  VARCHAR(50)  NOT NULL,
  record_id   UUID         NOT NULL,
  action      audit_action NOT NULL,
  old_data    JSONB,
  new_data    JSONB,
  changed_by  UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  -- Sin updated_at: audit_log es INMUTABLE
);

COMMENT ON TABLE audit_log IS 'Log de auditoría inmutable. Nunca modificar registros existentes.';

CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_changed_at   ON audit_log(changed_at DESC);
CREATE INDEX idx_audit_changed_by   ON audit_log(changed_by);

-- ============================================================
-- FUNCIÓN: fn_set_updated_at - Actualiza el campo updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- FUNCIÓN: fn_audit_log - Registra cambios en la tabla audit_log
-- ============================================================

CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record_id UUID;
  v_action    audit_action;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_record_id := NEW.id;
    v_action    := 'INSERT';
    INSERT INTO audit_log (table_name, record_id, action, new_data, changed_by)
    VALUES (TG_TABLE_NAME, v_record_id, v_action, row_to_json(NEW)::jsonb, auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_record_id := NEW.id;
    v_action    := 'UPDATE';
    INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, v_record_id, v_action, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id;
    v_action    := 'DELETE';
    INSERT INTO audit_log (table_name, record_id, action, old_data, changed_by)
    VALUES (TG_TABLE_NAME, v_record_id, v_action, row_to_json(OLD)::jsonb, auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- ============================================================
-- TRIGGERS: updated_at en todas las tablas mutables
-- ============================================================

CREATE TRIGGER trg_areas_updated_at
  BEFORE UPDATE ON areas
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_weekly_patterns_updated_at
  BEFORE UPDATE ON weekly_patterns
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_monthly_targets_updated_at
  BEFORE UPDATE ON monthly_targets
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_planning_daily_updated_at
  BEFORE UPDATE ON planning_daily
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- TRIGGERS: audit en tablas críticas
-- ============================================================

CREATE TRIGGER trg_employees_audit
  AFTER INSERT OR UPDATE OR DELETE ON employees
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_planning_daily_audit
  AFTER INSERT OR UPDATE OR DELETE ON planning_daily
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_monthly_targets_audit
  AFTER INSERT OR UPDATE OR DELETE ON monthly_targets
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_user_roles_audit
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- ============================================================
-- FUNCIÓN: Validar fecha de planificación (max 3 días en futuro)
-- ============================================================

CREATE OR REPLACE FUNCTION fn_validate_plan_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.plan_date > CURRENT_DATE + INTERVAL '3 days' THEN
    RAISE EXCEPTION 'No se puede planificar más de 3 días en el futuro. Fecha: %, Máximo permitido: %',
      NEW.plan_date, CURRENT_DATE + INTERVAL '3 days'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_planning_date_validation
  BEFORE INSERT OR UPDATE ON planning_daily
  FOR EACH ROW EXECUTE FUNCTION fn_validate_plan_date();

-- ============================================================
-- FUNCIÓN: Vista materializable - Horas por área/mes
-- ============================================================

CREATE OR REPLACE FUNCTION fn_monthly_hours_by_area(
  p_year  SMALLINT,
  p_month SMALLINT
)
RETURNS TABLE (
  area_id        UUID,
  area_code      VARCHAR,
  area_name      VARCHAR,
  total_hours    NUMERIC,
  present_count  BIGINT,
  absent_count   BIGINT,
  target_hours   NUMERIC,
  deviation_pct  NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id                                        AS area_id,
    a.code                                      AS area_code,
    a.name                                      AS area_name,
    COALESCE(SUM(pd.hours_worked), 0)           AS total_hours,
    COUNT(*) FILTER (WHERE pd.status = 'P')     AS present_count,
    COUNT(*) FILTER (WHERE pd.status != 'P')    AS absent_count,
    COALESCE(mt.target_hours, 0)                AS target_hours,
    CASE
      WHEN COALESCE(mt.target_hours, 0) > 0 THEN
        ROUND(((COALESCE(SUM(pd.hours_worked), 0) - mt.target_hours) / mt.target_hours * 100)::NUMERIC, 2)
      ELSE NULL
    END                                         AS deviation_pct
  FROM areas a
  LEFT JOIN employees e ON e.area_id = a.id AND e.is_active = TRUE
  LEFT JOIN planning_daily pd
    ON pd.employee_id = e.id
    AND EXTRACT(YEAR FROM pd.plan_date)  = p_year
    AND EXTRACT(MONTH FROM pd.plan_date) = p_month
  LEFT JOIN monthly_targets mt
    ON mt.area_id = a.id
    AND mt.year  = p_year
    AND mt.month = p_month
  WHERE a.is_active = TRUE
  GROUP BY a.id, a.code, a.name, mt.target_hours;
END;
$$;

-- ============================================================
-- DATOS INICIALES (seed)
-- ============================================================

INSERT INTO areas (code, name, description) VALUES
  ('OPER',  'Operaciones',       'Personal operativo de planta'),
  ('MANT',  'Mantenimiento',     'Equipo de mantenimiento mecánico y eléctrico'),
  ('ADMIN', 'Administración',    'Personal administrativo y de gestión'),
  ('SSGG',  'Servicios Generales','Servicios de apoyo general'),
  ('SEG',   'Seguridad',         'Equipo de seguridad y vigilancia')
ON CONFLICT (code) DO NOTHING;
