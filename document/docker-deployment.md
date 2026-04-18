# Deploy Bang Docker Compose

## 1. Muc tieu
Chay full stack bang mot lenh:
- PostgreSQL
- Redis
- Spring Boot server
- React client (Nginx)

Compose file:
- `deploy/docker-compose.yml`

## 2. Chay he thong
Tu thu muc `deploy`:
```powershell
docker compose up --build -d
```

Xem trang thai:
```powershell
docker compose ps
```

Xem log:
```powershell
docker compose logs -f
```

Dung he thong:
```powershell
docker compose down
```

Dung va xoa volume:
```powershell
docker compose down -v
```

## 3. Port mapping
- Client: `http://localhost:4000`
- Server API: `http://localhost:9000/api`
- PostgreSQL: `localhost:5433`
- Redis: `localhost:6379`

## 4. Cau hinh quan trong
Trong compose da map:
- `SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/kanban`
- `SPRING_DATA_REDIS_HOST=redis`
- `SERVER_PORT=9000`
- `SERVER_SERVLET_CONTEXT_PATH=/api`

## 5. File lien quan
- `server/Dockerfile`
- `client/Dockerfile`
- `client/deploy/nginx.conf`
- `server/.dockerignore`
- `client/.dockerignore`

## 6. Luu y production
- Doi mat khau DB, JWT key, mail secrets sang env file hoac secret manager
- Bat backup cho volume Postgres
- Dat reverse proxy (Nginx/Traefik) va SSL
