# CVAT Local Development Environment Setup (macOS)

Complete guide for setting up CVAT for local development on **macOS**.

---

## 🚀 Quick Start

**Choose your development mode:**

<table>
<tr>
<td width="50%">

**🐳 Docker-Only Mode**
<br>_(Simplest, recommended for testing)_

```bash
# 1. Install software (see Prerequisites)
# 2. Run setup
make setup
make docker-only

# Access at http://localhost:8080
# Login: admin/admin
```

</td>
<td width="50%">

**⚡ Hybrid Mode**
<br>_(Recommended for active development)_

```bash
# 1. Install software (see Prerequisites)
# 2. Install dependencies
make install-backend
make install-frontend
make setup

# 3. Start dev servers (3 terminals)
make hybrid          # Terminal 1
make start-frontend  # Terminal 2
make start-backend   # Terminal 3

# Access at http://localhost:3000
# Login: admin/admin
```

</td>
</tr>
</table>

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Setup with Makefile](#quick-setup-with-makefile-recommended)
3. [Step-by-Step Setup (Manual)](#step-by-step-setup-manual)
4. [Development Workflows](#development-workflows)
5. [Troubleshooting](#troubleshooting)
6. [Testing](#testing)
7. [Makefile Reference](#makefile-reference)
8. [Quick Reference Card](#quick-reference-card)

---

## Prerequisites

### Required Software (macOS)

| Software                             | Installation Command                                                                              | Version Check / Notes                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Homebrew** (macOS Package Manager) | `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` | `brew --version`                                                                  |
| **Git**                              | `brew install git`                                                                                | `git --version` (Should be 2.x+)                                                  |
| **Python 3.10**                      | `brew install python@3.10 or use pyenv to install 3.10.x`                                         | `python3 --version` (Should be 3.10.x)                                            |
| **Node.js 20.x**                     | `brew install node@20 or use Volta to install 20.x`                                               | `node --version` (Should be v20.x)                                                |
| **Yarn**                             | `brew install yarn or use Volta to install yarn`                                                  | `yarn --version` (Should be 1.22.x)                                               |
| **Docker Desktop**                   | [Download from docker.com](https://www.docker.com/products/docker-desktop)                        | `docker --version` (Should be 20.x+)<br>`docker compose version` (Should be 2.x+) |
| **FFmpeg**                           | `brew install ffmpeg`                                                                             | `ffmpeg -version` (Will be 8.x from Homebrew)                                     |

### System Dependencies (macOS)

Install all required system libraries:

```bash
brew install redis curl openssl sqlite3 geos rust cmake pkg-config libxml2 libxslt
```

### ⚠️ Important: FFmpeg Compatibility on macOS

**The Challenge:**

- macOS Homebrew ships **FFmpeg 8.x**, but CVAT production uses **FFmpeg 4.3.1** with **PyAV 9.2.0**
- PyAV 9.2.0 does not compile with FFmpeg 8.x due to Cython compatibility issues

**The Solution:**

- For local macOS development, use **PyAV 13.x+** which supports FFmpeg 8.x
- Before installing dependencies, temporarily modify `utils/dataset_manifest/requirements.txt`:
  - Change `av==9.2.0` to `av>=13.0.0`
  - After installation, revert this change to avoid committing it

**For Production:**

- Docker containers use FFmpeg 4.3.1 + PyAV 9.2.0 (unchanged)
- For video-specific features, always test in Docker to ensure production consistency

## Quick Setup with Makefile (Recommended)

A Makefile is included to simplify common development tasks.

### Prerequisites

Before using the Makefile, ensure you have installed the required software from the table above.

### Setup Workflow

```bash
# Clone the repository
cd ~/Projects/cotreat
git clone https://github.com/CoTreat/cvat.git
cd cvat

# Option 1: Docker-only mode (simplest, no local dependencies)
make setup           # Starts Docker services, runs migrations, creates test data
make docker-only     # Shows access instructions
# → Access at http://localhost:8080

# Option 2: Hybrid development mode (for active development)
# 1. Install dependencies first
make install-backend   # Install Python dependencies
make install-frontend  # Install Node.js dependencies

# 2. Start Docker infrastructure
make setup

# 3. Start development servers (in separate terminals)
make hybrid            # Terminal 1: Shows next steps
make start-frontend    # Terminal 2: Frontend dev server
make start-backend     # Terminal 3: Django backend
# → Access at http://localhost:3000
```

### Available Make Commands

```bash
make help  # Show all available commands
```

**Most Common Commands:**

- `make install-backend` - Install Python dependencies
- `make install-frontend` - Install Node.js dependencies
- `make setup` - Start Docker services and initialize database
- `make docker-only` - Start Docker-only mode
- `make hybrid` - Start hybrid development mode
- `make start-frontend` - Start frontend dev server (auto-installs deps)
- `make start-backend` - Start Django backend (auto-installs deps)
- `make test` - Run all tests
- `make clean` - Clean temporary files
- `make reset` - Reset everything (removes all data)

See the [Makefile Reference](#makefile-reference) section below for all commands.

---

## Step-by-Step Setup (Manual)

If you prefer to understand each step or the Makefile doesn't work:

### 1. Clone the Repository

```bash
cd ~/Projects/cotreat  # or your preferred location
git clone https://github.com/CoTreat/cvat.git
cd cvat
```

### 2. Create Python Virtual Environment

```bash
# Create virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate

# Upgrade pip and tools
pip install -U pip wheel setuptools
```

### 3. Install Python Dependencies

macOS with Homebrew uses FFmpeg 8.x, which requires PyAV 13.x+ (instead of the production PyAV 9.2.0):

```bash
pip install -r cvat/requirements/development.txt \
            -r dev/requirements.txt \
```

### 4. Install Node.js Dependencies

```bash
yarn --frozen-lockfile
```

This installs all JavaScript packages for the UI workspaces:

- cvat-data
- cvat-core
- cvat-canvas
- cvat-canvas3d
- cvat-ui

Note: The `canvas` package may fail to build - this is optional and can be safely ignored.

### 5. Start Docker Services

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

This starts the following services:

- **Databases:** PostgreSQL (cvat_db), Redis (cvat_redis_inmem, cvat_redis_ondisk), ClickHouse
- **Core Services:** cvat_server, cvat_ui, cvat_opa (authorization)
- **Workers:** 8 background workers for various tasks
- **Infrastructure:** Traefik (reverse proxy), Grafana (monitoring), Vector (logging)

#### Verify Services are Running:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
```

All services should show "running" status. Wait for health checks to pass (may take 1-2 minutes).

### 6. Run Django Database Migrations

```bash
# Activate virtual environment if not already active
source .venv/bin/activate

# Run migrations
python manage.py migrate
python manage.py migrateredis

# Collect static files
python manage.py collectstatic --noinput

# Sync periodic jobs
python manage.py syncperiodicjobs
```

### 7. Create Superuser Account

```bash
# Method 1: Interactive (prompts for details)
python manage.py createsuperuser

# Method 2: Non-interactive (using Docker)
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec cvat_server \
  python manage.py createsuperuser --username admin --email admin@localhost --noinput

# Set password
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec cvat_server \
  python manage.py shell -c "from django.contrib.auth import get_user_model; \
  User = get_user_model(); u = User.objects.get(username='admin'); \
  u.set_password('admin'); u.save(); print('Password set')"
```

Default credentials: `admin` / `admin`

### 8. Create Test Data (Optional)

Create test organizations and users with different roles:

```bash
source .venv/bin/activate
python dev/setup_test_data.py
```

This creates:

- **1 superuser:** admin/admin
- **5 test users:** owner1, maintainer1, supervisor1, worker1, worker2 (all with password: test123)
- **2 organizations:**
  - Medical Imaging Team (med-imaging)
  - Autonomous Vehicles (auto-vehicles)

### 9. Access CVAT

#### Option A: Docker-Only (Production-like)

Access the UI at: **http://localhost:8080**

Login with:

- Username: `admin`
- Password: `admin`

Or use any test users: `owner1` / `test123`, etc.

#### Option B: Hybrid Development (Debugging)

For active development with hot-reload and debugging:

**Terminal 1 - Start UI Dev Server:**

```bash
yarn run start:cvat-ui
```

This starts the frontend on **http://localhost:3000** with:

- Webpack dev server with hot module reloading
- API requests configured to proxy to `http://localhost:8000`

**Terminal 2 - Run Django Server:**

```bash
source .venv/bin/activate

# Option 1: Using VS Code debugger (recommended)
code .  # Open in VS Code, then press F5 to start "server: debug"

# Option 2: Command line
python manage.py runserver 0.0.0.0:8000
```

This starts the Django backend on **http://localhost:8000**

### How Hybrid Development Works

In hybrid mode, the architecture is:

```
┌─────────────────────────────────────────────────────────────┐
│ Your Browser (http://localhost:3000)                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ UI requests
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Webpack Dev Server)                               │
│ - Runs on localhost:3000                                    │
│ - Hot module reload enabled                                 │
│ - Configured with API_URL=http://localhost:8000             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ API requests (proxied)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Django Backend (Local Python Process)                       │
│ - Runs on localhost:8000                                    │
│ - Debugger attached (VS Code)                               │
│ - Handles API requests from frontend                        │
│ - Connects to Docker infrastructure ──────┐                 │
└───────────────────────────────────────────┼─────────────────┘
                                            │
                                            ▼
                      ┌─────────────────────────────────┐
                      │ Docker Services (Infrastructure) │
                      │ - PostgreSQL (localhost:5432)    │
                      │ - Redis (localhost:6379)         │
                      │ - ClickHouse (localhost:8123)    │
                      │ - Worker containers              │
                      └──────────────────────────────────┘
```

**Key Points:**

1. **Frontend (localhost:3000)**

   - Served by webpack dev server
   - Automatically reloads when you change React/TypeScript files
   - Makes API calls to `http://localhost:8000` (configured in `cvat-ui/package.json`)

2. **Backend (localhost:8000)**

   - Django runs as a local Python process
   - You can set breakpoints and debug in VS Code
   - Automatically reloads when you change Python files (unless using `--noreload`)

3. **Docker Services**

   - Only infrastructure runs in Docker (databases, message queues, workers)
   - Django connects to them via `localhost` ports exposed by Docker
   - Example: PostgreSQL at `localhost:5432`, Redis at `localhost:6379`

4. **Communication Flow:**
   ```
   Browser → localhost:3000 (Frontend) → localhost:8000 (Django) → localhost:5432 (PostgreSQL in Docker)
   ```

**Contrast with Docker-Only Mode:**

In Docker-only mode (http://localhost:8080), everything runs in containers:

```
Browser → localhost:8080 (Traefik) → cvat_server container → cvat_db container
                                   ↓
                              cvat_ui container
```

## Development Workflows

### Daily Development

```bash
# 1. Ensure Docker services are running
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps

# 2. Activate Python environment
source .venv/bin/activate

# 3. Start development
# For backend: Open VS Code and press F5
# For frontend: yarn run start:cvat-ui
```

### Stopping Services

```bash
# Stop Docker services (preserves data)
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# Stop and remove all data
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

### Restarting After Changes

**Python code changes:**

- Restart Django server (VS Code debugger or Ctrl+C and rerun)

**Frontend code changes:**

- Hot-reload is automatic with `yarn run start:cvat-ui`

**Docker service changes:**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

### Database Reset

```bash
# Remove all data and start fresh
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# Re-run migrations and create superuser
source .venv/bin/activate
python manage.py migrate
python manage.py migrateredis
python manage.py collectstatic --noinput
python manage.py syncperiodicjobs

# Recreate test data
python dev/setup_test_data.py
```

## Troubleshooting

### 1. Memory Issues (macOS Docker Desktop)

**Error:** `warning: 91 MB available RAM below 100 MB`

**Solution:** Increase Docker Desktop memory allocation

1. Open Docker Desktop → Settings → Resources → Advanced
2. Increase Memory slider from 8GB to **12GB or 16GB**
3. Click "Apply & Restart"

### 2. Port 7000 Conflict with macOS AirPlay (Changed to 8000)

**Previous Issue:** Port 7000 was occupied by Apple's AirPlay service on macOS

**Solution (Implemented):** Hybrid development mode now uses **port 8000** instead

The following files have been updated to use port 8000:
- `Makefile` - Backend starts on `0.0.0.0:8000`
- `cvat-ui/package.json` - Frontend proxies to `http://localhost:8000`
- `.vscode/launch.json` - VS Code debugger uses `0.0.0.0:8000`

**Note:** This change **only affects local hybrid development**. Docker/production environments use port 8080 via Traefik and are not affected.

### 3. FFmpeg/PyAV Compilation Issues

**Error:** `av==9.2.0` fails to compile with errors about Cython or FFmpeg

**Solution:**

Temporarily override the av versions with `utils/dataset_manifest/requirements.txt` from `av==9.2.0` to `av>=13.0.0` before installing the dependencies.

### 4. Node Canvas Build Failure

**Error:** `node-pre-gyp` errors for `canvas` package during `yarn install`

**Solution:** Safe to ignore - this is optional

```
warning Error running install script for optional dependency:
"/Users/.../node_modules/canvas: Command failed..."
```

- The canvas package is marked as optional
- CVAT UI works perfectly without it

### 5. Redis Connection Errors

**Error:** `Connection refused to Redis` when running Django commands

**Solution:** Ensure Redis containers are running

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps | grep redis
# Should show cvat_redis_inmem and cvat_redis_ondisk as "running"
```

If not running, start Docker services:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 6. psycopg2 Loading Error (Hybrid Mode)

**Error:** `Error loading psycopg2 or psycopg module` when running Django backend locally

**Solution:** Install PostgreSQL libraries via Homebrew

This issue occurs on macOS when the PostgreSQL client libraries are not installed or not found by psycopg2-binary.

```bash
# Install PostgreSQL via Homebrew
brew install postgresql@14

# Activate virtual environment
source .venv/bin/activate

# Reinstall psycopg2-binary
pip uninstall psycopg2-binary psycopg2
pip install psycopg2-binary==2.9.5

# Verify installation
python -c "import psycopg2; print('psycopg2 loaded successfully')"
```

**Alternative (if binary still fails):** Compile from source with explicit paths:

```bash
# Install PostgreSQL development libraries
brew install postgresql@14

# Set environment variables for compilation
export LDFLAGS="-L/opt/homebrew/opt/postgresql@14/lib"
export CPPFLAGS="-I/opt/homebrew/opt/postgresql@14/include"

# Install from source
source .venv/bin/activate
pip uninstall psycopg2-binary
pip install psycopg2==2.9.5
```

**Note:** This only affects hybrid development mode. Docker-only mode is unaffected since PostgreSQL is included in the container.

### 7. GEOS Library Not Found (macOS Apple Silicon)

**Error:** `OSError: Could not find lib geos_c or load any of its variants ['/Library/Frameworks/GEOS.framework/Versions/Current/GEOS', '/opt/local/lib/libgeos_c.dylib', '/usr/local/lib/libgeos_c.dylib']`

**Solution:** Add Homebrew GEOS library path to Shapely's search paths

This issue occurs on Apple Silicon Macs where Homebrew installs libraries to `/opt/homebrew` instead of `/usr/local`.

```bash
# 1. Verify GEOS is installed
brew install geos

# 2. Find the geos.py file in your virtual environment
# Typical path: .venv/lib/python3.10/site-packages/shapely/geos.py

# 3. Edit the file and add the Homebrew path to alt_paths
# Find the line that defines alt_paths (around line 60-80) and add:
# '/opt/homebrew/opt/geos/lib/libgeos_c.dylib'

# Example:
# alt_paths = [
#     '/Library/Frameworks/GEOS.framework/Versions/Current/GEOS',
#     '/opt/local/lib/libgeos_c.dylib',
#     '/usr/local/lib/libgeos_c.dylib',
#     '/opt/homebrew/opt/geos/lib/libgeos_c.dylib',  # Add this line
# ]
```

**Quick fix command:**

```bash
# Activate virtual environment
source .venv/bin/activate

# Automatically add the path (macOS Apple Silicon)
GEOS_FILE=".venv/lib/python3.10/site-packages/shapely/geos.py"
if [ -f "$GEOS_FILE" ]; then
  if ! grep -q "/opt/homebrew/opt/geos/lib/libgeos_c.dylib" "$GEOS_FILE"; then
    sed -i '' "/\/usr\/local\/lib\/libgeos_c.dylib/a\\
    '/opt/homebrew/opt/geos/lib/libgeos_c.dylib',
" "$GEOS_FILE"
    echo "✓ Added Homebrew GEOS path to shapely/geos.py"
  else
    echo "✓ Homebrew GEOS path already present"
  fi
else
  echo "⚠️  geos.py not found. Install shapely first: pip install shapely"
fi
```

**Verify the fix:**

```bash
python -c "from shapely.geometry import Point; print('✓ Shapely/GEOS loaded successfully')"
```

**Note:** This only affects hybrid development mode on Apple Silicon Macs. Docker-only mode is unaffected since GEOS is included in the container.

## Testing

### Run Backend Tests

```bash
source .venv/bin/activate
pytest cvat/apps/engine/tests/
```

### Run Frontend Tests

```bash
cd cvat-ui
yarn test
```

### Run E2E Tests

See `tests/` directory for Cypress end-to-end tests.

### Testing Video Processing (macOS)

If you're working on video-related features and need to verify behavior matches production:

```bash
# Test in Docker (matches production FFmpeg 4.3.1)
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec cvat_server \
  python manage.py <your-command>

# Test locally (uses macOS FFmpeg 8.x)
source .venv/bin/activate
python manage.py <your-command>

# Compare outputs if critical
```

**Recommendation:** For video-specific features, always test in Docker before submitting PRs to ensure consistency with production.

## Useful Commands

### Django Management

```bash
source .venv/bin/activate

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Django shell
python manage.py shell

# Create superuser
python manage.py createsuperuser

# Reset test data
python dev/setup_test_data.py
```

### Docker Management

```bash
# View logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f cvat_server

# Execute command in container
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec cvat_server bash

# Restart specific service
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart cvat_server

# View resource usage
docker stats
```

### Git Workflow

```bash
# Check status
git status

# Stage files (excluding generated files)
git add .

# Commit
git commit -m "Your commit message"

# Push to remote
git push origin cotreat-deployment
```

## User Roles Reference

| Role           | Can Do                                            |
| -------------- | ------------------------------------------------- |
| **Superuser**  | Full system access, manage all organizations      |
| **Owner**      | Manage organization, members, projects, and tasks |
| **Maintainer** | Manage projects and tasks, cannot manage members  |
| **Supervisor** | Create tasks, assign work, review annotations     |
| **Worker**     | Annotate assigned tasks only                      |

## Test User Accounts

After running `dev/setup_test_data.py`:

| Username    | Password | Role(s)                       |
| ----------- | -------- | ----------------------------- |
| admin       | admin    | Superuser                     |
| owner1      | test123  | Owner in both orgs            |
| maintainer1 | test123  | Maintainer in Medical Imaging |
| supervisor1 | test123  | Supervisor in both orgs       |
| worker1     | test123  | Worker in both orgs           |
| worker2     | test123  | Worker in Auto Vehicles       |

Note: you will need to login as admin and activate the users (e.g. accept invitation to join the organization, and mark emails as verified)

## Project Structure

```
cvat/
├── cvat/                      # Django backend
│   ├── apps/                 # Django applications
│   ├── settings/             # Settings (base, development, production)
│   └── requirements/         # Python dependencies
├── cvat-ui/                  # React frontend
├── cvat-core/                # Core JavaScript library
├── cvat-canvas/              # Canvas rendering library
├── cvat-data/                # Data management library
├── dev/                      # Development tools and docs
│   ├── requirements.txt      # Development dependencies
│   ├── LOCAL_DEV_SETUP.md    # This file
│   └── setup_test_data.py    # Test data creation script
├── utils/                    # Utility scripts
│   └── dataset_manifest/
│       └── requirements.txt  # Dataset manifest dependencies (modify for macOS)
├── docker-compose.yml        # Production Docker config
├── docker-compose.dev.yml    # Development overrides
├── Makefile                  # Development automation
└── manage.py                 # Django management script
```

## Frequently Asked Questions (macOS)

### Why not downgrade FFmpeg to 4.x on macOS?

Modern Homebrew no longer supports FFmpeg 4.x, and PyAV 9.2.0 has Cython 3.x compatibility issues that make compilation fail even if FFmpeg 4.x was available.

### Is using FFmpeg 8.x safe for development?

✅ **Yes** for most development work. The PyAV 13.x + FFmpeg 8.x combination works well for general development tasks.

⚠️ **However**, for video-specific features, always test in Docker containers to ensure consistency with production FFmpeg 4.3.1 behavior.

### Will my changes affect production?

No. Production is completely isolated:

- Docker containers build FFmpeg 4.3.1 from source
- Production uses `cvat/requirements/base.txt` with PyAV 9.2.0
- Your local macOS setup only affects your development environment
- Just ensure you don't commit the temporary PyAV version changes

### What's the difference between Docker-only and Hybrid mode?

**Docker-only mode:**

- Everything runs in containers
- Simpler setup, no local Python/Node dependencies needed
- Access at http://localhost:8080
- Good for testing the full stack

**Hybrid mode:**

- Frontend and backend run locally with hot-reload
- Allows debugging with breakpoints
- Faster development iteration
- Access at http://localhost:3000
- Requires local Python and Node.js setup

## Makefile Reference

The Makefile provides convenient commands for all development tasks. Run `make help` to see all available commands.

### Initial Setup

```bash
make install-backend    # Install Python dependencies (creates .venv)
make install-frontend   # Install Node.js dependencies (yarn)
make setup              # Start Docker services + DB migrations + test data
```

### Development Modes

```bash
make docker-only        # Start Docker-only mode (http://localhost:8080)
make hybrid             # Start hybrid mode (shows next steps)
make start-frontend     # Start frontend dev server (http://localhost:3000, auto-installs deps)
make start-backend      # Start Django backend (http://localhost:8000, auto-installs deps)
make dev                # Alias for 'make hybrid'
```

### Docker Services

```bash
make start-docker       # Start Docker infrastructure
make stop               # Stop Docker services
make restart            # Restart Docker services
make logs               # View logs (Ctrl+C to exit)
make ps                 # Show service status
make rebuild            # Rebuild and restart Docker services
```

### Database Operations

```bash
make migrate            # Run database migrations (requires Python deps)
make superuser          # Create admin user via Docker (admin/admin)
make test-data          # Create test organizations and users (requires Python deps)
make shell              # Open Django shell (requires Python deps)
make db-shell           # Open PostgreSQL shell via Docker
make reset-db           # Reset database only (keeps code/dependencies)
```

### Testing

```bash
make test               # Run all tests (backend + frontend)
make test-backend       # Run Python tests (requires Python deps)
make test-frontend      # Run JavaScript tests (requires Node deps)
make test-video         # Compare Docker vs local video processing
make lint               # Run linters (Python + JavaScript)
make lint-fix           # Auto-fix linting issues
```

### Cleanup

```bash
make clean              # Clean temporary files and caches
make reset              # Reset everything (removes all data and .venv!)
```

### Utilities

```bash
make verify             # Show versions and installation status
make urls               # Show all service URLs
make update             # Update Docker services (pull + rebuild)
make git-status         # Show git status
make help               # Show all commands with descriptions
```

### Quick Workflows

```bash
make quick-start        # Docker + create admin (fastest way to start)
```

**Note:** Commands that require Python dependencies (`migrate`, `test-data`, `shell`, `test-backend`) assume you've run `make install-backend` first. Similarly, `start-frontend` and `start-backend` will automatically install their respective dependencies if needed.

## Quick Reference Card

### Using Makefile (Recommended)

**Docker-Only Mode (Simplest):**

```bash
make setup           # Start Docker + DB + test data
make docker-only     # Show access info
# → Access at http://localhost:8080 (admin/admin)
```

**Hybrid Development Mode (For Active Development):**

```bash
# One-time setup
make install-backend   # Install Python dependencies
make install-frontend  # Install Node.js dependencies
make setup             # Start Docker + DB + test data

# Daily development (3 terminals)
make hybrid            # Terminal 1: Shows instructions
make start-frontend    # Terminal 2: Frontend at :3000
make start-backend     # Terminal 3: Backend at :8000
# → Access at http://localhost:3000 (admin/admin)
```

**Common Operations:**

```bash
make test              # Run all tests
make logs              # View Docker logs
make stop              # Stop Docker services
make reset             # Reset everything (removes all data!)
make help              # Show all commands
```

### Manual Commands (Without Makefile)

**Docker-Only Development:**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
# → http://localhost:8080
```

**Hybrid Development:**

```bash
# Terminal 1: Docker infrastructure
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Terminal 2: Frontend
yarn run start:cvat-ui
# → http://localhost:3000

# Terminal 3: Backend
source .venv/bin/activate
python manage.py runserver 0.0.0.0:8000
# OR use VS Code: press F5
```

**Cleanup:**

```bash
# Stop services
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# Full reset
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

---

## Additional Resources

- **Official CVAT Docs:** https://docs.cvat.ai/
- **Contributing Guide:** https://github.com/cvat-ai/cvat/blob/develop/CONTRIBUTING.md
- **API Documentation:** http://localhost:8080/api/docs (after starting CVAT)

---

**Document Information:**

- **Last Updated:** 2025-01-22
- **Platform:** macOS (tested on macOS Sequoia 15.x)
- **CVAT Version:** 2.40.1 (CoTreat fork - branch: cotreat-deployment)
- **Python:** 3.10.x
- **Node.js:** 20.x
- **FFmpeg:** 8.x (Homebrew) for local development, 4.3.1 for production
