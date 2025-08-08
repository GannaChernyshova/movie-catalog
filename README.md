# Movie Catalog Service (Node.js)

A small REST API for managing and searching a catalog of movies. Built with Node.js, Express, and PostgreSQL. Tests run against real containers using Testcontainers. Docker Compose is provided for local development with Postgres and pgAdmin.

---

## What this service does

- Stores movies with title, director, genres, release year, and optional description
- Retrieves all movies (sorted by title)
- Searches movies by title or description (case-insensitive substring)
- Prevents duplicates by checking for the same combination of title + director

### Tech stack and tools
- **Runtime**: Node.js (CommonJS), Express
- **Database**: PostgreSQL (`pg`)
- **Config**: `dotenv` for environment variables
- **Containerization**: Docker, Docker Compose
- **DB UI**: pgAdmin (via Compose)
- **Testing**: Jest, Testcontainers (PostgreSQL, generic containers), axios

---

## API

Base URL: `http://localhost:3000`

- GET `/` – Health check; returns a simple string
- POST `/movies` – Add a new movie
- GET `/movies` – Get all movies (sorted by title)
- GET `/movies/search?q=...` – Search by title or description (case-insensitive)

### Movie object
```json
{
  "title": "string",
  "director": "string",
  "genres": ["string"],
  "releaseYear": 1234,
  "description": "string (optional)"
}
```

### Constraints
- Required: `title`, `director`, `genres`, `releaseYear`
- Optional: `description`
- Database enforces NOT NULL for required fields
- Service rejects duplicates for the same `(title, director)`

### Examples
- Create a movie
```bash
curl -X POST http://localhost:3000/movies \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Interstellar",
    "director": "Christopher Nolan",
    "genres": ["sci-fi"],
    "releaseYear": 2014,
    "description": "Space and time exploration"
  }'
```

- List movies
```bash
curl http://localhost:3000/movies
```

- Search movies
```bash
curl "http://localhost:3000/movies/search?q=matrix"
```

---

## Test levels and coverage

- Integration (service): tests in `tests/movies.test.js` exercise `MovieService` with a real Postgres container.
- End-to-end (API): tests in `tests/api.test.js` build/run the API container and verify HTTP behavior against a Postgres container using axios.

Tools: **Jest**, **@testcontainers/postgresql**, **testcontainers**.

Run tests (Docker daemon required):
```bash
npm test
```

Optional coverage report:
```bash
npm test -- --coverage
```

---

## Running the app

### Option A: Docker Compose (recommended)
Requires Docker Desktop running.

```bash
docker compose up --build
```

Services:
- `postgres` – Postgres 17, initialized with `dev/db/1-create-schema.sql`
- `pgadmin` – pgAdmin at `http://localhost:5050` (email: `pgadmin@mycomp.com`, password: `secret`)
- `app` – API at `http://localhost:3000`

Environment used by `app` (set in `compose.yaml`):
- `PGHOST=postgres`
- `PGPORT=5432`
- `PGDATABASE=catalog`
- `PGUSER=postgres`
- `PGPASSWORD=postgres`

### Option B: Run locally without Compose
Requires Node.js and a reachable Postgres instance with the schema applied.

1) Start Postgres yourself (pick one):
- Using Docker (example):
  ```bash
  docker run --name pg -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=catalog \
    -v "$(pwd)/dev/db:/docker-entrypoint-initdb.d" -d postgres:17.4
  ```
- Or use an existing Postgres; apply schema from `dev/db/1-create-schema.sql`.

2) Configure environment variables (via `.env` or shell):
```
PGHOST=localhost
PGPORT=5432
PGDATABASE=catalog
PGUSER=postgres
PGPASSWORD=postgres
```

3) Install deps and start:
```bash
npm ci
npm start
```

Server listens on `http://localhost:3000`.

### Option C: Build and run a single Docker image (without Compose)
```bash
# Build final image
docker build --target final -t movie-catalog:latest .

# Run container; point to your Postgres
docker run --rm -p 3000:3000 \
  -e PGHOST=host.docker.internal -e PGPORT=5432 \
  -e PGDATABASE=catalog -e PGUSER=postgres -e PGPASSWORD=postgres \
  movie-catalog:latest
```

---

## Development workflow

- Start in dev mode with hot reload (requires local Postgres env vars):
```bash
npm run dev
```

- Key files
  - `src/app.js` – Express app and routes
  - `src/services/MovieService.js` – Data access and business logic
  - `dev/db/1-create-schema.sql` – Database schema
  - `compose.yaml` – Compose stack (Postgres, pgAdmin, app)
  - `Dockerfile` – Multi-stage build (dev and final targets)

---

## Notes
- The search endpoint uses case-insensitive substring matching on `title` and `description` via SQL `ILIKE`.
- Duplicate detection is handled by the service (no unique index is created in the schema for `(title, director)`).
