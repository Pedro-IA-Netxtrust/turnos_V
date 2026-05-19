-- ============================================================
-- SISTEMA ASISTENCIA FAENA - Schema Extendido
-- Versión: 1.1.0 | Fecha: 2026-05-12
-- Tablas adicionales para Fase 1
-- ============================================================

-- ============================================================
-- TIPOS ENUM ADICIONALES
-- ============================================================

CREATE TYPE resource_type AS ENUM ('CAMIONETA', 'CASINO', 'HERRAMIENTA');
-- CAMIONETA = Vehículo de transporte
-- CASINO = Servicios de comida/descanso
-- HERRAMIENTA = Equipo especializado

CREATE TYPE gender AS ENUM ('M', 'F', 'O');
-- M = Masculino, F = Femenino, O = Otro

CREATE TYPE contract_type AS ENUM ('FAENA', 'TELETRABAJO', 'MIXTO');
-- FAENA = Presencial en faena
-- TELETRABAJO = Remoto
-- MIXTO = Combinado

-- ============================================================
-- TABLA: resources (Camionetas, casinos, etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS resources (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            VARCHAR(20)  NOT NULL UNIQUE,
  name            VARCHAR(100) NOT NULL,
  type            resource_type NOT NULL,
  area_id         UUID         NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  capacity        INTEGER      CHECK (capacity > 0),
  description     TEXT,
  is_available    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE resources IS 'Recursos compartidos: camionetas, casinos, herramientas';
COMMENT ON COLUMN resources.capacity IS 'Capacidad máxima (personas para camioneta, porciones para casino)';

CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_area ON resources(area_id);
CREATE INDEX idx_resources_available ON resources(is_available);

-- ============================================================
-- TABLA: resource_assignments (Asignaciones temporales)
-- ============================================================

CREATE TABLE IF NOT EXISTS resource_assignments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID         NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  resource_id     UUID         NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  assignment_date DATE         NOT NULL,
  duration_days   SMALLINT     NOT NULL CHECK (duration_days > 0 AND duration_days <= 365),
  notes           TEXT,
  assigned_by     VARCHAR(100),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  -- No hay solapamientos de asignaciones del mismo recurso
  UNIQUE (resource_id, assignment_date),
  UNIQUE (employee_id, resource_id, assignment_date)
);

COMMENT ON TABLE resource_assignments IS 'Asignación temporal de recursos a empleados por período';
COMMENT ON COLUMN resource_assignments.assignment_date IS 'Fecha de inicio de la asignación';
COMMENT ON COLUMN resource_assignments.duration_days IS 'Duración en días';

CREATE INDEX idx_resource_assignments_employee ON resource_assignments(employee_id);
CREATE INDEX idx_resource_assignments_resource ON resource_assignments(resource_id);
CREATE INDEX idx_resource_assignments_date ON resource_assignments(assignment_date);

-- ============================================================
-- TABLA: security_training (Charlas de seguridad)
-- ============================================================

CREATE TABLE IF NOT EXISTS security_training (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID         NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  training_date   DATE         NOT NULL,
  topic           VARCHAR(200) NOT NULL,
  duration_hours  NUMERIC(4,2) NOT NULL CHECK (duration_hours > 0),
  instructor      VARCHAR(100),
  notes           TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE security_training IS 'Registro de charlas de seguridad por empleado';

CREATE INDEX idx_security_training_employee ON security_training(employee_id);
CREATE INDEX idx_security_training_date ON security_training(training_date);

-- ============================================================
-- TABLA: employee_metrics (Métricas jerárquicas)
-- ============================================================

CREATE TABLE IF NOT EXISTS employee_metrics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID         NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year            SMALLINT     NOT NULL CHECK (year >= 2020 AND year <= 2099),
  month           SMALLINT     NOT NULL CHECK (month >= 1 AND month <= 12),
  gender          gender,
  contract_type   contract_type,
  total_hours_worked NUMERIC(8,2) DEFAULT 0,
  total_hours_faena  NUMERIC(8,2) DEFAULT 0,
  total_hours_telework NUMERIC(8,2) DEFAULT 0,
  security_trainings_count SMALLINT DEFAULT 0,
  real_hours      NUMERIC(8,2),
  target_hours    NUMERIC(8,2),
  deviation_pct   NUMERIC(5,2),
  alert_flag      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, year, month)
);

COMMENT ON TABLE employee_metrics IS 'Métricas mensuales consolidadas por empleado';
COMMENT ON COLUMN employee_metrics.alert_flag IS 'TRUE si desviación < -10% u otra condición crítica';

CREATE INDEX idx_employee_metrics_employee ON employee_metrics(employee_id);
CREATE INDEX idx_employee_metrics_year_month ON employee_metrics(year, month);
CREATE INDEX idx_employee_metrics_alert ON employee_metrics(alert_flag);

-- ============================================================
-- EXTENSIÓN: Campos adicionales en employees
-- ============================================================

ALTER TABLE IF EXISTS employees
ADD COLUMN IF NOT EXISTS gender gender,
ADD COLUMN IF NOT EXISTS contract_type contract_type DEFAULT 'FAENA',
ADD COLUMN IF NOT EXISTS email VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- ============================================================
-- TRIGGERS: updated_at para nuevas tablas
-- ============================================================

CREATE TRIGGER trg_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_resource_assignments_updated_at
  BEFORE UPDATE ON resource_assignments
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_security_training_updated_at
  BEFORE UPDATE ON security_training
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_employee_metrics_updated_at
  BEFORE UPDATE ON employee_metrics
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- TRIGGERS: audit en nuevas tablas críticas
-- ============================================================

CREATE TRIGGER trg_resources_audit
  AFTER INSERT OR UPDATE OR DELETE ON resources
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_resource_assignments_audit
  AFTER INSERT OR UPDATE OR DELETE ON resource_assignments
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_security_training_audit
  AFTER INSERT OR UPDATE OR DELETE ON security_training
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_employee_metrics_audit
  AFTER INSERT OR UPDATE OR DELETE ON employee_metrics
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- ============================================================
-- DATOS INICIALES: Resources de ejemplo
-- ============================================================

INSERT INTO resources (code, name, type, area_id, capacity, description)
SELECT 'CAMI-001', 'Camioneta Transporte 1', 'CAMIONETA', areas.id, 5, 'Camioneta de transporte personal'
FROM areas WHERE code = 'OPER' LIMIT 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO resources (code, name, type, area_id, capacity, description)
SELECT 'CASI-001', 'Casino Central', 'CASINO', areas.id, 100, 'Servicios de comedor principal'
FROM areas WHERE code = 'ADMIN' LIMIT 1
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- FUNCIÓN: Validar no solapamiento de asignaciones
-- ============================================================

CREATE OR REPLACE FUNCTION fn_validate_resource_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_overlap_count INTEGER;
BEGIN
  -- Verificar que no haya solapamientos de la misma recurso
  SELECT COUNT(*) INTO v_overlap_count
  FROM resource_assignments
  WHERE resource_id = NEW.resource_id
    AND assignment_date <> NEW.assignment_date
    AND assignment_date <= (NEW.assignment_date + (NEW.duration_days - 1)::INTERVAL)
    AND (assignment_date + (duration_days - 1)::INTERVAL) >= NEW.assignment_date
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000');

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION 'Conflicto de asignación: El recurso % ya está asignado en el período solicitado',
      NEW.resource_id
      USING ERRCODE = 'P0002';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_resource_assignment_validation
  BEFORE INSERT OR UPDATE ON resource_assignments
  FOR EACH ROW EXECUTE FUNCTION fn_validate_resource_assignment();

-- ============================================================
-- VISTA: Ocupación de recursos por período
-- ============================================================

CREATE OR REPLACE VIEW vw_resource_occupancy AS
SELECT
  r.id,
  r.code,
  r.name,
  r.type,
  a.name AS area_name,
  ra.assignment_date,
  ra.assignment_date + (ra.duration_days - 1)::INTERVAL AS assignment_end_date,
  e.employee_code,
  e.first_name,
  e.last_name,
  ra.notes
FROM resources r
LEFT JOIN resource_assignments ra ON ra.resource_id = r.id
LEFT JOIN employees e ON e.id = ra.employee_id
LEFT JOIN areas a ON a.id = r.area_id
WHERE r.is_available = TRUE
ORDER BY r.code, ra.assignment_date DESC;
