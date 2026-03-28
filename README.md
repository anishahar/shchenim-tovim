# שכנים טובים (Good Neighbors)

A neighborhood help platform that enables neighbors to post and respond to help requests, communicate via real-time chat, view requests on a map, and share community announcements.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for client-side routing
- **Tailwind CSS** for styling
- **Axios** for API requests
- **Socket.io Client** for real-time chat

### Backend
- **Node.js** with Express and TypeScript
- **PostgreSQL** for database
- **Socket.io** for real-time communication
- **JWT** for authentication
- **bcrypt** for password hashing

## Project Structure

```
shchenim-tovim/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── App.tsx      # Router setup
│   │   ├── AuthContext.tsx
│   │   ├── api.ts       # Axios configuration
│   │   └── types.ts     # TypeScript types
│   └── package.json
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── db.ts            # Database configuration
│   ├── routes.ts        # API routes
│   ├── middleware.ts    # Auth middleware
│   ├── socket.ts        # Socket.io setup
│   └── package.json
└── package.json         # Root package
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### 1. Clone and Install Dependencies

```bash
# Install all dependencies (root, client, and server)
npm run install:all
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb shchenim_tovim

# Or using psql
psql -U postgres
CREATE DATABASE shchenim_tovim;
\q
```

### 3. Environment Variables

```bash
# Copy example env files
cp .env.example .env
cp client/.env.example client/.env
cp server/.env.example server/.env

# Edit .env files with your actual values
# - Update DATABASE_URL with your PostgreSQL credentials
# - Generate a secure JWT_SECRET
# - Add your Cloudinary credentials (if using image upload)
# - Add your Google Maps API key (if using map features)
```

### 4. Start Development Servers

```bash
# Start both client and server concurrently
npm run dev

# Or start individually:
npm run dev:client  # Client at http://localhost:5173
npm run dev:server  # Server at http://localhost:3001
```

## Features

### Current (MVP)
- ✅ User authentication (register/login)
- ✅ Protected routes with role-based access control
- ✅ REST API structure with TypeScript
- ✅ PostgreSQL database schema
- ✅ Real-time chat with Socket.io
- ✅ Frontend routing and navigation

### Coming Soon
- 🔄 Help request posting and browsing
- 🔄 Interactive map view with markers
- 🔄 Real-time chat implementation
- 🔄 Community announcements
- 🔄 User profiles with avatars
- 🔄 Admin dashboard
- 🔄 Image upload with Cloudinary
- 🔄 Notifications system

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Requests
- `GET /api/requests` - Get all requests (protected)
- `POST /api/requests` - Create request (protected)
- `GET /api/requests/:id` - Get single request (protected)
- `PATCH /api/requests/:id` - Update request (protected)
- `DELETE /api/requests/:id` - Delete request (protected)

### Chats
- `GET /api/chats` - Get user's chats (protected)
- `POST /api/chats` - Create new chat (protected)
- `GET /api/chats/:id/messages` - Get chat messages (protected)

### Announcements
- `GET /api/announcements` - Get all announcements (protected)
- `POST /api/announcements` - Create announcement (admin only)

### Users
- `GET /api/users/:id` - Get user profile (protected)
- `PATCH /api/users/:id` - Update user profile (protected)

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control (user/admin)
- CORS configuration
- Parameterized SQL queries (SQL injection protection)
- Environment variable protection
- Protected routes on frontend and backend

## Development

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## License

MIT
