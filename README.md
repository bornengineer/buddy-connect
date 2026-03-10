# BuddyConnect — Friend-Only Messaging Social App

A full-stack social messaging application where users can only communicate with their friends. Built with CometChat for real-time messaging, featuring friend discovery, friend requests with real-time notifications, and a clean three-section interface.

**Live Demo:** [buddy-connect-client.vercel.app](https://buddy-connect-client.vercel.app)

---

## Tech Stack

| Layer        | Technology                                                                     |
| ------------ | ------------------------------------------------------------------------------ |
| Frontend     | React 18, TypeScript, Vite                                                     |
| Styling      | Tailwind CSS + custom CSS                                                      |
| Messaging UI | CometChat React UI Kit v6                                                      |
| Backend      | Node.js, Express 4, TypeScript                                                 |
| Database     | PostgreSQL (Supabase)                                                          |
| Validation   | Zod (server & client)                                                          |
| Auth         | JWT + bcrypt password hashing                                                  |
| Real-time    | Server-Sent Events (SSE) for friend requests, CometChat WebSocket for messages |

---

## Project Structure

```
├── package.json              # Monorepo root (npm workspaces)
├── README.md
├── server/
│   ├── src/
│   │   ├── index.ts          # Express app entry point, CORS, error handler
│   │   ├── config/env.ts     # Zod-validated environment config
│   │   ├── db/
│   │   │   ├── pool.ts       # PostgreSQL connection pool (SSL-aware)
│   │   │   └── migrate.ts    # Schema migration (users, friend_requests, friendships)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # JWT verification middleware
│   │   │   └── asyncHandler.ts      # Async error forwarding for Express 4
│   │   ├── routes/
│   │   │   ├── index.ts             # Route registration with auth guards
│   │   │   ├── auth.routes.ts       # POST /register, POST /login
│   │   │   ├── users.routes.ts      # GET /users, GET /users/friends
│   │   │   ├── friend-requests.routes.ts  # CRUD + SSE stream
│   │   │   └── chat.routes.ts       # CometChat token + can-message check
│   │   ├── services/
│   │   │   ├── auth.service.ts      # JWT sign/verify
│   │   │   ├── cometchat.service.ts # CometChat REST API integration
│   │   │   └── realtime.service.ts  # SSE client registry + push
│   │   └── types/express.d.ts       # Express Request augmentation
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── main.tsx          # React entry + StrictMode + Router
│   │   ├── App.tsx           # Route definitions with auth guards
│   │   ├── api/http.ts       # Axios instance with JWT interceptor
│   │   ├── hooks/
│   │   │   ├── useAuth.tsx   # Auth context (login, logout, isNewUser)
│   │   │   └── useCometChat.ts  # CometChat SDK initialization + auth
│   │   ├── lib/auth-storage.ts  # LocalStorage JWT persistence
│   │   ├── pages/
│   │   │   ├── AuthPage.tsx      # Login/Signup page
│   │   │   └── DashboardPage.tsx # Three-tab layout + SSE listener + badges
│   │   ├── components/
│   │   │   ├── AuthForm.tsx          # Form with validation + error display
│   │   │   ├── UsersPanel.tsx        # Discover users + send requests
│   │   │   ├── FriendRequestsPanel.tsx  # Accept/reject with real-time updates
│   │   │   └── ConversationsPanel.tsx   # CometChat UI Kit messaging
│   │   ├── types/api.ts      # Shared API response types
│   │   └── styles.css        # Full design system
│   └── .env.example
```

---

## Key Decisions

### Architecture

- **Monorepo with npm workspaces** — Single repo for both client and server, shared `npm install`, single `npm run dev` command with `concurrently`.
- **Express 4 with asyncHandler** — All async route handlers are wrapped in an `asyncHandler` utility to properly forward errors to Express's centralized error middleware, since Express 4 doesn't handle async rejections automatically.
- **Zod for validation** — Both environment config (`env.ts`) and request bodies are validated with Zod schemas, ensuring the app fails fast on invalid configuration.

### Authentication & Security

- **JWT-based auth** — Stateless tokens with 7-day expiry. Tokens signed server-side and stored client-side.
- **bcrypt password hashing** — 10 salt rounds, no plaintext passwords stored.
- **Same error for wrong email and wrong password** — Returns "Invalid credentials" for both cases to prevent user enumeration.
- **CORS allowlist** — Explicit origin allowlist via `CLIENT_ORIGIN` env var, not wildcard `*`.

### Friend-Only Messaging

- **Bidirectional friendship enforcement** — The `friendships` table stores both directions (`(A, B)` and `(B, A)`), making "is friend?" lookups a simple single-row check.
- **CometChat Friends API sync** — On friend request acceptance, the backend calls `addFriendsBidirectional()` to register the friendship on CometChat's side as well, enabling CometChat-level friend restrictions.
- **Frontend guard** — `ConversationsPanel` fetches the user's friend list and blocks conversation clicks with non-friends, showing a clear error message.
- **Backend guard** — `GET /api/chat/can-message/:targetUserId` verifies friendship server-side.

### Real-Time Updates

- **SSE for friend requests** — Server-Sent Events provide push notifications for `friend_request_received`, `friend_request_accepted`, `friend_request_rejected`, and `friendship_updated` events. Lighter than WebSockets for unidirectional server→client data.
- **CometChat SDK for messages** — The CometChat WebSocket handles real-time message delivery, typing indicators, and read receipts.
- **Sidebar badges** — Unread counts for friend requests and messages displayed on sidebar nav items, clearing when the user navigates to that tab.

### Database Design

- **Referential integrity** — All foreign keys have `ON DELETE CASCADE`, `CHECK` constraints prevent self-friendships, and `UNIQUE` constraints prevent duplicate requests.
- **Transaction safety** — Friend request acceptance uses `BEGIN/COMMIT/ROLLBACK` to atomically update the request status and create friendship records.
- **`updated_at` trigger** — PostgreSQL trigger automatically maintains `updated_at` on friend_requests.

### UX Decisions

- **New user routing** — First-time registrations are sent to the "Discover Users" tab to encourage friend discovery. Returning users land on "Conversations".
- **Client-side validation** — Inline field errors for name (min 2 chars, no email), email format, and password (min 6 chars), with backend error messages shown as fallback.
- **Skeleton loading states** — User cards and friend request cards show skeleton animations during loading for a polished feel.

---

## Setup & Run

### Prerequisites

- Node.js 18+
- PostgreSQL (local or [Supabase](https://supabase.com))

### 1. Clone & Install

```bash
git clone <repo-url>
cd comet-chat-messenger
npm install
```

### 2. Configure Environment

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Fill in your credentials:

- **Server `.env`**: Database URL, JWT secret, CometChat REST API credentials
- **Client `.env`**: Backend API URL, CometChat app ID/region/auth key

### 3. Run Database Migration

```bash
npm run db:migrate --workspace server
```

### 4. Start Development

```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:4000

---

## API Endpoints

| Method | Path                            | Auth | Description                               |
| ------ | ------------------------------- | ---- | ----------------------------------------- |
| POST   | `/api/auth/register`            | No   | Create account                            |
| POST   | `/api/auth/login`               | No   | Login                                     |
| GET    | `/api/users`                    | Yes  | List all users with friend/request status |
| GET    | `/api/users/friends`            | Yes  | List current user's friends               |
| POST   | `/api/friend-requests`          | Yes  | Send friend request                       |
| GET    | `/api/friend-requests/incoming` | Yes  | Get pending incoming requests             |
| PATCH  | `/api/friend-requests/:id`      | Yes  | Accept or reject a request                |
| GET    | `/api/friend-requests/stream`   | Yes  | SSE stream for real-time updates          |
| GET    | `/api/chat/token`               | Yes  | Get CometChat auth token                  |
| GET    | `/api/chat/can-message/:id`     | Yes  | Check if messaging is allowed             |

---

## Deployment

### Supabase (Database)

1. Create a Supabase project
2. Copy the **pooled** connection string
3. Run migration: `DATABASE_URL=<url> npm run db:migrate --workspace server`

### Render (Backend)

- Build: `npm install && npm run build --workspace server`
- Start: `npm run start --workspace server`
- Set env vars: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`, `COMETCHAT_*`

### Vercel (Frontend)

- Framework: Vite
- Root directory: `client`
- Set env vars: `VITE_API_URL`, `VITE_COMETCHAT_*`

---

## Security Trade-offs & Notes

| Item                                | Decision                                                       | Rationale                                                                                             |
| ----------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| JWT in SSE query param              | Token passed via `?token=` for EventSource (no header support) | EventSource API doesn't support custom headers. Token is short-lived (7d) and transmitted over HTTPS. |
| JWT in localStorage                 | Standard for SPAs; vulnerable to XSS                           | React escapes output by default, mitigating XSS. Production alternative: `httpOnly` cookies.          |
| CometChat Auth Key in client bundle | Required by CometChat UI Kit                                   | CometChat's design — actual auth uses server-generated auth tokens, not the auth key.                 |
| Parameterized SQL                   | All queries use `$1, $2` placeholders                          | Prevents SQL injection. No string concatenation in queries.                                           |

---

## If I Had More Time / Potential Improvements

### Security

- **Rate limiting** on auth endpoints (e.g., `express-rate-limit`) to prevent brute-force attacks
- **httpOnly cookie-based auth** instead of localStorage JWT to eliminate XSS token theft risk
- **CSRF protection** if switching to cookie-based auth
- **Helmet.js** for security headers (CSP, HSTS, X-Frame-Options)

### Features

- **Pagination** on the users list and conversations for better scalability
- **User profile photos** and profile editing
- **Block/unfriend functionality** to remove existing friendships
- **Push notifications** for mobile/desktop via Service Workers
- **Group messaging** support using CometChat group features
- **Message search** across conversations

### Code Quality

- **Unit and integration tests** using Vitest (client) and Jest/Supertest (server)
- **E2E tests** with Playwright for critical flows (register → send request → accept → chat)
- **API response types** shared between client and server (shared package in monorepo)
- **Database connection pooling** tuning for production load
- **Structured logging** (e.g., Pino) instead of `console.error`
- **CI/CD pipeline** with automated linting, testing, and deployment

### UX

- **Dark mode** toggle
- **Notification preferences** (mute conversations, DND mode)
