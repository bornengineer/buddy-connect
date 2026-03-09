# Friend-Only Messaging Social App (CometChat)

Full-stack assignment implementation using:
- React + TypeScript + Tailwind (frontend)
- Node.js + Express + TypeScript (backend)
- PostgreSQL (data store)
- CometChat React UI Kit (messaging UI)

## Implemented Product Sections
- Users: discover users and send friend requests.
- Friend Requests: receive incoming requests in real-time (SSE), accept/reject.
- Conversations: CometChat React UI Kit chat interface.

## Key Rules Enforced
- Users must become friends before they can chat.
- Friend requests are required for relationship creation.
- Friendship is enforced in backend DB (`friendships` table).
- On acceptance, backend syncs friendship to CometChat via Friends API.
- CometChat auth token is created server-side and used by the client.

## Project Structure
- `server/`: Express API, auth, friend workflows, CometChat integration, DB migration.
- `client/`: React app with the three required sections and CometChat UI Kit.

## Setup
1. Create a PostgreSQL database (local Postgres or Supabase).
2. Copy env files:
   - `cp server/.env.example server/.env`
   - `cp client/.env.example client/.env`
3. Fill CometChat credentials from dashboard.

## Install and Run
From repo root:
```bash
npm install
npm run db:migrate --workspace server
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:4000`

## API Summary
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users`
- `GET /api/users/friends`
- `POST /api/friend-requests`
- `GET /api/friend-requests/incoming`
- `PATCH /api/friend-requests/:requestId`
- `GET /api/friend-requests/stream?token=<jwt>` (SSE)
- `GET /api/chat/token`
- `GET /api/chat/can-message/:targetUserId`

## Notes
- Real-time friend request updates use backend SSE.
- Messaging UI is CometChat React UI Kit (`CometChatMessageHeader`, `CometChatMessageList`, `CometChatMessageComposer`).
- Ensure CometChat app settings align with friend-only messaging policy.

## Deployment (Supabase + Render + Vercel)
Use Supabase as your single remote DB for both local dev and production.

### 1) Supabase
- Create a project in Supabase.
- Copy the Postgres connection string (prefer pooled connection string for app traffic).
- Ensure SSL is required (`sslmode=require` if included in URL).

### 2) Backend on Render
- Create a Render Web Service for `server`.
- Build command: `npm install && npm run build --workspace server`
- Start command: `npm run start --workspace server`
- Set env vars:
  - `PORT=4000`
  - `DATABASE_URL=<supabase_postgres_url>`
  - `DATABASE_SSL_MODE=require`
  - `DATABASE_SSL_REJECT_UNAUTHORIZED=false`
  - `JWT_SECRET=<strong_secret>`
  - `CLIENT_ORIGIN=https://<your-vercel-domain>`
  - `COMETCHAT_APP_ID=<...>`
  - `COMETCHAT_REGION=<...>`
  - `COMETCHAT_REST_API_KEY=<...>`
  - `COMETCHAT_AUTH_KEY=<...>`
- Run migration once against remote DB:
  - `npm run db:migrate --workspace server`

### 3) Frontend on Vercel
- Import the `client` project.
- Framework preset: Vite.
- Set env vars:
  - `VITE_API_URL=https://<your-render-service>.onrender.com`
  - `VITE_COMETCHAT_APP_ID=<...>`
  - `VITE_COMETCHAT_REGION=<...>`
  - `VITE_COMETCHAT_AUTH_KEY=<...>`

### 4) CORS for Vercel preview + prod (optional)
If you want both preview and production frontends to call the same backend, set:
- `CLIENT_ORIGIN=https://<prod-domain>,https://<preview-domain>`
