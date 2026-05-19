-- ============================================================
-- SISTEMA ASISTENCIA FAENA - Schema para Seed/Configuración
-- Versión: 1.3.0 | Fecha: 2026-05-13
-- Tablas para el módulo de configuración inicial
-- ============================================================

-- ============================================================
-- TIPOS ENUM ADICIONALES
-- ============================================================

-- RUT (Rol Único Tributario) - identificador único chileno
-- Formato: XX.XXX.XXX-X (con validación de dígito verificador)

CREATE TYPE contract_level AS ENUM ('CONTRATO', 'GERENCIA', 'SUBAREA');
-- CONTRATO = Nivel contrato (nivel 1)
-- GERENCIA = Gerencial (nivel 2)
-- SUBAREA = Subárea (nivel 3)

-- ============================================================
-- EXTENSIONES A TABLA: employees
-- ============================================================

-- Agregar columnas de configuración de seed si no existen
ALTER TABLE IF EXISTS employees
ADD COLUMN IF NOT EXISTS rut VARCHAR(12) UNIQUE,
ADD COLUMN IF NOT EXISTS gender gender,
ADD COLUMN IF NOT EXISTS contract_type contract_type DEFAULT 'FAENA',
ADD COLUMN IF NOT EXISTS sub_area VARCHAR(100),
ADD COLUMN IF NOT EXISTS email VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS is_group_61 BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN employees.rut IS 'RUT chileno (formato XX.XXX.XXX-X)';
COMMENT ON COLUMN employees.gender IS 'Género del empleado (M=Masculino, F=Femenino, O=Otro)';
COMMENT ON COLUMN employees.contract_type IS 'Tipo de contrato (FAENA, TELETRABAJO, MIXTO)';
COMMENT ON COLUMN employees.is_group_61 IS 'Pertenece a grupo 61 de pensión';

-- ============================================================
-- TABLA: areas_hierarchy
-- ============================================================
-- Versión mejorada de áreas con soporte jerárquico explícito

CREATE TABLE IF NOT EXISTS areas_hierarchy (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code         VARCHAR(10)  NOT NULL UNIQUE,
  name         VARCHAR(100) NOT NULL,
  description  TEXT,
  level        contract_level NOT NULL DEFAULT 'CONTRATO',
  parent_id    UUID         REFERENCES areas_hierarchy(id) ON DELETE CASCADE,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  -- Validación: level = CONTRATO no puede tener parent
  CONSTRAINT chk_hierarchy CHECK (
    (level = 'CONTRATO' AND parent_id IS NULL) OR
    (level != 'CONTRATO' AND parent_id IS NOT NULL)
  )
);

COMMENT ON TABLE areas_hierarchy IS 'Jerarquía de áreas con soporte multi-nivel';
COMMENT ON COLUMN areas_hierarchy.level IS 'Nivel en la jerarquía: CONTRATO (1), GERENCIA (2), SUBAREA (3)';

CREATE INDEX idx_areas_hierarchy_parent ON areas_hierarchy(parent_id);
CREATE INDEX idx_areas_hierarchy_level ON areas_hierarchy(level);
CREATE INDEX idx_areas_hierarchy_active ON areas_hierarchy(is_active);

-- ============================================================
-- TABLA: weekly_patterns_v2
-- ============================================================
-- Versión mejorada de patrones semanales con formato estándar

CREATE TABLE IF NOT EXISTS weekly_patterns_v2 (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                 VARCHAR(10)  NOT NULL UNIQUE,
  name                 VARCHAR(100) NOT NULL,
  total_weekly_hours   NUMERIC(5,2) NOT NULL CHECK (total_weekly_hours > 0 AND total_weekly_hours <= 168),
  -- Distribución por día de semana: L=Lunes, M=Martes, X=Miércoles, J=Jueves, V=Viernes, S=Sábado, D=Domingo
  hours_distribution   JSONB        NOT NULL DEFAULT '{"L": 8, "M": 8, "X": 8, "J": 8, "V": 8, "S": 0, "D": 0}',
  is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE weekly_patterns_v2 IS 'Patrones semanales de horas normalizados para seed';
COMMENT ON COLUMN weekly_patterns_v2.hours_distribution IS 'JSON con claves L,M,X,J,V,S,D y valores numéricos';

CREATE INDEX idx_weekly_patterns_v2_active ON weekly_patterns_v2(is_active);

-- ============================================================
-- TABLA: setup_log (Auditoría de inicializaciones)
-- ============================================================

CREATE TABLE IF NOT EXISTS setup_log (
  id            BIGSERIAL    PRIMARY KEY,
  operation     VARCHAR(50)  NOT NULL,
  entity_type   VARCHAR(50)  NOT NULL,
  entity_count  INTEGER      DEFAULT 0,
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
  -- pending, running, success, failed
  error_message TEXT,
  started_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  initiated_by  UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  dry_run       BOOLEAN      DEFAULT FALSE
);

COMMENT ON TABLE setup_log IS 'Registro de operaciones de seed/configuración inicial';
COMMENT ON COLUMN setup_log.dry_run IS 'TRUE si fue una simulación sin confirmación';

CREATE INDEX idx_setup_log_status ON setup_log(status);
CREATE INDEX idx_setup_log_timestamp ON setup_log(started_at DESC);

-- ============================================================
-- TRIGGERS: updated_at para nuevas tablas
-- ============================================================

CREATE TRIGGER trg_areas_hierarchy_updated_at
  BEFORE UPDATE ON areas_hierarchy
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_weekly_patterns_v2_updated_at
  BEFORE UPDATE ON weekly_patterns_v2
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- RLS: Habilitar en nuevas tablas
-- ============================================================

ALTER TABLE IF EXISTS areas_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS weekly_patterns_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS setup_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: areas_hierarchy
-- ============================================================

CREATE POLICY select_areas_hierarchy ON areas_hierarchy
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY modify_areas_hierarchy_admin ON areas_hierarchy
  FOR INSERT, UPDATE, DELETE
  USING (fn_user_is_admin())
  WITH CHECK (fn_user_is_admin());

-- ============================================================
-- RLS POLICIES: weekly_patterns_v2
-- ============================================================

CREATE POLICY select_weekly_patterns_v2 ON weekly_patterns_v2
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY modify_weekly_patterns_v2_admin ON weekly_patterns_v2
  FOR INSERT, UPDATE, DELETE
  USING (fn_user_is_admin())
  WITH CHECK (fn_user_is_admin());

-- ============================================================
-- RLS POLICIES: setup_log
-- ============================================================

CREATE POLICY select_setup_log_admin ON setup_log
  FOR SELECT
  USING (fn_user_is_admin());

CREATE POLICY insert_setup_log_authenticated ON setup_log
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- VISTA: Validación de integridad de seed
-- ============================================================

CREATE OR REPLACE VIEW vw_seed_validation AS
SELECT
  'areas_hierarchy' AS entity,
  COUNT(*) AS total_count,
  COUNT(*) FILTER (WHERE is_active = TRUE) AS active_count,
  COUNT(*) FILTER (WHERE parent_id IS NULL) AS root_count,
  CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'EMPTY' END AS status
FROM areas_hierarchy
GROUP BY 1
UNION ALL
SELECT
  'employees',
  COUNT(*),
  COUNT(*) FILTER (WHERE is_active = TRUE),
  COUNT(*) FILTER (WHERE rut IS NOT NULL),
  CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'EMPTY' END
FROM employees
GROUP BY 1
UNION ALL
SELECT
  'weekly_patterns_v2',
  COUNT(*),
  COUNT(*) FILTER (WHERE is_active = TRUE),
  0,
  CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'EMPTY' END
FROM weekly_patterns_v2
GROUP BY 1
UNION ALL
SELECT
  'user_roles',
  COUNT(*),
  COUNT(*),
  COUNT(*) FILTER (WHERE role = 'ADMIN'),
  CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'EMPTY' END
FROM user_roles
GROUP BY 1;

COMMENT ON VIEW vw_seed_validation IS 'Validación rápida del estado de las tablas de seed';

-- ============================================================
-- FUNCIÓN: Validar integridad del árbol jerárquico de áreas
-- ============================================================

CREATE OR REPLACE FUNCTION fn_validate_areas_hierarchy()
RETURNS TABLE (
  issue_type VARCHAR,
  affected_area_id UUID,
  affected_area_code VARCHAR,
  description TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar ciclos (un área siendo ancestro de sí misma)
  RETURN QUERY
  WITH RECURSIVE ancestor_chain AS (
    SELECT id, code, parent_id, 1 AS depth
    FROM areas_hierarchy
    WHERE parent_id IS NOT NULL
    UNION ALL
    SELECT a.id, a.code, a.parent_id, ac.depth + 1
    FROM areas_hierarchy a
    INNER JOIN ancestor_chain ac ON a.id = ac.parent_id
    WHERE ac.depth < 100 -- Prevenir bucles infinitos
  )
  SELECT
    'CIRCULAR_REFERENCE'::VARCHAR,
    ah.id,
    ah.code,
    'Área contiene una referencia circular en su jerarquía'::TEXT
  FROM areas_hierarchy ah
  WHERE ah.parent_id IS NOT NULL
    AND ah.id IN (
      SELECT DISTINCT ancestor_chain.id
      FROM ancestor_chain
      WHERE ancestor_chain.id = ah.parent_id
    );

  -- Verificar nivel inconsistente con parent
  RETURN QUERY
  SELECT
    'INVALID_LEVEL'::VARCHAR,
    child.id,
    child.code,
    'El nivel no corresponde con su jerarquía (padre no debe ser SUBAREA)'::TEXT
  FROM areas_hierarchy child
  INNER JOIN areas_hierarchy parent ON child.parent_id = parent.id
  WHERE child.parent_id IS NOT NULL
    AND parent.level = 'SUBAREA'::contract_level;
END;
$$;

-- ============================================================
-- DATOS DE REFERENCIA (patrones estándar)
-- ============================================================

INSERT INTO weekly_patterns_v2 (code, name, total_weekly_hours, hours_distribution) VALUES
  ('S45', 'Jornada 45 horas', 45, '{"L": 9, "M": 9, "X": 9, "J": 9, "V": 9, "S": 0, "D": 0}'),
  ('S40', 'Jornada 40 horas', 40, '{"L": 8, "M": 8, "X": 8, "J": 8, "V": 8, "S": 0, "D": 0}'),
  ('S44', 'Jornada 44 horas', 44, '{"L": 8, "M": 8, "X": 9, "J": 9, "V": 10, "S": 0, "D": 0}')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- COMENTARIOS FINALES
-- ============================================================

COMMENT ON FUNCTION fn_validate_areas_hierarchy() IS
  'Valida la integridad del árbol jerárquico de áreas. Detecta ciclos y niveles inválidos.';
