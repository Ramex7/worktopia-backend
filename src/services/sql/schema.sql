-- ============================================================================
-- WORKTOPIA SCHEMA — Complete LinkedIn-Style Professional Network
-- ============================================================================
-- Run via POST /install with x-setup-token header.
-- All tables are created atomically inside a transaction.
-- Optimized for MySQL 5.7+ / 8.0+
-- ============================================================================

-- 1. CORE IDENTITY & AUTHENTICATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(254)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,          -- Optimized: bcrypt hashes are exactly 60 chars; VARCHAR(255) is faster than TEXT
    role            ENUM('candidate', 'company') NOT NULL,
    refresh_token   TEXT          DEFAULT NULL,
    reset_token     VARCHAR(255)  DEFAULT NULL,
    reset_expires   DATETIME      DEFAULT NULL,
    created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- 2. PROFILES
-- ============================================================================

-- 2a. Candidate profiles
CREATE TABLE IF NOT EXISTS candidate_profiles (
    user_id             INT PRIMARY KEY,
    full_name           VARCHAR(100) NOT NULL,
    field               VARCHAR(100),
    headline            VARCHAR(255),
    bio                 TEXT,                -- short tagline / one-liner
    about               TEXT,                -- longer professional summary
    location            VARCHAR(100),
    years_of_experience INT DEFAULT 0,
    skills_json         JSON,
    profile_pic_url     VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_candidates_field (field),
    INDEX idx_candidates_location (location)
) ENGINE=InnoDB;

-- 2b. Company profiles
CREATE TABLE IF NOT EXISTS company_profiles (
    user_id         INT PRIMARY KEY,
    company_name    VARCHAR(150) NOT NULL,
    industry        VARCHAR(100),
    description     TEXT,
    location        VARCHAR(100),
    website_url     VARCHAR(255),
    logo_url        VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- 3. CANDIDATE SUB-DETAILS
-- ============================================================================

-- 3a. Work experience
CREATE TABLE IF NOT EXISTS candidate_experience (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    user_id   INT NOT NULL,
    role      VARCHAR(100) NOT NULL,         -- e.g. "Senior Product Designer"
    company   VARCHAR(100) NOT NULL,
    period    VARCHAR(50),                   -- e.g. "2023 - Present"
    summary   TEXT,                          -- bullet-point description of the role
    FOREIGN KEY (user_id) REFERENCES candidate_profiles(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3b. Education
CREATE TABLE IF NOT EXISTS candidate_education (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    user_id   INT NOT NULL,
    school    VARCHAR(150) NOT NULL,
    program   VARCHAR(150),                  -- e.g. "B.A. Design"
    period    VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES candidate_profiles(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3c. Certificates / Licenses
CREATE TABLE IF NOT EXISTS candidate_certificates (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    user_id   INT NOT NULL,
    name      VARCHAR(150) NOT NULL,         -- e.g. "Google UX Design Certificate"
    issuer    VARCHAR(150) NOT NULL,
    year      VARCHAR(10),
    FOREIGN KEY (user_id) REFERENCES candidate_profiles(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- 4. SOCIAL GRAPH (Connections)
-- ============================================================================
-- Uses GENERATED STORED columns so (A→B) and (B→A) collide on the same unique key.
CREATE TABLE IF NOT EXISTS connections (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    requester_id  INT NOT NULL,
    receiver_id   INT NOT NULL,
    small_id      INT GENERATED ALWAYS AS (LEAST(requester_id, receiver_id)) STORED,
    large_id      INT GENERATED ALWAYS AS (GREATEST(requester_id, receiver_id)) STORED,
    status        ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (requester_id <> receiver_id),
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_connection (small_id, large_id),
    INDEX idx_receiver_status (receiver_id, status)  -- Optimized: speeds up GET /connections/pending
) ENGINE=InnoDB;


-- 5. CONTENT (Posts & Reposts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS posts (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    parent_post_id  INT DEFAULT NULL,         -- NULL = original post; set = repost
    content         TEXT,
    image_url       VARCHAR(255),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_post_id) REFERENCES posts(id) ON DELETE SET NULL,
    INDEX idx_posts_user (user_id),
    INDEX idx_posts_created (created_at),
    INDEX idx_user_created (user_id, created_at)  -- Optimized: composite index for feed & profile post queries
) ENGINE=InnoDB;


-- 6. ENGAGEMENT (Likes & Comments)
-- ============================================================================

-- 6a. Likes (one per user per post)
CREATE TABLE IF NOT EXISTS post_likes (
    post_id     INT NOT NULL,
    user_id     INT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6b. Comments
CREATE TABLE IF NOT EXISTS post_comments (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    post_id       INT NOT NULL,
    user_id       INT NOT NULL,
    comment_text  TEXT NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_comments_post (post_id)
) ENGINE=InnoDB;


-- 7. JOBS & RECRUITMENT
-- ============================================================================

-- 7a. Job listings
CREATE TABLE IF NOT EXISTS jobs (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    company_id        INT NOT NULL,
    title             VARCHAR(150) NOT NULL,
    location          VARCHAR(100),
    work_mode         ENUM('Remote', 'Hybrid', 'On-site') NOT NULL,            -- Optimized: DB-enforced enum
    employment_type   ENUM('Full-time', 'Part-time', 'Internship') NOT NULL,   -- Optimized: DB-enforced enum
    level             ENUM('Junior', 'Mid', 'Senior', 'Intern') NOT NULL,      -- Optimized: DB-enforced enum
    field             VARCHAR(100),
    years_required    INT,
    summary           TEXT,                   -- short teaser
    overview          TEXT,                   -- longer description / about the role
    salary            VARCHAR(100),           -- e.g. "KES 280,000 - 360,000 / month"
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES company_profiles(user_id) ON DELETE CASCADE,
    INDEX idx_jobs_title (title),
    INDEX idx_jobs_field (field),
    INDEX idx_jobs_work_mode (work_mode),
    INDEX idx_jobs_level (level),
    INDEX idx_jobs_created (created_at),
    INDEX idx_work_level (work_mode, level)  -- Optimized: speeds up combined filter queries
) ENGINE=InnoDB;

-- 7b. Job responsibilities (one job → many bullet points)
CREATE TABLE IF NOT EXISTS job_responsibilities (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    job_id  INT NOT NULL,
    title   VARCHAR(150) NOT NULL,            -- e.g. "Own key flows"
    detail  TEXT,                             -- e.g. "Drive UX for search..."
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7c. Job requirements (one job → many bullet points)
CREATE TABLE IF NOT EXISTS job_requirements (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    job_id  INT NOT NULL,
    title   VARCHAR(150) NOT NULL,            -- e.g. "Experience"
    detail  TEXT,                             -- e.g. "5+ years designing..."
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7d. Job benefits (one job → many bullet points)
CREATE TABLE IF NOT EXISTS job_benefits (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    job_id  INT NOT NULL,
    title   VARCHAR(150) NOT NULL,            -- e.g. "Flexible schedule"
    detail  TEXT,                             -- e.g. "Hybrid work setup..."
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7e. Job applications
CREATE TABLE IF NOT EXISTS job_applications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    job_id      INT NOT NULL,
    user_id     INT NOT NULL,
    status      ENUM('applied', 'reviewed', 'shortlisted', 'rejected') DEFAULT 'applied',
    applied_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_job_user (job_id, user_id),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES candidate_profiles(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7f. Saved / bookmarked jobs
CREATE TABLE IF NOT EXISTS saved_jobs (
    user_id     INT NOT NULL,
    job_id      INT NOT NULL,
    saved_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, job_id),
    FOREIGN KEY (user_id) REFERENCES candidate_profiles(user_id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- 8. NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    sender_id   INT DEFAULT NULL,
    title       VARCHAR(255) NOT NULL,
    detail      TEXT,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- Optimized: tracks read status changes
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_notifications_user_read (user_id, is_read)
) ENGINE=InnoDB;


-- 9. MESSAGING
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    sender_id     INT NOT NULL,
    receiver_id   INT NOT NULL,
    message_text  TEXT NOT NULL,
    sent_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at       DATETIME DEFAULT NULL,
    FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_messages_receiver_read (receiver_id, read_at),
    INDEX idx_messages_sender (sender_id)
) ENGINE=InnoDB;