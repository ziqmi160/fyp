CREATE USER 'haziq'@'localhost' IDENTIFIED BY 'klnmrt10f';
GRANT ALL PRIVILEGES ON *.* TO 'haziq'@'localhost';
FLUSH PRIVILEGES;

CREATE DATABASE fyp_management;
USE fyp_management;


-- Create tables
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'supervisor', 'coordinator') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE student_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    programme VARCHAR(100) NOT NULL,
    current_supervisor_id INT NULL,
    examiner_id INT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    project_title VARCHAR(255),
    project_description TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (current_supervisor_id) REFERENCES users(id),
    FOREIGN KEY (examiner_id) REFERENCES users(id)
);

CREATE TABLE supervisor_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    staff_id VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    specialization VARCHAR(255),
    max_students INT DEFAULT 5,
    current_students INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE supervision_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    supervisor_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_date TIMESTAMP NULL,
    notes TEXT,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id)
);

-- Insert dummy data

-- Users
INSERT INTO users (name, email, password, role) VALUES
('Ahmad Rahman', 'ahmad@student.edu.my', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('Sarah Lim', 'sarah@student.edu.my', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('Mohamed Ali', 'mohamed@student.edu.my', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('Dr. John Smith', 'john.smith@staff.edu.my', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor'),
('Dr. Jane Wilson', 'jane.wilson@staff.edu.my', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor'),
('Dr. Robert Chen', 'robert.chen@staff.edu.my', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor'),
('Admin User', 'admin@fyp.edu.my', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'coordinator');

-- Student Profiles
INSERT INTO student_profiles (user_id, student_id, programme, academic_year, semester, project_title, project_description) VALUES
(1, '2023001', 'Bachelor of Computer Science', '2023/2024', '2', 'AI-Powered Student Attendance System', 'A facial recognition system for automatic student attendance tracking'),
(2, '2023002', 'Bachelor of Computer Science', '2023/2024', '2', 'E-Commerce Platform for Local Artisans', 'An online marketplace for local artisans to sell their products'),
(3, '2023003', 'Bachelor of Software Engineering', '2023/2024', '2', 'Mobile Health Monitoring App', 'A mobile application for monitoring patient health metrics');

-- Supervisor Profiles
INSERT INTO supervisor_profiles (user_id, staff_id, department, specialization, max_students, current_students) VALUES
(4, 'STAFF001', 'Computer Science', 'Artificial Intelligence', 5, 2),
(5, 'STAFF002', 'Computer Science', 'Software Engineering', 4, 1),
(6, 'STAFF003', 'Software Engineering', 'Mobile Development', 5, 0);

-- Supervision Requests
INSERT INTO supervision_requests (student_id, supervisor_id, status, request_date, response_date, notes) VALUES
(1, 4, 'accepted', '2024-01-15 10:00:00', '2024-01-16 14:30:00', 'Student interested in AI projects'),
(2, 5, 'accepted', '2024-01-16 09:00:00', '2024-01-17 11:00:00', 'Good background in web development'),
(3, 4, 'pending', '2024-01-17 15:00:00', NULL, 'Looking for supervisor with mobile experience');

-- Update student profiles with assigned supervisors
UPDATE student_profiles SET current_supervisor_id = 4 WHERE user_id = 1;
UPDATE student_profiles SET current_supervisor_id = 5 WHERE user_id = 2;

-- Update supervisor current student count
UPDATE supervisor_profiles SET current_students = 2 WHERE user_id = 4;
UPDATE supervisor_profiles SET current_students = 1 WHERE user_id = 5;