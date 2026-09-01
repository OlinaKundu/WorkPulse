-- ==========================================================
-- Inner Eye Consultancy Services LLP
-- Enterprise Employee Attendance & Productivity Management
-- Relational Database Schema (PostgreSQL / ANSI SQL)
-- ==========================================================

-- Enable UUID extension if using PostgreSQL
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    department_id VARCHAR(36) REFERENCES departments(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Employee' CHECK (role IN ('Employee', 'HR')),
    leave_balance NUMERIC(5, 2) DEFAULT 20.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attendance_date VARCHAR(10) NOT NULL, -- Format: YYYY-MM-DD
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    working_hours NUMERIC(6, 2) DEFAULT 0.00 NOT NULL,
    status VARCHAR(50) DEFAULT 'Present' CHECK (status IN ('Present', 'Late', 'Half Day', 'Absent', 'On Leave')),
    leave_deducted NUMERIC(4, 2) DEFAULT 0.00 NOT NULL,
    is_out_of_bounds BOOLEAN DEFAULT FALSE NOT NULL,
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    distance_meters NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_daily_attendance UNIQUE (user_id, attendance_date)
);

-- 4. Breaks Table
CREATE TABLE IF NOT EXISTS breaks (
    id VARCHAR(36) PRIMARY KEY,
    attendance_id VARCHAR(36) NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
    break_start TIMESTAMP WITH TIME ZONE NOT NULL,
    break_end TIMESTAMP WITH TIME ZONE,
    break_type VARCHAR(50) DEFAULT 'Lunch' CHECK (break_type IN ('Lunch', 'Coffee', 'Short Break', 'Meeting', 'Personal')),
    duration_minutes NUMERIC(6, 2) DEFAULT 0.00 NOT NULL
);

-- 5. Audit Logs Table (Immutable HR Auditing)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    performed_by VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_attendance_id VARCHAR(36) REFERENCES attendance(id) ON DELETE SET NULL,
    target_user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_breaks_attendance ON breaks(attendance_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_attendance ON audit_logs(target_attendance_id);
