# Spoke Calculator

Custom spoke length calculator for **Scenic Routes Community Bicycle Center**.

## Features

- Spoke length calculator with rim and hub database
- User authentication with measurement attribution ("measured by John, June 2025")
- Reference database with common rims and hubs + your own measured components
- Printable build sheets for customers
- Build history

## Quick Start

### 1. Add your logo

Copy your logo to `frontend/public/logo.png`

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with a secure SECRET_KEY and DB_PASSWORD
```

### 3. Start with Docker

```bash
docker-compose up -d
```

### 4. Import reference data

```bash
docker-compose exec backend python scripts/import_freespoke.py
```

First run scrapes ~580 rims and ~720 hubs from Freespoke using Playwright (takes a few minutes). Subsequent runs skip scraping since data already exists. Use `--force-scrape` to refresh.

For additional data, use the Spocalc import (requires downloading the Excel file):
```bash
# Download spocalc-2022a.xlsm from https://www.sheldonbrown.com/rinard/spocalc.htm
# Place it in backend/scripts/
docker-compose exec backend python scripts/import_spocalc.py
```

### 5. Access the app

Open http://localhost:3333 (or https://spokecalc.i.scenicroutes.fm once tunnel is configured)

## Deployment

The app is deployed to `ScenicRoutesFM` server at `/opt/spoke-calc`.

### Deploy changes

```bash
./deploy.sh        # Pull and rebuild
./deploy.sh --build  # Full rebuild (no cache)
```

### Running commands on production

SSH into server and run docker-compose exec:

```bash
ssh ScenicRoutesFM
cd /opt/spoke-calc

# Import/refresh reference data
docker compose exec backend python scripts/import_freespoke.py

# Run database migrations
docker compose exec backend alembic upgrade head

# Check logs
docker compose logs -f backend

# Restart services
docker compose restart
```

### Initial server setup

1. Clone repo to `/opt/spoke-calc`
2. Copy logo file to `frontend/public/logo.png`
3. Create `.env` from `.env.example`
4. Run `docker compose up -d`
5. Import reference data (see above)
6. Configure Cloudflare tunnel to point to `localhost:3333`

## Tech Stack

- **Backend**: Python, FastAPI, PostgreSQL, SQLAlchemy
- **Frontend**: React, TypeScript, Tailwind CSS, React Query
- **Infrastructure**: Docker Compose, Nginx

## Port

**3333** - The app runs on port 3333

## API Endpoints

- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `GET /rims` - List rims
- `POST /rims` - Add rim (authenticated)
- `GET /hubs` - List hubs
- `POST /hubs` - Add hub (authenticated)
- `POST /calculate` - Calculate spoke lengths
- `GET /builds` - List builds (authenticated)
- `POST /builds` - Save build (authenticated)
