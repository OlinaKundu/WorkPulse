-- ==========================================================
-- Inner Eye Consultancy Services LLP
-- Relational Database Seed Script (PostgreSQL / ANSI SQL)
-- ==========================================================

-- 1. Insert Departments
INSERT INTO departments (id, name, created_at) VALUES 
('dept-eng-01', 'Software Engineering', CURRENT_TIMESTAMP),
('dept-ops-02', 'HR & Consulting Operations', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Users
-- Passwords:
-- Admin: Admin@123
-- Employee: Employee@123
INSERT INTO users (id, department_id, full_name, email, password_hash, role, leave_balance, created_at) VALUES
('usr-admin-01', 'dept-ops-02', 'Vikram Mehta (HR Director)', 'admin@innereye.com', '$2a$10$rC8G8k3YmKx/P73t4B9i1O3vH.v7G9KzFp6R1eD2qL4v8nN2bH5W6', 'HR', 24.00, CURRENT_TIMESTAMP),
('usr-emp-01', 'dept-eng-01', 'John Doe', 'john.doe@innereye.com', '$2a$10$rC8G8k3YmKx/P73t4B9i1O3vH.v7G9KzFp6R1eD2qL4v8nN2bH5W6', 'Employee', 18.00, CURRENT_TIMESTAMP),
('usr-emp-03', 'dept-eng-01', 'Alex Rivera (Lead Architect)', 'alex.rivera@innereye.com', '$2a$10$rC8G8k3YmKx/P73t4B9i1O3vH.v7G9KzFp6R1eD2qL4v8nN2bH5W6', 'Employee', 15.00, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
