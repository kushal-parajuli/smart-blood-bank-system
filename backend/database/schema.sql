-- =========================================================
-- Smart Blood Bank Management System
-- Database Schema
-- Engine: MySQL (XAMPP)
-- =========================================================

CREATE DATABASE IF NOT EXISTS smart_blood_bank
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_blood_bank;

-- ---------------------------------------------------------
-- 1. ROLES & USERS (auth core — single table for all roles)
-- ---------------------------------------------------------
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(20) NOT NULL UNIQUE   -- 'user', 'blood_bank', 'admin'
);

INSERT INTO roles (name) VALUES ('user'), ('blood_bank'), ('admin');

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ---------------------------------------------------------
-- 2. BLOOD BANK PROFILE (location captured once, at registration)
-- ---------------------------------------------------------
CREATE TABLE blood_banks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    bank_name VARCHAR(150) NOT NULL,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    address VARCHAR(255),
    city VARCHAR(100),
    district VARCHAR(100),
    province VARCHAR(100),
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    is_verified_by_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- 3. DONOR PROFILE (extension of a normal user)
-- ---------------------------------------------------------
CREATE TABLE donors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100),
    district VARCHAR(100),
    province VARCHAR(100),
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    last_donation_date DATE,
    is_available BOOLEAN DEFAULT TRUE,
    is_verified_by_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_blood_group_city (blood_group, city)
);

-- ---------------------------------------------------------
-- 4. BLOOD INVENTORY
-- ---------------------------------------------------------
CREATE TABLE blood_inventory (
    id INT PRIMARY KEY AUTO_INCREMENT,
    blood_bank_id INT NOT NULL,
    blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
    quantity_units INT NOT NULL DEFAULT 0,
    collection_date DATE,
    expiry_date DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (blood_bank_id) REFERENCES blood_banks(id) ON DELETE CASCADE,
    INDEX idx_bank_group (blood_bank_id, blood_group)
);

-- ---------------------------------------------------------
-- 5. BLOOD REQUESTS
-- ai_session_id is a loose, optional reference to a future
-- AI first-aid chat session — no FK, since the AI service
-- persists nothing server-side. Purely informational.
-- ---------------------------------------------------------
CREATE TABLE blood_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    requester_id INT NOT NULL,
    blood_bank_id INT NULL,
    blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
    units_needed INT NOT NULL DEFAULT 1,
    urgency ENUM('normal','urgent','emergency') DEFAULT 'normal',
    status ENUM('pending','accepted','rejected','fulfilled','cancelled') DEFAULT 'pending',
    ai_session_id VARCHAR(100) NULL,
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (blood_bank_id) REFERENCES blood_banks(id),
    INDEX idx_status_group (status, blood_group)
);

-- ---------------------------------------------------------
-- 6. DONATIONS (history — independent of requests, walk-ins allowed)
-- ---------------------------------------------------------
CREATE TABLE donations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    donor_id INT NOT NULL,
    blood_bank_id INT NOT NULL,
    blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
    units_donated INT NOT NULL DEFAULT 1,
    donation_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donor_id) REFERENCES donors(id),
    FOREIGN KEY (blood_bank_id) REFERENCES blood_banks(id)
);

-- ---------------------------------------------------------
-- 7. DONOR APPOINTMENTS (booking/token system)
-- Bank manually confirms via "Mark as Donated" -> status = completed
-- ---------------------------------------------------------
CREATE TABLE donor_appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    donor_id INT NOT NULL,
    blood_bank_id INT NOT NULL,
    token_number VARCHAR(30) NOT NULL UNIQUE,
    appointment_time DATETIME NOT NULL,
    weight_kg DECIMAL(5,2) NULL,
    height_cm DECIMAL(5,2) NULL,
    has_chronic_illness BOOLEAN DEFAULT FALSE,
    illness_details VARCHAR(500) NULL,
    meets_weight_guideline BOOLEAN DEFAULT TRUE,
    status ENUM('pending','completed','missed','cancelled') DEFAULT 'pending',
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donor_id) REFERENCES donors(id),
    FOREIGN KEY (blood_bank_id) REFERENCES blood_banks(id),
    INDEX idx_bank_status (blood_bank_id, status)
);

-- ---------------------------------------------------------
-- 8. DONOR NUDGES (enforces "one request per user per donor appointment")
-- ---------------------------------------------------------
CREATE TABLE donor_nudges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    requester_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES donor_appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users(id),
    UNIQUE KEY uq_appointment_requester (appointment_id, requester_id)
);

-- ---------------------------------------------------------
-- 9. NOTIFICATIONS (email-based for now)
-- ---------------------------------------------------------
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('donation_request','request_status','low_stock','system') NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);