# Deployment Guide

## Overview

Complete production deployment for Laravel backend, Next.js web app, React Native mobile apps (via Expo EAS), and Python OR-Tools microservice.

---

## Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────┐
│           Cloudflare DNS + CDN + WAF                        │
│     (DDoS protection, caching, SSL termination)             │
└─────────────────────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────────────────────┐
│      Hetzner Cloud VPS (Ubuntu 24.04)                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────┐  │
│  │  Nginx  │  │ Laravel │  │ Next.js │  │  OR-Tools    │  │
│  │ (reverse│  │   API   │  │  (SSG)  │  │  Python      │  │
│  │  proxy) │  │  (PHP)  │  │ (static)│  │  Service     │  │
│  └─────────┘  └────┬────┘  └────┬────┘  └──────┬───────┘  │
│                    │            │               │          │
│            ┌───────┴────┐      │               │          │
│            │ PostgreSQL │      │               │          │
│            │  + PostGIS │      │               │          │
│            └────────────┘      │               │          │
│            ┌────────────┐      │               │          │
│            │   Redis    │      │               │          │
│            │ (queues)   │      │               │          │
│            └────────────┘      │               │          │
└─────────────────────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────────────────────┐
│     AWS S3 (backups + file storage + Next.js static)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Server Provisioning

### Recommended VPS Specs

| Component | Spec |
|-----------|------|
| VPS | Hetzner CPX31 (4 vCPU, 8 GB RAM, 160 GB NVMe) |
| Block Storage | 100 GB for backups/media |

### Initial Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
apt update && apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add deploy user
useradd -m -s /bin/bash deploy
usermod -aG docker deploy

# Install basic tools
apt install -y fail2ban ufw git vim htop

# Firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Install Node.js 20 (for Next.js build if needed)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Python 3.11 + pip (for OR-Tools)
apt install -y python3.11 python3.11-venv python3-pip
```

---

## 2. Docker Compose Configuration

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: transport-app
    working_dir: /var/www
    volumes:
      - ./backend:/var/www
      - ./php/local.ini:/usr/local/etc/php/conf.d/local.ini
    networks:
      - transport-network
    depends_on:
      - db
      - redis
    environment:
      - APP_ENV=production
      - APP_DEBUG=false

  nginx:
    image: nginx:alpine
    container_name: transport-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./backend:/var/www
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    networks:
      - transport-network
    depends_on:
      - app
      - nextjs
      - ortools

  nextjs:
    image: node:20-alpine
    container_name: transport-nextjs
    working_dir: /app
    volumes:
      - ./web:/app
    command: sh -c "npm ci && npm run build && npx serve@latest out -l 3000"
    networks:
      - transport-network
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.transportsystem.com

  ortools:
    build:
      context: ./optimization
      dockerfile: Dockerfile
    container_name: transport-ortools
    networks:
      - transport-network
    environment:
      - PORT=5000

  db:
    image: postgis/postgis:16-3.4-alpine
    container_name: transport-db
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./backups:/backups
    environment:
      POSTGRES_DB: transport_prod
      POSTGRES_USER: transport_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    networks:
      - transport-network

  redis:
    image: redis:7-alpine
    container_name: transport-redis
    volumes:
      - redis_data:/data
    networks:
      - transport-network

  queue-worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: transport-queue
    working_dir: /var/www
    volumes:
      - ./backend:/var/www
    networks:
      - transport-network
    depends_on:
      - db
      - redis
    command: php artisan queue:work --sleep=3 --tries=3 --max-time=3600
    restart: unless-stopped

  scheduler:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: transport-scheduler
    working_dir: /var/www
    volumes:
      - ./backend:/var/www
    networks:
      - transport-network
    depends_on:
      - db
      - redis
    command: sh -c "while [ true ]; do php artisan schedule:run --verbose --no-interaction; sleep 60; done"
    restart: unless-stopped

  certbot:
    image: certbot/certbot
    container_name: transport-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  db_data:
  redis_data:

networks:
  transport-network:
    driver: bridge
```

---

## 3. OR-Tools Microservice

### `optimization/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir flask ortools requests gunicorn

COPY app.py .

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

### `optimization/app.py` (Simplified)

```python
from flask import Flask, request, jsonify
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import requests

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/optimize', methods=['POST'])
def optimize():
    data = request.json
    stops = data['stops']
    
    # Build distance matrix using Google Distance Matrix API
    # or haversine formula for MVP
    
    # Solve TSP/VRP with OR-Tools
    manager = pywrapcp.RoutingIndexManager(len(stops), 1, 0)
    routing = pywrapcp.RoutingModel(manager)
    
    # ... routing logic ...
    
    solution = routing.SolveWithParameters(search_parameters)
    
    if solution:
        optimized_sequence = []
        index = routing.Start(0)
        while not routing.IsEnd(index):
            optimized_sequence.append(stops[manager.IndexToNode(index)])
            index = solution.Value(routing.NextVar(index))
        
        return jsonify({
            "success": True,
            "optimized_sequence": optimized_sequence,
            "original_distance": data.get('original_distance'),
            "optimized_distance": solution.ObjectiveValue()
        })
    
    return jsonify({"success": False, "error": "No solution found"}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

---

## 4. SSL Certificate Setup

```bash
# Initial certificate request
docker run -it --rm \
  -v /opt/transport-app/certbot/conf:/etc/letsencrypt \
  -v /opt/transport-app/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --standalone \
  --preferred-challenges http \
  -d api.transportsystem.com \
  -d app.transportsystem.com \
  -d transportsystem.com \
  --agree-tos \
  -m admin@transportsystem.com

# Start full stack
cd /opt/transport-app && docker compose up -d
```

---

## 5. Next.js Deployment

### Build Strategy
Next.js is built as a static export (`output: 'export'`) and served via Nginx alongside the Laravel API.

```javascript
// web/next.config.js
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;
```

### Deployment Script
```bash
#!/bin/bash
# deploy-web.sh

cd /opt/transport-app/web
npm ci
npm run build

# Nginx already serves from ./web/dist via volume mount
docker exec transport-nginx nginx -s reload
```

---

## 6. React Native + Expo Deployment

### Expo EAS Configuration

```json
// mobile/eas.json
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "enterpriseProvisioning": "adhoc"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "YOUR_APPLE_APP_ID",
        "ascTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### Build Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
cd mobile
eas build:configure

# Preview build (internal distribution)
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Production build (for App Store / Play Store)
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

### Environment Variables (mobile)
```bash
# mobile/.env.production
EXPO_PUBLIC_API_URL=https://api.transportsystem.com
EXPO_PUBLIC_WEBSOCKET_URL=wss://api.transportsystem.com/ws
EXPO_PUBLIC_MAPS_API_KEY=your_google_maps_key
EXPO_PUBLIC_FCM_SENDER_ID=your_fcm_sender_id
```

---

## 7. Environment Configuration

### `.env` (Production)

```bash
APP_NAME="K12 Transport"
APP_ENV=production
APP_KEY=base64:GENERATE_WITH_PHP_ARTISAN
APP_DEBUG=false
APP_URL=https://api.transportsystem.com
FRONTEND_URL=https://app.transportsystem.com

DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=transport_prod
DB_USERNAME=transport_user
DB_PASSWORD=STRONG_PASSWORD_HERE

REDIS_HOST=redis
REDIS_PORT=6379

QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
CACHE_DRIVER=redis

MAIL_MAILER=ses
MAIL_FROM_ADDRESS=noreply@transportsystem.com
MAIL_FROM_NAME="K12 Transport"
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_DEFAULT_REGION=us-east-1

TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+15551234567

FCM_SERVER_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

SAMSARA_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DIGA_TALK_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

OR_TOOLS_URL=http://ortools:5000
```

---

## 8. Database Backups

### `backups/scripts/backup.sh`

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
S3_BUCKET="s3://transport-backups-k12"
RETENTION_DAYS=30

# Create backup
docker exec transport-db pg_dump -U transport_user -d transport_prod | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Upload to S3
aws s3 cp "$BACKUP_DIR/backup_$DATE.sql.gz" $S3_BUCKET/daily/

# Clean old local backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

### Cron
```bash
0 2 * * * /opt/transport-app/backups/scripts/backup.sh >> /var/log/transport-backup.log 2>&1
```

---

## 9. Monitoring & Alerting

| Tool | Purpose |
|------|---------|
| Uptime Kuma (self-hosted) | API + website uptime |
| Laravel Horizon | Queue monitoring |
| Sentry (free tier) | Error tracking |
| Cloudflare Analytics | Traffic + security |

### Health Endpoints
- `GET /api/health` → Laravel app health
- `GET /health` → OR-Tools service health
- `GET /_next/static/...` → Next.js static asset check

---

## 10. CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with: { php-version: '8.3' }
      - run: |
          cd backend && composer install --no-dev
          php artisan test

  test-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: |
          cd web && npm ci && npm run build

  deploy-backend:
    needs: [test-backend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          source: "backend/,optimization/,nginx/,docker-compose.yml"
          target: "/opt/transport-app/"
      - uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/transport-app
            docker compose up -d --build
            docker exec transport-app php artisan migrate --force
            docker exec transport-app php artisan optimize

  deploy-web:
    needs: [test-web, deploy-backend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: |
          cd web && npm ci && npm run build
      - uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          source: "web/dist/"
          target: "/opt/transport-app/web/"
      - uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: docker exec transport-nginx nginx -s reload
```

---

## 11. App Store Publishing Checklist

### iOS (App Store Connect)
- [ ] Apple Developer Program enrollment
- [ ] App Store Connect app record
- [ ] Bundle IDs: `com.metrok12.transport.driver`, `com.metrok12.transport.parent`
- [ ] App icons (all required sizes)
- [ ] Launch screens
- [ ] Screenshots (iPhone + iPad)
- [ ] App Preview video (optional)
- [ ] Privacy policy URL
- [ ] App description, keywords, support URL
- [ ] Required permissions strings (Info.plist):
  - `NSLocationAlwaysUsageDescription`
  - `NSCameraUsageDescription`
  - `NSPhotoLibraryUsageDescription`

### Android (Google Play Console)
- [ ] Google Play Developer account
- [ ] App bundles (AAB) via EAS
- [ ] Google Service Account for EAS submit
- [ ] App signing key
- [ ] Store listing: description, screenshots, feature graphic
- [ ] Content rating questionnaire
- [ ] Privacy policy URL

---

*Version: 2.0 | Platforms: Web + iOS + Android + API | 2026-06-05*
