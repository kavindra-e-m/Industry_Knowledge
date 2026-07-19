-- users.sql
-- Seed users for demo environment
-- Owner: Member 4 — Data & DevOps Lead

-- Create users table if not exists (normally handled by init_postgres.sql)
CREATE TABLE IF NOT EXISTS users (
    user_id         SERIAL PRIMARY KEY,
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(30) NOT NULL,
    department      VARCHAR(50),
    password_hash   VARCHAR(255) NOT NULL,  -- bcrypt hash
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login      TIMESTAMP,
    phone           VARCHAR(20),
    employee_id     VARCHAR(20) UNIQUE
);

-- Demo users (all passwords: "demo123" — bcrypt hash below)
-- Password hash generated with: bcrypt.hashpw(b"demo123", bcrypt.gensalt())
-- Hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqVr/qviu6

INSERT INTO users (username, email, full_name, role, department, password_hash, employee_id, phone) VALUES
('admin', 'admin@industrialbrain.local', 'System Administrator', 'admin', 'IT', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqVr/qviu6', 'EMP-00001', '+91-9876543210'),
('plant.manager', 'manager@industrialbrain.local', 'Sanjay Kulkarni', 'plant_manager', 'Operations', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqVr/qviu6', 'EMP-00102', '+91-9876543211'),
('ops.supervisor', 'ops.supervisor@industrialbrain.local', 'Ramesh Nair', 'supervisor', 'Operations', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqVr/qviu6', 'EMP-00203', '+91-9876543212'),
('maint.engineer', 'maint.eng@industrialbrain.local', 'Arjun Desai', 'engineer', 'Maintenance', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqVr/qviu6', 'EMP-00304', '+91-9876543213'),
('hse.officer', 'hse@industrialbrain.local', 'Tanveer Ahmed', 'hse_officer', 'HSE', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqVr/qviu6', 'EMP-00405', '+91-9876543214'),
('ops.tech1', 'tech1@industrialbrain.local', 'Rajesh Kumar', 'technician', 'Operations', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqVr/qviu6', 'EMP-00506', '+91-9876543215'),
('ops.tech2', 'tech2@industrialbrain.local', 'Priya Menon', 'technician', 'Operations', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqVr/qviu6', 'EMP-00607', '+91-9876543216'),
('maint.tech', 'maint.tech@industrialbrain.local', 'Karthik Rajan', 'technician', 'Maintenance', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqVr/qviu6', 'EMP-00708', '+91-9876543217'),
('instrument.eng', 'instrument@industrialbrain.local', 'Meera Krishnan', 'engineer', 'Instrumentation', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqVr/qviu6', 'EMP-00809', '+91-9876543218'),
('compliance.officer', 'compliance@industrialbrain.local', 'Deepa Nair', 'compliance_officer', 'HSE', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqVr/qviu6', 'EMP-00910', '+91-9876543219');

-- Update admin last_login to simulate active use
UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = 'admin';
UPDATE users SET last_login = CURRENT_TIMESTAMP - INTERVAL '2 hours' WHERE username = 'plant.manager';
UPDATE users SET last_login = CURRENT_TIMESTAMP - INTERVAL '5 hours' WHERE username = 'ops.supervisor';

COMMIT;
