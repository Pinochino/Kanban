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
Truoc khi chay lan dau, tao file env:

```powershell
cd deploy
Copy-Item .env.example .env
```

Cap nhat cac bien quan trong trong `deploy/.env`:
- POSTGRES_PASSWORD
- JWT_ACCESS_KEY

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
Trong compose da map theo bien env:
- SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/${POSTGRES_DB}
- SPRING_DATA_REDIS_HOST=redis
- SERVER_PORT=${SERVER_PORT}
- SERVER_SERVLET_CONTEXT_PATH=${SERVER_SERVLET_CONTEXT_PATH}

Database trong Docker network:
- Host: db
- Port: 5432
- DB name: ${POSTGRES_DB}
- User: ${POSTGRES_USER}

Database tu may host:
- Host: localhost
- Port: ${POSTGRES_PORT}
- DB name: ${POSTGRES_DB}
- User: ${POSTGRES_USER}

## 5. File lien quan
- `server/Dockerfile`
- `client/Dockerfile`
- `client/deploy/nginx.conf`
- `server/.dockerignore`
- `client/.dockerignore`
- `deploy/.env.example`

## 6. Lenh van hanh thuong dung
Khoi tao lai tu dau khi can reset du lieu:

```powershell
cd deploy
docker compose down -v
docker compose up --build -d
```

Theo doi trang thai dich vu:

```powershell
docker compose ps
docker compose logs -f db
docker compose logs -f server
```

## 7. Luu y production
- Doi mat khau DB, JWT key, mail secrets sang env file hoac secret manager
- Bat backup cho volume Postgres
- Dat reverse proxy (Nginx/Traefik) va SSL
