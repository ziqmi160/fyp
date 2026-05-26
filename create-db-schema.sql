-- Create/use database
DROP DATABASE IF EXISTS fyp_management;
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

-- Phases
CREATE TABLE phases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name ENUM('CSP600', 'CSP650') NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Submissions
CREATE TABLE submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    supervisor_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    submission_type ENUM('proposal', 'progress_report', 'draft', 'final', 'F2', 'F3', 'F4', 'BMC', 'LMC', 'F6a', 'F6b', 'final_package') NOT NULL,
    description TEXT,
    external_link VARCHAR(500),
    status ENUM('pending', 'reviewed', 'approved', 'revision_required') DEFAULT 'pending',
    supervisor_feedback TEXT,
    submitted_at DATETIME NOT NULL,
    reviewed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id),
    INDEX idx_student_id (student_id),
    INDEX idx_supervisor_id (supervisor_id)
);

-- Submission Attachments
CREATE TABLE submission_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT NOT NULL,
    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    INDEX idx_submission_id (submission_id)
);

-- Presentation Sessions
CREATE TABLE presentation_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    session_type ENUM('proposal', 'progress', 'final') NOT NULL,
    phase ENUM('CSP600', 'CSP650') NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_created_by (created_by)
);

-- Presentation Slots
CREATE TABLE presentation_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    supervisor_id INT NOT NULL,
    examiner_id INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(100),
    status ENUM('scheduled', 'confirmed', 'completed', 'cancelled') DEFAULT 'scheduled',
    student_confirmed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES presentation_sessions(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id),
    FOREIGN KEY (examiner_id) REFERENCES users(id),
    INDEX idx_session_id (session_id),
    INDEX idx_student_id (student_id)
);

-- Presentation Schedules
CREATE TABLE presentation_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    presentation_date DATE NOT NULL,
    presentation_time TIME NOT NULL,
    venue VARCHAR(255) NOT NULL,
    phase ENUM('CSP600', 'CSP650') NOT NULL,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    INDEX idx_student_id (student_id)
);

-- Examiner Assignments
CREATE TABLE examiner_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    examiner_id INT NOT NULL,
    phase ENUM('CSP600', 'CSP650') NOT NULL,
    assignment_type ENUM('proposal', 'final') NOT NULL,
    assigned_by INT NOT NULL,
    status ENUM('active', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (examiner_id) REFERENCES users(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    INDEX idx_student_id (student_id),
    INDEX idx_examiner_id (examiner_id)
);

-- Evaluations
CREATE TABLE evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    evaluator_id INT NOT NULL,
    form_type ENUM('F7', 'F8', 'F9', 'F10', 'F11', 'F13') NOT NULL,
    phase ENUM('CSP600', 'CSP650') NOT NULL,
    rubric_scores JSON NOT NULL,
    total_score DECIMAL(5, 2) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (evaluator_id) REFERENCES users(id),
    INDEX idx_student_id (student_id),
    INDEX idx_evaluator_id (evaluator_id)
);

-- Evaluation Forms
CREATE TABLE evaluation_forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    evaluator_id INT NOT NULL,
    form_type ENUM('F7', 'F8', 'F9', 'F10', 'F11', 'F13') NOT NULL,
    phase ENUM('CSP600', 'CSP650') NOT NULL,
    scores JSON NOT NULL,
    total_score DECIMAL(5, 2),
    max_score DECIMAL(5, 2) NOT NULL,
    comments TEXT,
    recommendations TEXT,
    status ENUM('draft', 'submitted', 'approved') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (evaluator_id) REFERENCES users(id),
    INDEX idx_student_id (student_id),
    INDEX idx_evaluator_id (evaluator_id)
);

-- Amendments
CREATE TABLE amendments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    submission_id INT NOT NULL,
    evaluator_id INT NOT NULL,
    amendment_type ENUM('proposal', 'final_report') NOT NULL,
    original_feedback TEXT NOT NULL,
    amended_submission_id INT,
    f12_status ENUM('pending', 'examiner_approved', 'supervisor_approved', 'completed') DEFAULT 'pending',
    examiner_signature TEXT,
    supervisor_signature TEXT,
    examiner_signed_at DATETIME,
    supervisor_signed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (submission_id) REFERENCES submissions(id),
    FOREIGN KEY (evaluator_id) REFERENCES users(id),
    FOREIGN KEY (amended_submission_id) REFERENCES submissions(id),
    INDEX idx_student_id (student_id),
    INDEX idx_submission_id (submission_id)
);

-- Consultation Meetings
CREATE TABLE consultation_meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    supervisor_id INT NOT NULL,
    meeting_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue VARCHAR(255),
    meeting_type ENUM('proposal_discussion', 'progress_review', 'final_review', 'consultation') DEFAULT 'consultation',
    agenda TEXT,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    student_notes TEXT,
    supervisor_notes TEXT,
    outcome TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id),
    INDEX idx_student_id (student_id),
    INDEX idx_supervisor_id (supervisor_id)
);

-- Meeting Logs
CREATE TABLE meeting_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    supervisor_id INT NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_time TIME NOT NULL,
    location VARCHAR(255),
    agenda TEXT,
    student_notes TEXT,
    supervisor_notes TEXT,
    outcome TEXT,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_student_id (student_id),
    INDEX idx_supervisor_id (supervisor_id)
);

-- Notifications
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    related_id INT,
    related_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read)
);

-- Official Documents
CREATE TABLE official_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    supervisor_id INT,
    document_type ENUM('mutual_acceptance', 'progress_report_form', 'evaluation_form') NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id),
    INDEX idx_student_id (student_id)
);

-- Resource Library
CREATE TABLE resource_library (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    year INT,
    specialization VARCHAR(255),
    description TEXT,
    type ENUM('title', 'specialization') NOT NULL DEFAULT 'title',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_year (year)
);

-- Plagiarism Checks
CREATE TABLE plagiarism_checks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    student_id INT NOT NULL,
    report_file VARCHAR(500) NOT NULL,
    similarity_percentage DECIMAL(5, 2),
    status ENUM('pending', 'approved', 'flagged') DEFAULT 'pending',
    coordinator_notes TEXT,
    checked_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    INDEX idx_submission_id (submission_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status)
);

-- Ethical Approvals
CREATE TABLE ethical_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    required BOOLEAN DEFAULT FALSE,
    rec_form_file VARCHAR(500),
    status ENUM('not_required', 'pending', 'approved', 'waived') DEFAULT 'not_required',
    approval_date DATETIME,
    coordinator_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status)
);

-- Deliverables
CREATE TABLE deliverables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    student_id INT NOT NULL,
    type ENUM('report_pdf', 'report_docx', 'slides', 'poster', 'raw_data', 'system_files', 'apk_exe') NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    INDEX idx_submission_id (submission_id),
    INDEX idx_student_id (student_id)
);

-- Exhibitions
CREATE TABLE exhibitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    venue VARCHAR(255) NOT NULL,
    start_time TIME,
    end_time TIME,
    phase_id INT NOT NULL,
    coordinator_id INT NOT NULL,
    briefing_announced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (phase_id) REFERENCES phases(id),
    FOREIGN KEY (coordinator_id) REFERENCES users(id),
    INDEX idx_phase_id (phase_id)
);

-- Exhibition Attendance
CREATE TABLE exhibition_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exhibition_id INT NOT NULL,
    student_id INT NOT NULL,
    attended BOOLEAN DEFAULT FALSE,
    check_in_time DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exhibition_id) REFERENCES exhibitions(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    INDEX idx_exhibition_id (exhibition_id),
    INDEX idx_student_id (student_id),
    UNIQUE KEY unique_attendance (exhibition_id, student_id)
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
