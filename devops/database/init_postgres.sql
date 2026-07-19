-- init_postgres.sql
-- PostgreSQL schema for IndustrialBrain PS08
-- Owner: Member 4 — Data & DevOps Lead

-- ═══════════════════════════════════════════════════════════════════════════════
-- EQUIPMENT
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS equipment (
    equipment_id         VARCHAR(30) PRIMARY KEY,
    name                 VARCHAR(200) NOT NULL,
    equipment_type       VARCHAR(50) NOT NULL,
    location             VARCHAR(100),
    manufacturer         VARCHAR(100),
    model_number         VARCHAR(50),
    serial_number        VARCHAR(50),
    installed_date       DATE,
    age_years            NUMERIC(5,1),
    design_pressure_bar  NUMERIC(8,2),
    design_temp_c        NUMERIC(6,1),
    criticality          VARCHAR(20) CHECK (criticality IN ('Critical', 'High', 'Medium', 'Low')),
    status               VARCHAR(30) CHECK (status IN ('Active', 'Standby', 'Under Maintenance', 'Decommissioned')),
    next_pm_due          DATE,
    parent_equipment_id  VARCHAR(30) REFERENCES equipment(equipment_id),
    notes                TEXT,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipment_type ON equipment(equipment_type);
CREATE INDEX idx_equipment_criticality ON equipment(criticality);
CREATE INDEX idx_equipment_location ON equipment(location);
CREATE INDEX idx_equipment_status ON equipment(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MAINTENANCE LOGS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS maintenance_logs (
    log_id              VARCHAR(30) PRIMARY KEY,
    equipment_id        VARCHAR(30) REFERENCES equipment(equipment_id) ON DELETE CASCADE,
    maintenance_date    DATE NOT NULL,
    maintenance_type    VARCHAR(50) NOT NULL,
    failure_mode        VARCHAR(200),
    technician          VARCHAR(100),
    duration_hours      NUMERIC(6,1),
    parts_used          TEXT,
    cost_inr            INTEGER,
    status              VARCHAR(30) CHECK (status IN ('Completed', 'Deferred', 'Partially Completed', 'In Progress')),
    observations        TEXT,
    next_due_date       DATE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maint_equipment ON maintenance_logs(equipment_id);
CREATE INDEX idx_maint_date ON maintenance_logs(maintenance_date DESC);
CREATE INDEX idx_maint_type ON maintenance_logs(maintenance_type);

-- ═══════════════════════════════════════════════════════════════════════════════
-- WORK ORDERS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS work_orders (
    wo_id               VARCHAR(30) PRIMARY KEY,
    equipment_id        VARCHAR(30) REFERENCES equipment(equipment_id) ON DELETE CASCADE,
    location            VARCHAR(100),
    raised_date         DATE NOT NULL,
    due_date            DATE NOT NULL,
    closed_date         DATE,
    wo_type             VARCHAR(30) NOT NULL,
    priority            VARCHAR(20) NOT NULL,
    discipline          VARCHAR(50),
    description         TEXT NOT NULL,
    contractor          VARCHAR(100),
    planned_hrs         NUMERIC(6,1),
    actual_hrs          NUMERIC(6,1),
    planned_cost_inr    INTEGER,
    actual_cost_inr     INTEGER,
    status              VARCHAR(30) CHECK (status IN ('Open', 'In Progress', 'Closed', 'Deferred', 'Cancelled')),
    failure_found       BOOLEAN,
    repeat_failure      BOOLEAN,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wo_equipment ON work_orders(equipment_id);
CREATE INDEX idx_wo_status ON work_orders(status);
CREATE INDEX idx_wo_raised ON work_orders(raised_date DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INCIDENTS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS incidents (
    incident_id             VARCHAR(30) PRIMARY KEY,
    occurred_at             TIMESTAMP NOT NULL,
    closed_date             DATE,
    incident_type           VARCHAR(50) NOT NULL,
    severity                VARCHAR(20) NOT NULL,
    equipment_id            VARCHAR(30) REFERENCES equipment(equipment_id) ON DELETE SET NULL,
    department              VARCHAR(50),
    location_detail         VARCHAR(200),
    description             TEXT NOT NULL,
    immediate_cause         TEXT,
    root_cause              TEXT,
    corrective_action       TEXT,
    investigator            VARCHAR(100),
    injuries                INTEGER DEFAULT 0,
    lost_time_days          INTEGER DEFAULT 0,
    property_damage_inr     INTEGER DEFAULT 0,
    downtime_hours          NUMERIC(8,1) DEFAULT 0,
    repeat_incident         BOOLEAN DEFAULT FALSE,
    lessons_documented      BOOLEAN DEFAULT FALSE,
    regulatory_reportable   BOOLEAN DEFAULT FALSE,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_incident_occurred ON incidents(occurred_at DESC);
CREATE INDEX idx_incident_equipment ON incidents(equipment_id);
CREATE INDEX idx_incident_severity ON incidents(severity);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INSPECTION RECORDS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS inspections (
    inspection_id           VARCHAR(30) PRIMARY KEY,
    equipment_id            VARCHAR(30) REFERENCES equipment(equipment_id) ON DELETE CASCADE,
    equipment_type          VARCHAR(50),
    inspection_date         DATE NOT NULL,
    inspection_type         VARCHAR(100) NOT NULL,
    inspecting_agency       VARCHAR(100),
    result                  VARCHAR(20) CHECK (result IN ('Pass', 'Fail', 'Conditional Pass')),
    findings                TEXT,
    action_required         BOOLEAN DEFAULT FALSE,
    action_description      TEXT,
    action_due_date         DATE,
    action_closed           BOOLEAN DEFAULT FALSE,
    certificate_type        VARCHAR(100),
    certificate_number      VARCHAR(50),
    certificate_valid_until DATE,
    certificate_expired     BOOLEAN DEFAULT FALSE,
    next_inspection_due     DATE,
    inspector_name          VARCHAR(100),
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_insp_equipment ON inspections(equipment_id);
CREATE INDEX idx_insp_date ON inspections(inspection_date DESC);
CREATE INDEX idx_insp_cert_expiry ON inspections(certificate_valid_until);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ALERTS (Predictive Maintenance)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS alerts (
    alert_id            SERIAL PRIMARY KEY,
    equipment_id        VARCHAR(30) REFERENCES equipment(equipment_id) ON DELETE CASCADE,
    alert_type          VARCHAR(50) NOT NULL,
    severity            VARCHAR(20) NOT NULL,
    message             TEXT NOT NULL,
    failure_probability NUMERIC(5,2),
    recommended_action  TEXT,
    auto_work_order_id  VARCHAR(30),
    raised_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at     TIMESTAMP,
    acknowledged_by     VARCHAR(100),
    resolved_at         TIMESTAMP,
    is_active           BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_alert_equipment ON alerts(equipment_id);
CREATE INDEX idx_alert_active ON alerts(is_active, raised_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPLIANCE GAPS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS compliance_gaps (
    gap_id              SERIAL PRIMARY KEY,
    equipment_id        VARCHAR(30) REFERENCES equipment(equipment_id) ON DELETE CASCADE,
    clause_id           VARCHAR(50) NOT NULL,
    regulation          VARCHAR(100) NOT NULL,
    gap_description     TEXT NOT NULL,
    recommended_action  TEXT,
    priority            VARCHAR(20),
    status              VARCHAR(30) DEFAULT 'Open',
    assigned_to         VARCHAR(100),
    due_date            DATE,
    detected_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at         TIMESTAMP
);

CREATE INDEX idx_gap_equipment ON compliance_gaps(equipment_id);
CREATE INDEX idx_gap_status ON compliance_gaps(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- USERS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
    user_id         SERIAL PRIMARY KEY,
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(30) NOT NULL,
    department      VARCHAR(50),
    password_hash   VARCHAR(255) NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login      TIMESTAMP,
    phone           VARCHAR(20),
    employee_id     VARCHAR(20) UNIQUE
);

CREATE INDEX idx_user_username ON users(username);
CREATE INDEX idx_user_email ON users(email);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CHAT HISTORY
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS chat_history (
    chat_id         SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    query           TEXT NOT NULL,
    response        TEXT NOT NULL,
    agent_used      VARCHAR(50),
    sources         JSONB,
    timestamp       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_user ON chat_history(user_id);
CREATE INDEX idx_chat_timestamp ON chat_history(timestamp DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- AUDIT LOG
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS audit_log (
    log_id          SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(50),
    resource_id     VARCHAR(100),
    details         JSONB,
    ip_address      VARCHAR(45),
    timestamp       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════

COMMIT;
