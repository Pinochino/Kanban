# Kanban

He thong quan ly cong viec theo mo hinh Trello/Kanban, gom backend Spring Boot va frontend React TypeScript.

## Muc luc
- Gioi thieu
- Tinh nang chinh
- Kien truc tong quan
- Cau truc thu muc
- Yeu cau he thong
- Chay local (khong docker)
- Chay full stack bang Docker Compose
- Bien moi truong va cau hinh quan trong
- API chinh
- Kiem tra chat luong code
- Troubleshooting nhanh
- Tai lieu bo sung

## Gioi thieu
Du an tap trung vao cac nghiep vu quan ly cong viec cho team:
- Quan ly nguoi dung va phan quyen
- Quan ly du an, board, task
- Notification cho admin va user
- Chat noi bo (1-1 va group)
- Dashboard thong ke tong quan

## Tinh nang chinh

### Auth va bao mat
- Dang ky, dang nhap, dang xuat, refresh token
- Bao ve route bang Spring Security + JWT
- Phan quyen role SUPER_ADMIN, ADMIN, USER

### User management
- Xem danh sach user co phan trang
- Cap nhat profile, avatar
- Lock/unlock user
- Soft delete/restore

### Project va Task
- Tao/xoa du an
- Quan ly board task theo trang thai
- Tim kiem task theo keyword, status, project, assigned user
- Cap nhat trang thai task

### Notification
- Admin tao notification theo channel
- User xem danh sach notification cua minh
- Danh dau da doc
- Retry notification email cho admin

### Chat
- Chat 1-1
- Tao nhom chat va nhan tin theo nhom
- Polling cap nhat noi dung

### Dashboard
- Tong so user/project/task
- So task chua hoan thanh
- Phan bo task theo trang thai

## Kien truc tong quan

### Backend
- Java 21
- Spring Boot
- Spring Data JPA
- Spring Security + OAuth2 Resource Server
- PostgreSQL
- Redis (token/cache theo cau hinh)
- Cloudinary (avatar)

### Frontend
- React 18 + TypeScript
- Vite
- TanStack Query
- Redux Toolkit + Persist
- TailwindCSS + shadcn/ui

### Van hanh
- Docker Compose cho full stack

## Cau truc thu muc

```text
Kanban/
  server/     # Spring Boot API
  client/     # React app
  deploy/     # Docker Compose
  document/   # Tai lieu chi tiet
```

## Yeu cau he thong
- JDK 21
- Node.js 20+
- pnpm
- Docker Desktop (neu chay compose)

## Chay local (khong docker)

### 1) Backend
Tu thu muc server:

```powershell
.\mvnw.cmd -q -DskipTests compile
.\mvnw.cmd spring-boot:run
```

Backend mac dinh:
- http://localhost:9000/api

### 2) Frontend
Tu thu muc client:

```powershell
pnpm install
pnpm dev
```

Frontend mac dinh:
- http://localhost:4000

## Chay full stack bang Docker Compose

Compose file dat tai:
- deploy/docker-compose.yml

Buoc 1: tao file env cho deploy:

```powershell
cd deploy
Copy-Item .env.example .env
```

Buoc 2: mo file `deploy/.env` va cap nhat it nhat:
- POSTGRES_PASSWORD
- JWT_ACCESS_KEY

Buoc 3: chay he thong:

Tu thu muc deploy:

```powershell
docker compose up --build -d
```

Xem log:

```powershell
docker compose logs -f
```

Dung he thong:

```powershell
docker compose down
```

Port mapping:
- Client: http://localhost:4000
- Server API: http://localhost:9000/api
- PostgreSQL: localhost:5433
- Redis: localhost:6379

Kiem tra nhanh sau khi chay:

```powershell
docker compose ps
docker compose logs -f server
```

## Bien moi truong va cau hinh quan trong

Cac gia tri mau dang nam trong:
- server/src/main/resources/application.properties

Khi deploy that, nen doi va quan ly an toan cac bien:
- spring.datasource.username
- spring.datasource.password
- JWT_ACCESS_KEY
- mail va cloudinary secrets

Khuyen nghi:
- Tach env cho dev, staging, production
- Khong commit secret that len repository

## API chinh
Base URL:
- http://localhost:9000/api

Nhom endpoint chinh:
- Auth: /auth/*
- Accounts: /accounts/*
- Projects: /projects/*
- Tasks: /tasks/*
- Notifications: /notifications/*
- Chat: /chats/*
- Dashboard: /dashboard/stats
- Labels: /labels/*
- Roles: /roles/list

Chi tiet day du xem tai lieu:
- document/api-reference.md

## Kiem tra chat luong code

### Backend
```powershell
cd server
.\mvnw.cmd -q -DskipTests compile
```

### Frontend
```powershell
cd client
pnpm -s tsc --noEmit
```

## Troubleshooting nhanh

### Frontend quay loading lau
- Kiem tra backend da chay chua
- Kiem tra token con han
- Mo Network tab de xem endpoint nao loi

### Docker compose loi
- Chay docker compose config de validate
- Neu can reset sach: docker compose down -v

### Backend loi ket noi DB
- Kiem tra spring.datasource.url
- Neu chay compose, host phai la db thay vi localhost

Chi tiet troubleshooting:
- document/troubleshooting.md

## Tai lieu bo sung
- document/README.md
- document/system-overview.md
- document/local-setup.md
- document/docker-deployment.md
- document/api-reference.md
- document/troubleshooting.md
- document/erd.md
- document/user-story.md

## Gop y va phat trien
Neu can mo rong tinh nang, nen tao issue theo nhom:
- Performance
- Security
- UX/UI
- Notification/Chat realtime
- CI/CD
