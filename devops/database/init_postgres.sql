-- PS08 relational schema - equipment master + work orders
-- Owner: Member 4

CREATE TABLE IF NOT EXISTS equipment (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    equipment_type VARCHAR(100),
    location VARCHAR(255),
    installed_date DATE
);

CREATE TABLE IF NOT EXISTS work_orders (
    id SERIAL PRIMARY KEY,
    equipment_id VARCHAR(50) REFERENCES equipment(id),
    description TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    equipment_id VARCHAR(50) REFERENCES equipment(id),
    description TEXT,
    severity VARCHAR(50),
    occurred_at TIMESTAMP
);
