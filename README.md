# aine-bmad-todo

Personal task manager built on Nuxt 4 with a server-backed SPA architecture, SQLite persistence, Drizzle migrations, Pinia state management, Zod validation, Vitest, and Playwright.

## Prerequisites

- Node.js 20+
- npm

## Setup

Install dependencies and browser binaries:

```bash
npm install
npx playwright install
```

Create a local environment file from the example and adjust values if needed:

```bash
cp .env.example .env
```

## Database Foundation

Generate and apply migrations once schema tables are introduced in later stories:

```bash
npm run db:generate
npm run db:migrate
```

The local default SQLite path is `.data/aine-bmad-todo.sqlite`.

## Development

Start the Nuxt development server:

```bash
npm run dev
```

The app runs on `http://localhost:3000` by default.

## Health Endpoints

The app now exposes container-friendly health endpoints:

- `/api/health/live` for liveness checks
- `/api/health/ready` for readiness checks, including SQLite connectivity
- `/api/health` as an aggregate readiness-style summary

## Testing

Run unit tests:

```bash
npm run test:unit
```

Run Playwright smoke and end-to-end tests:

```bash
npm run test:e2e
```

## Build and Preview

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Docker

This project uses SQLite, so Docker orchestration only needs the app container plus mounted data volumes. There is no separate database container.

### Docker Compose

Copy the example env file if you have not already:

```bash
cp .env.example .env
```

The default `.env.example` enables the `dev` compose profile, so this starts the development container with source mounts, a persistent SQLite volume, automatic migrations, and a health check against `/api/health/ready`:

```bash
docker compose up --build
```

Start the dedicated test environment with the `test` compose profile:

```bash
docker compose --profile test up --build app-test
```

Check container health and inspect logs:

```bash
docker compose ps
docker compose logs -f app
docker compose --profile test logs -f app-test
```

Stop containers and remove volumes:

```bash
docker compose down -v
```

### Environment Variables

Local app runtime still uses `DATABASE_URL`, `APP_ENV`, `PLAYWRIGHT_BASE_URL`, and `HEALTHCHECK_PATH`.

Docker Compose uses a separate `COMPOSE_*` namespace so container settings do not interfere with the host-side Nuxt and Playwright defaults. The main variables are:

- `COMPOSE_PROFILES` to select `dev` or `test`
- `COMPOSE_APP_*` for the development container host, port, and SQLite path
- `COMPOSE_TEST_*` for the test profile host, port, and SQLite path
- `COMPOSE_RUN_DB_MIGRATIONS` to control startup migrations
- `COMPOSE_HEALTHCHECK_*` to control the container health probe

Build the application image:

```bash
docker build -t aine-bmad-todo .
```

Run it with a mounted SQLite volume:

```bash
docker run \
	--rm \
	-p 3000:3000 \
	-e DATABASE_URL=/data/aine-bmad-todo.sqlite \
	-e HEALTHCHECK_PATH=/api/health/ready \
	-e RUN_DB_MIGRATIONS=true \
	-v "$PWD/.data:/data" \
	aine-bmad-todo
```

The standalone image now runs migrations before startup and reports container health through the same `/api/health/ready` endpoint used by Docker Compose.
