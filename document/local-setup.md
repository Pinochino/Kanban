# Huong Dan Setup Local

## 1. Yeu cau he thong
- JDK 21
- Maven (hoac su dung `mvnw` trong project)
- Node.js 20+
- pnpm
- PostgreSQL
- Redis

## 2. Clone va cai dat

### Backend
Tu thu muc `server`:
```powershell
.\mvnw.cmd -q -DskipTests compile
```

### Frontend
Tu thu muc `client`:
```powershell
pnpm install
pnpm -s tsc --noEmit
```

## 3. Cau hinh backend
File cau hinh hien tai: `server/src/main/resources/application.properties`

Can kiem tra toi thieu:
- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`
- `spring.data.redis.host`
- `spring.data.redis.port`
- mail/cloudinary env

## 4. Chay local khong docker

### Start backend
```powershell
cd server
.\mvnw.cmd spring-boot:run
```

Mac dinh API:
- `http://localhost:9000/api`

### Start frontend
```powershell
cd client
pnpm dev
```

Mac dinh web:
- `http://localhost:4000`

## 5. Kiem tra nhanh
- Dang nhap thanh cong
- Dashboard load du lieu
- User management co list user
- Project/task board hien danh sach
- Notification page va chat page truy cap duoc

## 6. Lenh check chat luong code

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
