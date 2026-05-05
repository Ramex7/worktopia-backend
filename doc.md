# Worktopia Backend Comprehensive Documentation

## Overview
Worktopia is a LinkedIn-like professional networking application built with Node.js, Express, and MySQL. The backend provides a complete professional social network with authentication, profiles, job listings, connections, posts, and notifications.

## Architecture
- **Technology Stack**: Node.js, Express.js, MySQL
- **Database**: MySQL with comprehensive schema for professional networking
- **Authentication**: JWT-based with access and refresh tokens
- **Security**: Helmet, rate limiting, input sanitization, XSS prevention
- **Structure**: MVC pattern with controllers, services, routes, and middleware

## Database Schema

### Core Tables
- **users**: Main user accounts with email, password hash, role, and tokens
- **candidate_profiles**: Detailed candidate profiles linked to users
- **company_profiles**: Company profiles linked to users
- **candidate_experience**: Work experience entries for candidates
- **candidate_education**: Educational background for candidates
- **candidate_certificates**: Certifications and licenses for candidates

### Social Features
- **connections**: Connection relationships between users
- **posts**: User-generated content with optional image
- **post_likes**: Like relationships between users and posts
- **post_comments**: Comments on posts

### Job Market
- **jobs**: Job listings with detailed information
- **job_responsibilities**: Job-specific responsibilities
- **job_requirements**: Job-specific requirements
- **job_benefits**: Job-specific benefits
- **job_applications**: Job application tracking
- **saved_jobs**: Saved job listings by users

### Engagement
- **notifications**: User notifications system
- **messages**: Private messaging between users

## API Endpoints

### Authentication Endpoints (`/api/auth`)

#### Register a New User
- **Endpoint**: `POST /api/auth/register`
- **Description**: Register a new user (candidate or company)
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123",
    "role": "candidate", // or "company"
    "full_name": "John Doe", // for candidates
    "company_name": "Company Name" // for companies
  }
  ```
- **Success Response** (201):
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "data": {
      "id": 1,
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
  ```
- **Error Responses**:
  - 400: Invalid input
  - 409: Email already registered
  - 500: Registration failed

#### Login
- **Endpoint**: `POST /api/auth/login`
- **Description**: Authenticate a user with email and password
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Success Response** (200):
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": 1,
        "email": "user@example.com",
        "role": "candidate",
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
  ```
- **Error Responses**:
  - 400: Invalid input
  - 404: No account found with this email
  - 401: Invalid credentials
  - 500: Login failed

#### Token Refresh
- **Endpoint**: `POST /api/auth/refresh`
- **Description**: Refresh an expired access token using a valid refresh token
- **Access**: Public (requires refresh token in body)
- **Request Body**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```
- **Success Response** (200):
  ```json
  {
    "success": true,
    "message": "Token refreshed successfully",
    "data": {
      "token": "new_access_token",
      "refreshToken": "new_refresh_token"
    }
  }
  ```
- **Error Responses**:
  - 400: Refresh token is required
  - 401: Invalid or expired refresh token
  - 500: Token refresh failed

#### Get Current User
- **Endpoint**: `GET /api/auth/me`
- **Description**: Get the currently authenticated user's basic information
- **Access**: Protected (requires valid access token)
- **Success Response** (200):
  ```json
  {
    "success": true,
    "message": "Authenticated user retrieved",
    "data": {
      "user": {
        "id": 1,
        "email": "user@example.com",
        "role": "candidate",
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z"
      }
    }
  }
  ```
- **Error Responses**:
  - 401: Access token is required for this request
  - 403: Invalid or expired token provided
  - 500: Failed to get user

#### Check Email Availability
- **Endpoint**: `GET /api/auth/check-email`
- **Description**: Check if an email is already registered
- **Access**: Public
- **Query Parameter**: `email=user@example.com`
- **Success Response** (200):
  ```json
  {
    "success": true,
    "data": {
      "email": "user@example.com",
      "available": false
    }
  }
  ```
- **Error Responses**:
  - 400: Email query parameter is required
  - 500: Failed to check email

### Candidate Endpoints (`/api/candidates`)

#### Get All Candidates
- **Endpoint**: `GET /api/candidates`
- **Description**: Get all candidates with pagination/filtering
- **Access**: Public
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - field: Filter by field
  - location: Filter by location
- **Success Response** (200):
  ```json
  {
    "success": true,
    "data": {
      "candidates": [...],
      "pagination": {
        "currentPage": 1,
        "totalPages": 5,
        "totalCandidates": 50,
        "hasNext": true,
        "hasPrevious": false
      }
    }
  }
  ```

#### Get Candidate by ID
- **Endpoint**: `GET /api/candidates/:id`
- **Description**: Get a specific candidate by ID
- **Access**: Public
- **Success Response** (200):
  ```json
  {
    "success": true,
    "data": {
      "candidate": {
        "id": 1,
        "full_name": "John Doe",
        "field": "Software Engineering",
        "headline": "Senior Developer",
        "bio": "Passionate developer",
        "about": "Detailed description...",
        "location": "San Francisco",
        "years_of_experience": 5,
        "skills_json": ["JavaScript", "React", "Node.js"],
        "profile_pic_url": "https://example.com/image.jpg",
        "experience": [...],
        "education": [...],
        "certificates": [...]
      }
    }
  }
  ```

#### Update Candidate Profile
- **Endpoint**: `PUT /api/candidates/profile`
- **Description**: Update candidate profile
- **Access**: Protected (candidate role only)
- **Request Body**:
  ```json
  {
    "full_name": "John Doe",
    "field": "Software Engineering",
    "headline": "Senior Developer",
    "bio": "Passionate developer",
    "about": "Detailed description...",
    "location": "San Francisco",
    "years_of_experience": 5,
    "skills_json": ["JavaScript", "React", "Node.js"],
    "profile_pic_url": "https://example.com/image.jpg"
  }
  ```
- **Success Response** (200):
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "data": {
      "candidate": { ... }
    }
  }
  ```

#### Experience Management
- **Add Experience**: `POST /api/candidates/experience`
- **Update Experience**: `PUT /api/candidates/experience/:id`
- **Delete Experience**: `DELETE /api/candidates/experience/:id`

#### Education Management
- **Add Education**: `POST /api/candidates/education`
- **Update Education**: `PUT /api/candidates/education/:id`
- **Delete Education**: `DELETE /api/candidates/education/:id`

#### Certificates Management
- **Add Certificate**: `POST /api/candidates/certificates`
- **Update Certificate**: `PUT /api/candidates/certificates/:id`
- **Delete Certificate**: `DELETE /api/candidates/certificates/:id`

### Company Endpoints (`/api/companies`)

#### Get All Companies
- **Endpoint**: `GET /api/companies`
- **Description**: Get all companies with pagination/search
- **Access**: Public

#### Get Company by ID
- **Endpoint**: `GET /api/companies/:id`
- **Description**: Get a specific company by ID
- **Access**: Public

#### Update Company Profile
- **Endpoint**: `PUT /api/companies/profile`
- **Description**: Update company profile
- **Access**: Protected (company role only)

### Job Endpoints (`/api/jobs`)

#### Get All Jobs
- **Endpoint**: `GET /api/jobs`
- **Description**: Get all jobs with filtering and pagination
- **Access**: Public
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `title`: Search by title
  - `location`: Filter by location
  - `work_mode`: Filter by work mode ("Remote", "Hybrid", "On-site")
  - `employment_type`: Filter by employment type
  - `level`: Filter by level ("Junior", "Mid", "Senior", "Intern")

#### Get Job by ID
- **Endpoint**: `GET /api/jobs/:id`
- **Description**: Get a specific job by ID
- **Access**: Public

#### Create Job
- **Endpoint**: `POST /api/jobs`
- **Description**: Create a new job listing
- **Access**: Protected (company role only)
- **Request Body**:
  ```json
  {
    "title": "Senior Software Engineer",
    "location": "San Francisco",
    "work_mode": "Remote",
    "employment_type": "Full-time",
    "level": "Senior",
    "field": "Engineering",
    "summary": "Exciting opportunity for experienced engineers",
    "overview": "Detailed job description...",
    "salary": "$120,000 - $150,000 / year",
    "years_required": 5,
    "responsibilities": [
      {
        "title": "Develop software",
        "detail": "Build and maintain applications"
      }
    ],
    "requirements": [
      {
        "title": "Experience",
        "detail": "5+ years of experience"
      }
    ],
    "benefits": [
      {
        "title": "Flexible schedule",
        "detail": "Work from anywhere"
      }
    ]
  }
  ```

#### Update Job
- **Endpoint**: `PUT /api/jobs/:id`
- **Description**: Update a job listing
- **Access**: Protected (company role only)

#### Delete Job
- **Endpoint**: `DELETE /api/jobs/:id`
- **Description**: Delete a job listing
- **Access**: Protected (company role only)

#### Apply to Job
- **Endpoint**: `POST /api/jobs/:id/apply`
- **Description**: Apply to a job
- **Access**: Protected (candidate role only)

#### Get Job Applicants
- **Endpoint**: `GET /api/jobs/:id/applicants`
- **Description**: Get job applicants
- **Access**: Protected (company role only)

#### Save/Unsave Job
- **Save Job**: `POST /api/jobs/:id/save`
- **Unsave Job**: `DELETE /api/jobs/:id/unsave`
- **Access**: Protected (candidate role only)

#### Get Saved Jobs
- **Endpoint**: `GET /api/jobs/saved`
- **Description**: Get saved jobs
- **Access**: Protected (candidate role only)

#### Manage Job Sub-resources
- **Responsibilities**: `POST/PUT/DELETE /api/jobs/:id/responsibilities`
- **Requirements**: `POST/PUT/DELETE /api/jobs/:id/requirements`
- **Benefits**: `POST/PUT/DELETE /api/jobs/:id/benefits`

### Notification Endpoints (`/api/notifications`)

#### Get User Notifications
- **Endpoint**: `GET /api/notifications`
- **Description**: Get user notifications
- **Access**: Protected (authenticated users)
- **Query Parameters**:
  - `read`: Filter by read status ("true"/"false", default: all)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)

#### Mark Notification as Read
- **Endpoint**: `PUT /api/notifications/:id/read`
- **Description**: Mark notification as read
- **Access**: Protected (authenticated users)

#### Mark All Notifications as Read
- **Endpoint**: `PUT /api/notifications/read-all`
- **Description**: Mark all notifications as read
- **Access**: Protected (authenticated users)

#### Delete Notification
- **Endpoint**: `DELETE /api/notifications/:id`
- **Description**: Delete notification
- **Access**: Protected (authenticated users)

### Connection Endpoints (`/api/connections`)

#### Send Connection Request
- **Endpoint**: `POST /api/connections/request/:userId`
- **Description**: Send connection request to a user
- **Access**: Protected (authenticated users)

#### Accept Connection Request
- **Endpoint**: `PUT /api/connections/accept/:userId`
- **Description**: Accept connection request from a user
- **Access**: Protected (authenticated users)

#### Reject Connection Request
- **Endpoint**: `DELETE /api/connections/reject/:userId`
- **Description**: Reject connection request from a user
- **Access**: Protected (authenticated users)

#### Remove Connection
- **Endpoint**: `DELETE /api/connections/remove/:userId`
- **Description**: Remove existing connection
- **Access**: Protected (authenticated users)

#### Get Pending Requests
- **Endpoint**: `GET /api/connections/pending`
- **Description**: Get pending connection requests
- **Access**: Protected (authenticated users)

#### Get All Connections
- **Endpoint**: `GET /api/connections`
- **Description**: Get all accepted connections
- **Access**: Protected (authenticated users)

### Post Endpoints (`/api/posts`)

#### Get All Posts
- **Endpoint**: `GET /api/posts`
- **Description**: Get all posts
- **Access**: Public

#### Get Feed
- **Endpoint**: `GET /api/posts/feed`
- **Description**: Get user's feed (posts from connections)
- **Access**: Protected (authenticated users)

#### Create Post
- **Endpoint**: `POST /api/posts`
- **Description**: Create a new post
- **Access**: Protected (authenticated users)
- **Request Body**:
  ```json
  {
    "content": "My exciting update!",
    "image_url": "https://example.com/image.jpg" // optional
  }
  ```

#### Get Post by ID
- **Endpoint**: `GET /api/posts/:id`
- **Description**: Get a specific post
- **Access**: Public

#### Delete Post
- **Endpoint**: `DELETE /api/posts/:id`
- **Description**: Delete a post
- **Access**: Protected (only post owner can delete)

#### Like/Unlike Post
- **Like Post**: `POST /api/posts/:id/like`
- **Unlike Post**: `DELETE /api/posts/:id/unlike`
- **Access**: Protected (authenticated users)

#### Comment on Post
- **Endpoint**: `POST /api/posts/:id/comments`
- **Description**: Comment on a post
- **Access**: Protected (authenticated users)
- **Request Body**:
  ```json
  {
    "comment_text": "Great post!"
  }
  ```

### Installation Endpoint (`/api/install`)

#### Install Database Schema
- **Endpoint**: `POST /api/install`
- **Description**: Install the database schema
- **Access**: Protected with setup token in header
- **Required Header**: `x-setup-token: your_setup_token`

## Authentication and Authorization

### Role-Based Access Control
- **Candidate**: Can manage their own profile, apply for jobs, save jobs, connect with others
- **Company**: Can manage their company profile, post jobs, view applicants
- **Both roles**: Can create posts, engage with content, manage notifications and connections

### Security Features
- **JWT Tokens**: Secure authentication with access and refresh tokens
- **Rate Limiting**: Protection against excessive requests
- **Input Validation**: Comprehensive validation of all inputs
- **XSS Protection**: Sanitization of HTML content
- **SQL Injection Prevention**: Parameterized queries throughout

## Response Format
All API responses follow a consistent format:
```json
{
  "success": true/false,
  "message": "Human-readable message",
  "data": { ... } // Contains response data when successful
}
```

## Error Handling
- **400**: Bad Request - Invalid input
- **401**: Unauthorized - Missing or invalid authentication
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource doesn't exist
- **409**: Conflict - Duplicate resource (e.g. email already registered)
- **500**: Internal Server Error - Unexpected server error

## Environment Configuration
Required environment variables:
```
PORT=3000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
ACCESS_TOKEN_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret
SETUP_TOKEN=your_setup_token_for_installing_schema
FRONTEND_URLS=http://localhost:19006,http://localhost:19007
SALT_ROUNDS=12
```

This comprehensive documentation covers all functionality of the Worktopia backend, including all API endpoints, request/response formats, and security considerations. The backend is designed for a complete professional networking experience with robust authentication, job market features, and social networking capabilities.