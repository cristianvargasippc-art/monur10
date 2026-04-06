-- ============================================================
-- MONUR-10: BASE DE DATOS COMPLETA
-- Modelo de Naciones Unidas Regional 10
-- ============================================================

CREATE DATABASE IF NOT EXISTS monur10_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE monur10_db;

-- ============================================================
-- TABLA: DISTRITOS
-- ============================================================
CREATE TABLE IF NOT EXISTS districts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO districts (code, name) VALUES
  ('10-01', 'Distrito Educativo 10-01'),
  ('10-02', 'Distrito Educativo 10-02'),
  ('10-03', 'Distrito Educativo 10-03'),
  ('10-04', 'Distrito Educativo 10-04'),
  ('10-05', 'Distrito Educativo 10-05'),
  ('10-06', 'Distrito Educativo 10-06'),
  ('10-07', 'Distrito Educativo 10-07')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================
-- TABLA: USUARIOS (Admins por Distrito + SGA Regional)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  role ENUM('sga_regional', 'district_admin') NOT NULL DEFAULT 'district_admin',
  district_id INT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL
);

-- Insertar usuario SGA Regional (password: monur10_sga)
INSERT INTO users (username, password_hash, full_name, email, role, district_id) VALUES
('sga_regional', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaWkalWHf6BvzPK8g7X5zM6Oa', 'SGA Regional 10', 'sga@regional10.edu.do', 'sga_regional', NULL)
ON DUPLICATE KEY UPDATE username = username;

-- Insertar admins por distrito (password por defecto: distrito + codigo, ej: distrito1001)
INSERT INTO users (username, password_hash, full_name, role, district_id) VALUES
('admin_1001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaWkalWHf6BvzPK8g7X5zM6Oa', 'Secretario Proyectos 10-01', 'district_admin', 1),
('admin_1002', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaWkalWHf6BvzPK8g7X5zM6Oa', 'Secretario Proyectos 10-02', 'district_admin', 2),
('admin_1003', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaWkalWHf6BvzPK8g7X5zM6Oa', 'Secretario Proyectos 10-03', 'district_admin', 3),
('admin_1004', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaWkalWHf6BvzPK8g7X5zM6Oa', 'Secretario Proyectos 10-04', 'district_admin', 4),
('admin_1005', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaWkalWHf6BvzPK8g7X5zM6Oa', 'Secretario Proyectos 10-05', 'district_admin', 5),
('admin_1006', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaWkalWHf6BvzPK8g7X5zM6Oa', 'Secretario Proyectos 10-06', 'district_admin', 6),
('admin_1007', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaWkalWHf6BvzPK8g7X5zM6Oa', 'Secretario Proyectos 10-07', 'district_admin', 7)
ON DUPLICATE KEY UPDATE username = username;

-- ============================================================
-- TABLA: COMISIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS commissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  country_assigned VARCHAR(100),
  max_delegates INT DEFAULT 20,
  whatsapp_link VARCHAR(500),
  district_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLA: PARTICIPANTES (Delegados)
-- ============================================================
CREATE TABLE IF NOT EXISTS participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(200) NOT NULL,
  educational_center VARCHAR(200),
  district_id INT NULL,
  commission_id INT NULL,
  country_assigned VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  check_in_status TINYINT(1) DEFAULT 0,
  check_in_time TIMESTAMP NULL,
  imported_batch VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL,
  FOREIGN KEY (commission_id) REFERENCES commissions(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLA: VOLUNTARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS volunteers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(200) NOT NULL,
  educational_center VARCHAR(200) NOT NULL,
  age INT,
  email VARCHAR(100),
  phone VARCHAR(20),
  gender ENUM('Masculino', 'Femenino', 'Otro') NOT NULL,
  district_id INT NULL,
  role_type ENUM('staff', 'mesa_directiva', 'general') DEFAULT 'general',
  commission_id INT NULL,
  check_in_status TINYINT(1) DEFAULT 0,
  check_in_time TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL,
  FOREIGN KEY (commission_id) REFERENCES commissions(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLA: INFORMES
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  district_id INT NOT NULL,
  user_id INT NOT NULL,
  report_type ENUM('logistics_report', 'tentative_agenda', 'final_model_report', 'delegations_approved') NOT NULL,
  title VARCHAR(200) NOT NULL,
  file_path VARCHAR(500),
  file_name VARCHAR(200),
  notes TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (district_id) REFERENCES districts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- TABLA: IMPORTACIONES EXCEL
-- ============================================================
CREATE TABLE IF NOT EXISTS excel_imports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  district_id INT,
  user_id INT,
  import_type ENUM('delegates', 'volunteers') NOT NULL,
  file_name VARCHAR(200),
  records_imported INT DEFAULT 0,
  imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (district_id) REFERENCES districts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- INDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_participants_district ON participants(district_id);
CREATE INDEX IF NOT EXISTS idx_participants_checkin ON participants(check_in_status);
CREATE INDEX IF NOT EXISTS idx_volunteers_district ON volunteers(district_id);
CREATE INDEX IF NOT EXISTS idx_reports_district ON reports(district_id);

SELECT 'Base de datos MONUR-10 creada exitosamente' AS mensaje;