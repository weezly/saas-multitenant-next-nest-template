# Docker Setup für SaaS Multi-Tenant Projekt

Dieses Projekt kann mit Docker und Docker Compose lokal entwickelt werden.

## Voraussetzungen

- [Docker](https://www.docker.com/products/docker-desktop) installiert und laufend
- [Docker Compose](https://docs.docker.com/compose/) installiert (standardmäßig in Docker Desktop enthalten)

## Quick Start

### 1. PostgreSQL Container starten

```bash
# Alle Services starten (nur PostgreSQL ist standardmäßig aktiviert)
docker-compose up -d

# PostgreSQL-Logs anschauen
docker-compose logs -f postgres

# Verify database is healthy
docker-compose ps
```

### 2. Backend & Frontend lokal entwickeln

```bash
# Terminal 1: PostgreSQL läuft im Hintergrund
docker-compose up -d

# Terminal 2: Backend starten
cd apps/service
npm install
npm run start:dev

# Terminal 3: Frontend starten
cd apps/app
npm install
npm run dev
```

## Umgebungsvariablen

### Mit `.env.docker` laden

```bash
# PostgreSQL von .env.docker lädt die Konfiguration
export $(cat .env.docker | xargs)
docker-compose up -d
```

### Mit `.env` Datei überschreiben

```bash
# Backend (.env.local)
cp apps/service/.env.example apps/service/.env.local
# Anpassen: DATABASE_URL=postgresql://saas_user:saas_password_dev@localhost:5432/saas_db

# Frontend (.env.local)
cp apps/app/.env.example apps/app/.env.local
# Anpassen: NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Services aktivieren

### Option 1: Nur PostgreSQL (empfohlen für Entwicklung)

```bash
# Nur PostgreSQL starten
docker-compose up postgres

# oder im Hintergrund
docker-compose up -d postgres
```

### Option 2: Alle Services in Container (Production-ähnlich)

Uncomment die Services in `docker-compose.yml`:

```bash
# Dockerfile für Backend erstellen (falls nicht vorhanden)
cat > apps/service/Dockerfile << 'EOF'
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "start:prod"]
EOF

# Dockerfile für Frontend erstellen (falls nicht vorhanden)
cat > apps/app/Dockerfile << 'EOF'
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "start"]
EOF

# Services starten
docker-compose up -d
```

## Datenbank-Management

### Mit Docker verbundene Datenbankverbindung

```bash
# Mit psql in PostgreSQL-Container verbinden
docker-compose exec postgres psql -U saas_user -d saas_db

# Oder über localhost (wenn Port 5432 nicht lokal belegt ist)
psql -U saas_user -d saas_db -h localhost
```

### Datenbank zurücksetzen

```bash
# Volumes löschen (= Datenbank löschen)
docker-compose down -v

# Datenbank neu starten (leer)
docker-compose up -d postgres
```

### Datenbank migrieren (Prisma)

```bash
# Im Backend-Verzeichnis
cd apps/service

# Mit PostgreSQL läuft...
npm run prisma:migrate dev -- --name init
```

## Nützliche Commands

### Services verwalten

```bash
# Alle Services starten
docker-compose up -d

# Alle Services stoppen
docker-compose down

# Services stoppen und Volumes löschen (kompletter Reset)
docker-compose down -v

# Nur einen Service starten
docker-compose up -d postgres

# Service neu starten
docker-compose restart postgres

# Logs ansehen
docker-compose logs postgres
docker-compose logs -f postgres  # Follow mode

# Status überprüfen
docker-compose ps
```

### Container-Shell

```bash
# Shell in PostgreSQL-Container
docker-compose exec postgres bash

# SQL Shell
docker-compose exec postgres psql -U saas_user -d saas_db

# Backend-Container (falls aktiviert)
docker-compose exec service sh
```

### Image rebuilden

```bash
# Backend Image rebuild
docker-compose build service

# Alles rebuilden
docker-compose build
```

## Troubleshooting

### Port 5432 bereits in Gebrauch

```bash
# Anderen Port verwenden in docker-compose.yml
# Oder lokalen PostgreSQL Service stoppen
sudo systemctl stop postgresql  # Linux
brew services stop postgresql   # macOS
```

### Datenbank-Connection-Fehler

```bash
# Health-Status überprüfen
docker-compose ps

# Container-Logs ansehen
docker-compose logs postgres

# Container neu starten
docker-compose restart postgres
```

### Performance-Probleme

```bash
# Docker Ressourcen erhöhen
# Docker Desktop Settings > Resources:
# - CPUs: 4+
# - Memory: 4GB+
# - Disk: 20GB+
```

## Entwicklungs-Workflow

1. **PostgreSQL starten:**

   ```bash
   docker-compose up -d postgres
   ```

2. **Backend starten (lokal):**

   ```bash
   cd apps/service
   npm run start:dev
   ```

3. **Frontend starten (lokal):**

   ```bash
   cd apps/app
   npm run dev
   ```

4. **Database migrieren (falls nötig):**

   ```bash
   cd apps/service
   npm run prisma:migrate dev
   ```

5. **Testen unter http://localhost:3000**

## Production-ähnliches Setup

Für ein Production-ähnliches Setup alle Services in Container laufen lassen:

```bash
# docker-compose.yml anpassen (uncomment services)
docker-compose up -d

# oder
docker-compose up --build -d

# Logs
docker-compose logs -f
```

## Weitere Ressourcen

- [Docker Compose Dokumentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [NestJS Docker Setup](https://docs.nestjs.com/deployment/docker)
- [Next.js Docker Setup](https://nextjs.org/docs/deployment/docker)
