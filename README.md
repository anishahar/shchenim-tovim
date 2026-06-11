# שכנים טובים — Good Neighbors

A neighborhood help platform where residents post help requests, neighbors volunteer to help, chat in real time, and area managers oversee the community.

---

## Features

- **Help Requests** — post, browse, and filter requests by category, urgency, and distance radius; view them on a Google Map
- **Real-time Chat** — Socket.IO-powered messaging; one chat is created per request when a neighbor volunteers to help
- **Ratings** — request owners rate helpers after completing a request; top-rated helpers are displayed on the home page
- **Announcements** — area managers post community-wide announcements
- **Role-based Access Control** — three roles: `resident`, `house_committee`, `area_manager`; managers can block/unblock users and change roles
- **Image Upload** — profile photos and request images are uploaded to Cloudinary
- **Admin Dashboard** — area managers see all users, statistics, and management controls

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS, React Router, Axios, Socket.IO client, Google Maps |
| Backend | Node.js + Express + TypeScript, Socket.IO, JWT, bcrypt, Zod |
| Database | PostgreSQL via [Neon](https://neon.tech) (serverless) — `pg` driver |
| Media | Cloudinary |

---

## Project Structure

```
shchenim-tovim/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # Avatar, Navbar, Ratings modal, StatusBadge, UploadImage
│   │   ├── pages/
│   │   │   ├── requests/    # RequestsList, RequestDetail, CreateRequest
│   │   │   ├── chats/       # ChatList, ChatListItem, ChatRoom
│   │   │   └── announcments/
│   │   ├── App.tsx          # Router + protected routes
│   │   ├── AuthContext.tsx  # Auth state (JWT stored in localStorage)
│   │   ├── api.ts           # Axios instance (auto-attaches Bearer token)
│   │   └── socket.ts        # Socket.IO client instance
│   └── .env.example
├── server/                  # Express backend
│   ├── index.ts             # Entry point: Express + Socket.IO bootstrap
│   ├── db.ts                # pg Pool + CREATE TABLE IF NOT EXISTS schema
│   ├── routes.ts            # All API route registrations
│   ├── middleware.ts        # JWT auth middleware, role guards, error handler
│   ├── socket/
│   │   ├── socket.ts        # Socket.IO setup + chat room bootstrap on connect
│   │   └── chatEvents.ts    # send_message, first_request_message, first_message events
│   └── modules/
│       ├── auth/            # register, login, /me
│       ├── users/           # profile CRUD, block/unblock, role change
│       ├── requests/        # CRUD + distance-filtered list
│       ├── chats/           # chat list, messages, mark-as-read, refuse-help
│       ├── announcements/   # list, create
│       ├── ratings/         # save rating, average per user, top-5 leaderboard
│       └── upload/          # image upload to Cloudinary
├── lib/                     # Shared TypeScript types and constants (used by both client and server)
└── package.json             # Root — runs client + server concurrently
```

---

## Prerequisites

- **Node.js** v18+

That's it. All environment variables (database, API keys) are already committed to the repo. No additional accounts or configuration are needed.

---

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd shchenim-tovim

# Install root, client, and server dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### 2. Environment variables

Both `server/.env` and `client/.env` are included in the repository. No setup required.

For reference, the variables in use:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon (serverless Postgres) — hosted and ready |
| `JWT_SECRET` | Included |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | Included — used for image uploads |
| `VITE_API_URL` | `http://localhost:3001/api` |
| `VITE_SERVER_URL` | `http://localhost:3001` |
| `VITE_GOOGLE_MAPS_KEY` | Included — used for the map view |
| `VITE_GOOGLE_MAPS_KEY` | Your Google Maps JavaScript API key |

### 3. Database — automatic schema creation

**No manual SQL setup is needed.** When the server starts for the first time it runs `CREATE TABLE IF NOT EXISTS` for every table (`users`, `requests`, `chats`, `messages`, `announcements`, `ratings`) and creates all indexes automatically. Simply point `DATABASE_URL` at an empty (or existing) database and start the server.

### 4. Start the development servers

From the **project root**:

```bash
npm run dev
```

This starts both the client (http://localhost:5173) and the server (http://localhost:3001) concurrently.

Or start them individually:

```bash
npm run dev:client   # Vite dev server at http://localhost:5173
npm run dev:server   # tsx watch at http://localhost:3001
```

---

## Database

No setup needed. The app connects to a hosted Neon (serverless Postgres) database whose credentials are included in `server/.env`. The schema (all tables and indexes) is created automatically on first start via `CREATE TABLE IF NOT EXISTS`.

---

## API Endpoints

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Register a new resident |
| POST | `/login` | — | Log in, returns JWT |
| GET | `/me` | JWT | Get current user profile |

### Requests — `/api/requests`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | JWT | List nearby open requests (filtered by radius) |
| POST | `/` | JWT | Create a new help request |
| GET | `/my` | JWT | List your own non-completed requests |
| GET | `/:id` | JWT | Get a single request |
| PATCH | `/:id` | JWT | Update request (owner only) |
| DELETE | `/:id` | JWT | Delete request (owner only) |

### Chats — `/api/chats`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | JWT | List current user's chats |
| GET | `/:id/messages` | JWT | Get messages for a chat |
| PATCH | `/:id/mark-as-read` | JWT | Update last-read timestamp |
| PATCH | `/:id/refuse-help` | JWT | Request owner refuses the helper |
| DELETE | `/:id` | JWT | Delete a chat |

### Announcements — `/api/announcements`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | JWT | List announcements |
| POST | `/` | `area_manager` | Create announcement |

### Users — `/api/users`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | `area_manager` | List all users |
| GET | `/:id` | JWT | Get user profile |
| PATCH | `/:id` | JWT (own profile) | Update profile |
| PATCH | `/:id/block` | `area_manager` | Block user |
| PATCH | `/:id/unblock` | `area_manager` | Unblock user |
| PATCH | `/:id/role` | `area_manager` | Change user role |

### Ratings — `/api/ratings`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | JWT | Submit a rating (request owner only) |
| GET | `/average/:userId` | JWT | Get average rating for a user |
| GET | `/top` | — | Get top-5 rated helpers |

### Upload — `/api/upload`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/image` | JWT | Upload an image to Cloudinary |

### Socket.IO Events (client → server)
| Event | Payload | Description |
|-------|---------|-------------|
| `first_request_message` | `{ requestId, content }` | Volunteer to help; creates chat + sets request to `in_progress` |
| `first_message` | `{ otherUserId, content }` | Start a direct chat |
| `send_message` | `{ chatId, content }` | Send a message to an existing chat |
| `join_chat` | `chatId` | Join a chat room (used when navigating to ChatRoom) |

### Socket.IO Events (server → client)
| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `{ chatId, senderId, content, createdAt }` | Broadcast a new message to all room members |
| `bootstrap_error` | error code string | Fired if chat loading fails on connect |

---

## Roles

| Role | Permissions |
|------|-------------|
| `resident` | Post and respond to requests, chat, rate |
| `house_committee` | Same as resident (reserved for future expanded permissions) |
| `area_manager` | All of the above + manage users (block, unblock, change roles), post announcements |

---

## Security

- Passwords hashed with **bcrypt** (10 rounds)
- Authentication via **JWT** (7-day expiry), sent as `Authorization: Bearer <token>`
- All SQL uses parameterized queries (no SQL injection risk)
- CORS restricted to `CLIENT_URL`
- Role hierarchy enforced server-side on every protected endpoint
