# Obsnote Cloud

Cloud-based notes application inspired by Obsidian fundamentals:

- Markdown notes with folder tree and search
- User login and per-user private vaults
- Admin account with user provisioning
- Admin monitoring panel with security and CRUD activity logs
- Note version restore (last 10 versions)

## Project Structure

- `server/`: Express + MongoDB API
- `client/`: Browser client (`index.html`, `styles.css`, `script.js`)
- `infra/`: Single-VPS deployment assets (Docker Compose + Nginx)

## Prerequisites

- Node.js 20+
- npm
- MongoDB 7+ (local or Docker)

## Local Development

1. Install server dependencies:

```bash
cd server
npm install
cp .env.example .env
```

2. Update `server/.env` (at minimum):

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CLIENT_ORIGIN` (for local, `http://localhost`)

3. Seed initial admin:

```bash
npm run seed:admin
```

4. Start the API server:

```bash
npm run dev
```

5. Open the client:

- Preferred: serve `client/` with Nginx via Docker (`infra/docker-compose.yml`)
- Alternative for quick local check: navigate directly to `http://localhost:4000` (server statically serves `client/`)

## Automated Tests

Integration tests are located in `server/tests/` and cover:

- auth lockout and forced password reset enforcement
- RBAC checks for admin-only endpoints
- note version retention (latest 10) and restore flows
- per-user note isolation (cross-user access blocked)

Run tests:

```bash
cd server
npm install
npm test
```

Run tests with enforced coverage thresholds:

```bash
cd server
npm install
npm run test:coverage
```

Current global thresholds:

- lines: 75%
- statements: 75%
- functions: 78%
- branches: 60%

Coverage output:

- terminal summary
- HTML report in `server/coverage/index.html`
- JSON summary in `server/coverage/coverage-summary.json`

## CI and Security Automation

GitHub Actions workflows:

- `CI` (`.github/workflows/ci.yml`)
  - runs on push/PR
  - executes `npm test` and `npm run test:coverage`
  - uploads coverage HTML as artifact
- `Security Audit` (`.github/workflows/security-audit.yml`)
  - runs weekly and on manual dispatch
  - generates production audit JSON (`--omit=dev`) and full audit JSON (dev+prod)
  - enforces `moderate+` failure policy for production dependencies
  - uploads both audit JSON files as artifacts

Dependabot is configured in `.github/dependabot.yml` for weekly npm updates in `server/`.

Run audit locally:

```bash
cd server
npm install
npm run audit:report
npm run audit:check
```

Optional full dependency audit (including dev tooling):

```bash
npm run audit:report:all
```

## Default Admin Workflow

1. Login as seeded admin.
2. Open `Admin` view.
3. Create new user account.
4. Share the returned temporary password with the user.
5. User must reset password at first login.

## API Highlights

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/force-reset-password`
- `GET /api/me`
- `GET/POST/PATCH/DELETE /api/folders`
- `GET/POST/GET:id/PATCH:id/DELETE:id /api/notes`
- `GET /api/notes/:id/versions`
- `POST /api/notes/:id/restore/:versionId`
- `GET /api/search`
- `POST /api/admin/users`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/status`
- `GET /api/admin/activity`
- `GET /api/admin/activity/summary`

## VPS Deployment (Docker)

1. Copy and configure environment:

```bash
cp server/.env.example server/.env
```

2. Set production values in `server/.env`:

- `NODE_ENV=production`
- `MONGODB_URI=mongodb://mongo:27017/obsnote`
- `CLIENT_ORIGIN=https://your-domain.example`
- `SECURE_COOKIES=true`
- strong JWT secrets and bootstrap admin credentials

3. Deploy:

```bash
cd infra
docker compose up -d --build
```

4. Seed admin inside running server container (only once):

```bash
docker compose exec server npm run seed:admin
```

## Security Baseline Included

- Helmet security headers
- Auth and admin rate limiting
- Account lockout after repeated failures
- HttpOnly refresh cookies
- Role-based API access control
- Activity log redaction for sensitive fields
