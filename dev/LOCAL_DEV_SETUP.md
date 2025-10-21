# CVAT Local Development Environment Setup (macOS)

Complete guide for setting up CVAT for local development on **macOS**.

## Prerequisites

### Required Software (macOS)

1. **Homebrew** (macOS Package Manager)

   ```bash
   # Install if not already installed
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   brew --version
   ```

2. **Git**

   ```bash
   brew install git
   git --version  # Should be 2.x+
   ```

3. **Python 3.11**

   ```bash
   brew install python@3.11
   python3 --version  # Should be 3.11.x
   ```

4. **Node.js 20.x** and **Yarn**

   ```bash
   brew install node@20 yarn
   node --version   # Should be v20.x
   yarn --version   # Should be 1.22.x
   ```

5. **Docker Desktop**

   ```bash
   # Download and install from:
   # https://www.docker.com/products/docker-desktop

   docker --version          # Should be 20.x+
   docker compose version    # Should be 2.x+
   ```

6. **FFmpeg** (for local Python development)
   ```bash
   brew install ffmpeg
   ffmpeg -version  # Will be 8.x (latest from Homebrew)
   ```

### System Dependencies (macOS)

Install all required system libraries:

```bash
brew install git python pyenv redis curl openssl node sqlite3 geos rust
```

## Understanding macOS FFmpeg Compatibility

### The Problem

macOS (via Homebrew) ships **FFmpeg 8.x** by default, but CVAT production uses **FFmpeg 4.3.1** with **PyAV 9.2.0**.

**PyAV 9.2.0 does not compile with FFmpeg 8.x on Python 3.11** due to Cython compatibility issues.

### Environment Comparison

**Production Environment (Docker):**

```
FFmpeg: 4.3.1 (compiled from source in Dockerfile)
PyAV: 9.2.0 (pinned in requirements.txt)
Python: 3.10
Status: ✅ Stable, tested for video decoding consistency
```

**macOS Development Environment:**

```
FFmpeg: 8.x (Homebrew default)
PyAV: 13.x+ (supports FFmpeg 8.x)
Python: 3.11
Status: ✅ Works for local development
```

### The Solution

We use `dev/requirements.macos.txt` to override incompatible package versions:

- PyAV 9.2.0 → 13.x+ (supports FFmpeg 8.x)
- numpy 1.22.2 → 1.23.5+ (supports Python 3.11)

### ⚠️ Important Warnings

1. **Video decoding differences may exist**

   - FFmpeg 4.x vs 8.x may decode videos slightly differently
   - Use Docker containers for testing video processing if exact consistency is critical

2. **Only use dev/requirements.macos.txt locally**

   - Do not commit package versions to production requirement files
   - Production uses carefully tested FFmpeg 4.3.1 + PyAV 9.2.0

3. **Production is safe**
   - Production `.in` and `.txt` files remain unchanged
   - Docker builds FFmpeg 4.3.1 from source
   - No risk to production deployments

## Step-by-Step Setup

### 1. Clone the Repository

```bash
cd ~/Projects/cotreat  # or your preferred location
git clone https://github.com/CoTreat/cvat.git
cd cvat
```

### 2. Create Python Virtual Environment

```bash
# Create virtual environment
python3 -m venv .env

# Activate it
source .env/bin/activate

# Upgrade pip and tools
pip install -U pip wheel setuptools
```

### 3. Install Python Dependencies

macOS with Homebrew uses FFmpeg 8.x, which requires PyAV 13.x+ (instead of the production PyAV 9.2.0):

```bash
pip install -r cvat/requirements/development.txt \
            -r dev/requirements.txt \
            -r dev/requirements.macos.txt
```

**Important:** The `dev/requirements.macos.txt` file overrides PyAV and numpy versions for macOS compatibility. Installing this file LAST ensures the macOS-compatible versions override the production-pinned versions.

See the "Understanding macOS FFmpeg Compatibility" section above for technical details.

#### Verify Installation:

```bash
python --version
# Expected: Python 3.11.x

pip show av numpy | grep -E "^(Name|Version):"
# Expected: av 13.x+ (e.g., 16.0.1), numpy 1.23.5+ (e.g., 1.26.4)
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
source .env/bin/activate

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
source .env/bin/activate
python setup_test_data.py
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
- API requests configured to proxy to `http://localhost:7000`

**Terminal 2 - Run Django Server:**

```bash
source .env/bin/activate

# Option 1: Using VS Code debugger (recommended)
code .  # Open in VS Code, then press F5 to start "server: debug"

# Option 2: Command line
python manage.py runserver 127.0.0.1:7000
```

This starts the Django backend on **http://localhost:7000**

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
│ - Configured with API_URL=http://localhost:7000             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ API requests (proxied)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Django Backend (Local Python Process)                       │
│ - Runs on localhost:7000                                    │
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
   - Makes API calls to `http://localhost:7000` (configured in `cvat-ui/package.json`)

2. **Backend (localhost:7000)**
   - Django runs as a local Python process
   - You can set breakpoints and debug in VS Code
   - Automatically reloads when you change Python files (unless using `--noreload`)

3. **Docker Services**
   - Only infrastructure runs in Docker (databases, message queues, workers)
   - Django connects to them via `localhost` ports exposed by Docker
   - Example: PostgreSQL at `localhost:5432`, Redis at `localhost:6379`

4. **Communication Flow:**
   ```
   Browser → localhost:3000 (Frontend) → localhost:7000 (Django) → localhost:5432 (PostgreSQL in Docker)
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
source .env/bin/activate

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
source .env/bin/activate
python manage.py migrate
python manage.py migrateredis
python manage.py collectstatic --noinput
python manage.py syncperiodicjobs

# Recreate test data
python setup_test_data.py
```

## Troubleshooting

### 1. Memory Issues (macOS Docker Desktop)

**Error:** `warning: 91 MB available RAM below 100 MB`

**Solution:** Increase Docker Desktop memory allocation

1. Open Docker Desktop → Settings → Resources → Advanced
2. Increase Memory slider from 8GB to **12GB or 16GB**
3. Click "Apply & Restart"

### 2. Port Conflicts (macOS AirPlay)

**Error:** Port 5000 or 7000 already in use

**Solution:** Disable AirPlay Receiver

- Go to: System Settings → General → AirDrop & Handoff
- **Uncheck** "AirPlay Receiver"

### 3. FFmpeg/PyAV Compilation Issues

**Error:** `av==9.2.0` fails to compile with errors about Cython or FFmpeg

**Solution:** Already handled by `dev/requirements.macos.txt`

- Ensure you installed with `-r dev/requirements.macos.txt` (step 3)
- This installs PyAV 13.x+ which is compatible with FFmpeg 8.x
- See `dev/README.macos.md` for technical details

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

## Testing

### Run Backend Tests

```bash
source .env/bin/activate
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
source .env/bin/activate
python manage.py <your-command>

# Compare outputs if critical
```

**Recommendation:** For video-specific features, always test in Docker before submitting PRs to ensure consistency with production.

## Useful Commands

### Django Management

```bash
source .env/bin/activate

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Django shell
python manage.py shell

# Create superuser
python manage.py createsuperuser

# Reset test data
python setup_test_data.py
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

After running `setup_test_data.py`:

| Username    | Password | Role(s)                       |
| ----------- | -------- | ----------------------------- |
| admin       | admin    | Superuser                     |
| owner1      | test123  | Owner in both orgs            |
| maintainer1 | test123  | Maintainer in Medical Imaging |
| supervisor1 | test123  | Supervisor in both orgs       |
| worker1     | test123  | Worker in both orgs           |
| worker2     | test123  | Worker in Auto Vehicles       |

## Project Structure

```
cvat/
├── cvat/                  # Django backend
│   ├── apps/             # Django applications
│   ├── settings/         # Settings (base, development, production)
│   └── requirements/     # Python dependencies
├── cvat-ui/              # React frontend
├── cvat-core/            # Core JavaScript library
├── cvat-canvas/          # Canvas rendering library
├── cvat-data/            # Data management library
├── dev/                  # Development tools and docs
│   ├── requirements.txt
│   ├── requirements.macos.txt
│   ├── LOCAL_DEV_SETUP.md (this file)
│   └── README.macos.md
├── docker-compose.yml    # Production Docker config
├── docker-compose.dev.yml # Development overrides
├── setup_test_data.py    # Test data creation script
└── manage.py             # Django management script
```

## Frequently Asked Questions (macOS)

### Why not downgrade FFmpeg to 4.x on macOS?

Modern Homebrew (post-2021) no longer easily supports installing FFmpeg 4.x. Additionally, PyAV 9.2.0 has Cython 3.x compatibility issues on Python 3.11, making downgrading not viable.

### Is using FFmpeg 8.x safe for development?

✅ **Yes**, for most development work. The PyAV 13.x + FFmpeg 8.x combination works well for general development.

⚠️ **However**, for video-specific features, test in Docker to ensure consistency with production FFmpeg 4.3.1 behavior.

### Can we upgrade production to FFmpeg 8.x?

Possible, but requires thorough testing for video decoding consistency. CVAT maintainers intentionally kept FFmpeg 4.x for stability (see original comment in `cvat/requirements/base.in`).

Any production upgrade would need:

1. Comprehensive video decoding tests across multiple formats
2. Comparison of annotation quality/accuracy
3. Performance benchmarking
4. Stakeholder approval

### Will my changes affect production?

No. Production is safe because:

1. ✅ Dockerfile compiles FFmpeg 4.3.1 from source (independent of local setup)
2. ✅ Production uses `requirements.txt` (pinned av==9.2.0)
3. ✅ `.in` files are NOT used in production builds
4. ✅ `dev/requirements.macos.txt` is only for local development

### What files handle macOS compatibility?

- **`dev/requirements.macos.txt`** - macOS-specific version overrides
- **`dev/LOCAL_DEV_SETUP.md`** - This complete setup guide
- **Production files unchanged:**
  - `cvat/requirements/base.in` (av==9.2.0, numpy~=1.22.2)
  - `cvat/requirements/base.txt` (pinned production versions)
  - `utils/dataset_manifest/requirements.in` and `.txt`

## Additional Resources

- **Official CVAT Docs:** https://docs.cvat.ai/
- **Contributing Guide:** https://github.com/cvat-ai/cvat/blob/develop/CONTRIBUTING.md
- **API Documentation:** http://localhost:8080/api/docs after starting CVAT

## Quick Reference Card

### Docker-Only Development (Production-like)
```bash
# Start all services
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Access CVAT
http://localhost:8080

# Stop services
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

### Hybrid Development (Debugging)
```bash
# Terminal 1: Start Docker infrastructure
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Terminal 2: Start Frontend (localhost:3000)
yarn run start:cvat-ui

# Terminal 3: Start Backend (localhost:7000)
source .env/bin/activate
code .  # Then press F5 for "server: debug"
# OR
python manage.py runserver 127.0.0.1:7000

# Access CVAT
http://localhost:3000  # Frontend → localhost:7000 (Django) → Docker (DB, Redis, etc.)
```

### Common Commands
```bash
# Full reset (removes all data)
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
# Then repeat setup from step 5

# Recreate test data
source .env/bin/activate
python setup_test_data.py

# View logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f cvat_server
```

---

**Last Updated:** 2025-01-21
**Platform:** macOS (tested on macOS Sequoia 15.x)
**CVAT Version:** 2.40.1 (CoTreat fork on branch: cotreat-deployment)
**Python:** 3.11.6
**Node.js:** 23.7.0
**FFmpeg:** 8.x (Homebrew)
