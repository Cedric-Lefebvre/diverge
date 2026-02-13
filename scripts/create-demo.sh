#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ORIGIN="$PROJECT_DIR/demo/origin"
DESTINATION="$PROJECT_DIR/demo/destination"

if [ -d "$PROJECT_DIR/demo" ]; then
  echo "Removing existing demo/ folder..."
  rm -rf "$PROJECT_DIR/demo"
fi

echo "Creating demo folders..."
mkdir -p "$ORIGIN/src" "$ORIGIN/k8s" "$DESTINATION/src" "$DESTINATION/k8s" "$DESTINATION/legacy"

# ─── docker-compose.yml (Different) ────────────────────────────────
cat > "$ORIGIN/docker-compose.yml" << 'EOF'
version: "3.8"

services:
  api:
    image: myapp/api:staging
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: staging
      DATABASE_URL: postgres://dev:dev@db:5432/myapp_staging
      LOG_LEVEL: debug
      ENABLE_SWAGGER: "true"
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: myapp_staging
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  worker:
    image: myapp/worker:staging
    environment:
      REDIS_URL: redis://redis:6379
      CONCURRENCY: "2"

volumes:
  pgdata:
EOF

cat > "$DESTINATION/docker-compose.yml" << 'EOF'
version: "3.8"

services:
  api:
    image: myapp/api:v2.4.1
    ports:
      - "80:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://app:${DB_PASSWORD}@db:5432/myapp
      LOG_LEVEL: warn
      ENABLE_SWAGGER: "false"
    depends_on:
      - db
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
          cpus: "0.5"

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}

  worker:
    image: myapp/worker:v2.4.1
    environment:
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      CONCURRENCY: "8"

volumes:
  pgdata:
EOF

# ─── src/main.rs (Different) ──────────────────────────────────────
cat > "$ORIGIN/src/main.rs" << 'EOF'
use std::net::TcpListener;

mod config;
mod handlers;
mod middleware;

fn main() {
    env_logger::Builder::from_env(
        env_logger::Env::default().default_filter_or("debug"),
    )
    .init();

    log::info!("Loading configuration...");
    let cfg = config::load().expect("Failed to load config");

    log::debug!("Config: {:?}", cfg);
    log::info!("Starting server on {}:{}", cfg.host, cfg.port);

    let listener = TcpListener::bind(format!("{}:{}", cfg.host, cfg.port))
        .expect("Failed to bind address");

    log::info!("Server listening on http://{}:{}", cfg.host, cfg.port);

    // TODO: remove before production
    println!("=== DEBUG: routes loaded ===");
    for route in handlers::routes() {
        println!("  {} {}", route.method, route.path);
    }

    handlers::serve(listener, cfg);
}
EOF

cat > "$DESTINATION/src/main.rs" << 'EOF'
use std::net::TcpListener;

mod config;
mod handlers;
mod middleware;

fn main() {
    env_logger::Builder::from_env(
        env_logger::Env::default().default_filter_or("warn"),
    )
    .init();

    let cfg = config::load().expect("Failed to load config");

    log::info!("Starting server on {}:{}", cfg.host, cfg.port);

    let listener = TcpListener::bind(format!("{}:{}", cfg.host, cfg.port))
        .expect("Failed to bind address");

    handlers::serve(listener, cfg);
}
EOF

# ─── src/config.ts (Different) ────────────────────────────────────
cat > "$ORIGIN/src/config.ts" << 'EOF'
export interface AppConfig {
  apiUrl: string;
  wsUrl: string;
  timeout: number;
  retries: number;
  features: {
    darkMode: boolean;
    analytics: boolean;
    betaFeatures: boolean;
  };
}

export const config: AppConfig = {
  apiUrl: "http://localhost:3000/api/v1",
  wsUrl: "ws://localhost:3000/ws",
  timeout: 30_000,
  retries: 1,
  features: {
    darkMode: true,
    analytics: false,
    betaFeatures: true,
  },
};
EOF

cat > "$DESTINATION/src/config.ts" << 'EOF'
export interface AppConfig {
  apiUrl: string;
  wsUrl: string;
  timeout: number;
  retries: number;
  features: {
    darkMode: boolean;
    analytics: boolean;
    betaFeatures: boolean;
  };
}

export const config: AppConfig = {
  apiUrl: "https://api.myapp.io/v1",
  wsUrl: "wss://api.myapp.io/ws",
  timeout: 10_000,
  retries: 3,
  features: {
    darkMode: true,
    analytics: true,
    betaFeatures: false,
  },
};
EOF

# ─── .env (Different) ─────────────────────────────────────────────
cat > "$ORIGIN/.env" << 'EOF'
# Staging environment
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=myapp_staging
DATABASE_USER=dev
DATABASE_PASSWORD=dev

REDIS_URL=redis://localhost:6379
SECRET_KEY=staging-secret-not-for-production
CORS_ORIGIN=http://localhost:5173
EOF

cat > "$DESTINATION/.env" << 'EOF'
# Production environment
DATABASE_HOST=db.internal.myapp.io
DATABASE_PORT=5432
DATABASE_NAME=myapp
DATABASE_USER=app
DATABASE_PASSWORD=${VAULT_DB_PASSWORD}

REDIS_URL=redis://:${VAULT_REDIS_PASSWORD}@redis.internal.myapp.io:6379
SECRET_KEY=${VAULT_SECRET_KEY}
CORS_ORIGIN=https://myapp.io
EOF

# ─── README.md (Different) ────────────────────────────────────────
cat > "$ORIGIN/README.md" << 'EOF'
# MyApp

A web application for managing tasks and projects.

## Getting Started

1. Clone the repository
2. Run `docker compose up`
3. Open http://localhost:3000

## Development

Run the dev server with hot reload:

```bash
cargo watch -x run
```

Enable debug logging:

```bash
RUST_LOG=debug cargo run
```

## API Docs

Swagger UI is available at http://localhost:3000/swagger when `ENABLE_SWAGGER=true`.
EOF

cat > "$DESTINATION/README.md" << 'EOF'
# MyApp

A web application for managing tasks and projects.

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in the values
3. Run `docker compose up -d`

## Deployment

Production deployments are handled via the CI/CD pipeline.
See `k8s/deployment.yaml` for the Kubernetes manifest.

## Monitoring

- Grafana: https://grafana.internal.myapp.io
- Logs: https://logs.internal.myapp.io
EOF

# ─── k8s/deployment.yaml (Different) ──────────────────────────────
cat > "$ORIGIN/k8s/deployment.yaml" << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-api
  namespace: staging
  labels:
    app: myapp
    env: staging
spec:
  replicas: 1
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
        env: staging
    spec:
      containers:
        - name: api
          image: myapp/api:staging
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "250m"
          env:
            - name: NODE_ENV
              value: "staging"
            - name: LOG_LEVEL
              value: "debug"
EOF

cat > "$DESTINATION/k8s/deployment.yaml" << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-api
  namespace: production
  labels:
    app: myapp
    env: production
spec:
  replicas: 5
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
        env: production
    spec:
      containers:
        - name: api
          image: myapp/api:v2.4.1
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          env:
            - name: NODE_ENV
              value: "production"
            - name: LOG_LEVEL
              value: "warn"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
EOF

# ─── deploy.sh (Only Origin) ──────────────────────────────────────
cat > "$ORIGIN/deploy.sh" << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

# Deploy to staging environment
echo "Deploying to staging..."

kubectl config use-context staging
kubectl apply -f k8s/deployment.yaml
kubectl rollout status deployment/myapp-api -n staging

echo "Staging deployment complete."
echo "Running smoke tests..."

curl -sf http://staging.myapp.internal/health || {
  echo "Health check failed!"
  exit 1
}

echo "All checks passed."
EOF
chmod +x "$ORIGIN/deploy.sh"

# ─── legacy/migrate.py (Only Destination) ─────────────────────────
cat > "$DESTINATION/legacy/migrate.py" << 'EOF'
"""Database migration script (deprecated).

This script was used for the initial migration from SQLite to PostgreSQL.
Kept for reference only — do not run in production.
"""

import sqlite3
import psycopg2
import sys


def migrate(sqlite_path: str, pg_dsn: str) -> None:
    src = sqlite3.connect(sqlite_path)
    dst = psycopg2.connect(pg_dsn)

    cursor = src.execute("SELECT id, name, email, created_at FROM users")
    rows = cursor.fetchall()

    with dst.cursor() as pg:
        for row in rows:
            pg.execute(
                "INSERT INTO users (id, name, email, created_at) VALUES (%s, %s, %s, %s)",
                row,
            )
    dst.commit()

    print(f"Migrated {len(rows)} users")
    src.close()
    dst.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <sqlite_path> <pg_dsn>")
        sys.exit(1)
    migrate(sys.argv[1], sys.argv[2])
EOF

# ─── Cargo.toml (Identical) ──────────────────────────────────────
CARGO_CONTENT='[package]
name = "myapp"
version = "2.4.1"
edition = "2021"
license = "MIT"
description = "Task and project management API"

[dependencies]
actix-web = "4"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres"] }
env_logger = "0.11"
log = "0.4"
'
echo "$CARGO_CONTENT" > "$ORIGIN/Cargo.toml"
echo "$CARGO_CONTENT" > "$DESTINATION/Cargo.toml"

# ─── src/utils.ts (Identical) ─────────────────────────────────────
UTILS_CONTENT='export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
'
echo "$UTILS_CONTENT" > "$ORIGIN/src/utils.ts"
echo "$UTILS_CONTENT" > "$DESTINATION/src/utils.ts"

echo "Demo folders created:"
echo "  Origin:      $ORIGIN"
echo "  Destination: $DESTINATION"
echo ""
echo "Files:"
(cd "$PROJECT_DIR/demo" && find . -type f | sort | while read -r f; do echo "  $f"; done)
