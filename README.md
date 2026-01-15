# Dashboard Application

A full-stack dashboard application with user authentication built using Node.js, Express, React, and PostgreSQL.

## Features

- User registration and login with username/password
- JWT-based authentication
- Protected dashboard with sidebar navigation
- Responsive design for mobile and desktop
- Modern, dark-themed UI

## Tech Stack

- **Frontend:** React 18, React Router v6
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (Docker)
- **Authentication:** JWT (JSON Web Tokens)

## Prerequisites

- Node.js (v16 or higher)
- Docker Desktop
- npm or yarn

## Quick Start

### 1. Start the PostgreSQL Database

```powershell
docker-compose up -d
```

This will start PostgreSQL on port **5433** (to avoid conflicts with any local PostgreSQL instance).

### 2. Install Dependencies

```powershell
# Install all dependencies (root, backend, and frontend)
npm run install:all
```

Or install individually:

```powershell
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the `backend` folder:

```powershell
cd backend
Copy-Item .env.example .env
```

The default values should work for local development.

### 4. Initialize the Database

```powershell
npm run db:init
```

Or:

```powershell
cd backend
npm run db:init
```

### 5. Start the Application

In two separate terminals:

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js      # PostgreSQL connection
│   │   ├── db/
│   │   │   └── init.js          # Database initialization
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT authentication
│   │   ├── routes/
│   │   │   └── auth.js          # Auth routes (login, register)
│   │   └── server.js            # Express server
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.css
│   │   │   ├── Dashboard.css
│   │   │   ├── Dashboard.js
│   │   │   ├── Login.js
│   │   │   ├── Modal.css
│   │   │   ├── Modal.js
│   │   │   └── Register.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── App.js
│   │   ├── index.css
│   │   └── index.js
│   └── package.json
├── docker-compose.yml
├── package.json
└── README.md
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user profile |
| GET | `/api/auth/verify` | Verify JWT token |

## Docker Commands

```powershell
# Start database
docker-compose up -d

# Stop database
docker-compose down

# View logs
docker-compose logs -f

# Reset database (removes all data)
docker-compose down -v
docker-compose up -d
```

## Troubleshooting

### Port Already in Use

If port 5433 is already in use, modify the port mapping in `docker-compose.yml`:

```yaml
ports:
  - "5434:5432"  # Change 5433 to another port
```

Then update `DB_PORT` in `backend/.env` accordingly.

### Database Connection Issues

1. Ensure Docker is running
2. Check if the container is up: `docker ps`
3. Verify the database credentials in `.env` match `docker-compose.yml`

## License

MIT

