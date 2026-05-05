# Worktopia Backend

This is the backend for Worktopia, a LinkedIn-like professional networking application built with Node.js, Express, and MySQL.

## Features

- **Authentication**: User registration, login, token refresh, and email verification
- **Profiles**: Candidate and company profile management
- **Jobs**: Job listings, applications, and saved jobs
- **Connections**: User connections with request/accept/reject flow
- **Posts**: Social feed with posts, comments, and likes
- **Notifications**: User notifications system
- **Security**: Input sanitization, password hashing, rate limiting, and authentication middleware

## Security Features

- **Helmet**: Adds security headers to responses
- **CORS**: Configured with specific allowed origins
- **Rate Limiting**: Limits requests per IP to prevent abuse
- **Input Sanitization**: Prevents XSS attacks by sanitizing input
- **Password Hashing**: Uses bcrypt to securely hash passwords
- **JWT Tokens**: Secure authentication with access and refresh tokens
- **SQL Injection Prevention**: Uses parameterized queries

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register a new user
- `POST /login` - Login with email and password
- `POST /refresh` - Refresh access token
- `GET /me` - Get current user info
- `GET /check-email` - Check if email is available

### Candidates (`/api/candidates`)
- `GET /` - Get all candidates with pagination/filtering
- `GET /:id` - Get a specific candidate
- `PUT /profile` - Update candidate profile
- `POST /experience` - Add work experience
- `PUT /experience/:id` - Update work experience
- `DELETE /experience/:id` - Delete work experience
- `POST /education` - Add education
- `PUT /education/:id` - Update education
- `DELETE /education/:id` - Delete education
- `POST /certificates` - Add certificate
- `PUT /certificates/:id` - Update certificate
- `DELETE /certificates/:id` - Delete certificate

### Companies (`/api/companies`)
- `GET /` - Get all companies with pagination/search
- `GET /:id` - Get a specific company
- `PUT /profile` - Update company profile

### Jobs (`/api/jobs`)
- `GET /` - Get all jobs with filtering and pagination
- `GET /:id` - Get a specific job
- `POST /` - Create a new job (companies only)
- `PUT /:id` - Update a job (companies only)
- `DELETE /:id` - Delete a job (companies only)
- `POST /:id/apply` - Apply to a job (candidates only)
- `GET /:id/applicants` - Get job applicants (companies only)
- `POST /:id/save` - Save a job (candidates only)
- `DELETE /:id/unsave` - Unsave a job (candidates only)
- `GET /saved` - Get saved jobs (candidates only)
- `POST /:id/responsibilities` - Add job responsibility (companies only)
- `PUT /responsibilities/:id` - Update job responsibility (companies only)
- `DELETE /responsibilities/:id` - Delete job responsibility (companies only)
- `POST /:id/requirements` - Add job requirement (companies only)
- `PUT /requirements/:id` - Update job requirement (companies only)
- `DELETE /requirements/:id` - Delete job requirement (companies only)
- `POST /:id/benefits` - Add job benefit (companies only)
- `PUT /benefits/:id` - Update job benefit (companies only)
- `DELETE /benefits/:id` - Delete job benefit (companies only)

### Notifications (`/api/notifications`)
- `GET /` - Get user notifications
- `PUT /:id/read` - Mark notification as read
- `PUT /read-all` - Mark all notifications as read
- `DELETE /:id` - Delete notification

### Connections (`/api/connections`)
- `POST /request/:userId` - Send connection request
- `PUT /accept/:userId` - Accept connection request
- `DELETE /reject/:userId` - Reject connection request
- `DELETE /remove/:userId` - Remove connection
- `GET /pending` - Get pending connection requests
- `GET /` - Get all connections

### Posts (`/api/posts`)
- `GET /` - Get all posts
- `GET /feed` - Get user's feed (posts from connections)
- `POST /` - Create a new post
- `GET /:id` - Get a specific post
- `DELETE /:id` - Delete a post
- `POST /:id/like` - Like a post
- `DELETE /:id/unlike` - Unlike a post
- `POST /:id/comments` - Comment on a post

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your `.env` file with the required environment variables
4. Set up your MySQL database
5. Run the installation endpoint to create the database schema: `POST /api/install` with the setup token
6. Start the server: `npm run dev`

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=your_db_name
ACCESS_TOKEN_SECRET=your_access_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_jwt_secret
ACCESS_TOKEN_LIFE=15m
REFRESH_TOKEN_LIFE=7d
SALT_ROUNDS=12
SETUP_TOKEN=your_setup_token_for_installing_schema
FRONTEND_URLS=http://localhost:19006,http://localhost:19007
```

### Database Schema

The database schema is located in `src/services/sql/schema.sql`. This includes tables for:
- Users (with authentication)
- Candidate and company profiles
- Job listings and applications
- Social features (posts, comments, likes, connections)
- Notifications
- Messaging

Run `POST /api/install` with the setup token to create the schema in your database.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)