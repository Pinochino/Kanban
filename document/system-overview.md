# Tong Quan He Thong

## 1. Stack cong nghe

### Backend
- Java 21
- Spring Boot
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL
- Redis (dung cho token/cache theo cau hinh)
- Cloudinary (upload avatar)

### Frontend
- React 18 + TypeScript
- Vite
- TanStack Query
- Redux Toolkit + Persist
- Tailwind + shadcn/ui

### Van hanh
- Docker / Docker Compose

## 2. Cau truc workspace
- `server`: backend API
- `client`: giao dien web
- `deploy`: file docker compose
- `document`: tai lieu du an

## 3. Kha nang chinh
- Auth: dang ky, dang nhap, refresh token, dang xuat
- User management: danh sach user, lock/unlock, soft delete/restore, update profile
- Project/Task: tao project, board task, tim kiem task, cap nhat status
- Notification: tao notification (admin), xem notification (admin/user), retry email
- Chat: chat 1-1 va chat group
- Dashboard: thong ke user/project/task + phan bo trang thai

## 4. Luong nghiep vu tong quat
1. User dang nhap va nhan JWT
2. Frontend goi API qua `axiosClient`, gan Authorization Bearer
3. Backend xac thuc token, xu ly business, tra `AppResponse<T>`
4. Frontend luu cache query theo screen

## 5. Mo hinh du lieu tong quan
- `Account` <-> `Role`
- `Project` -> `ListTask` -> `Task`
- `Task` -> `Comment`, `TaskLabel`, `TaskActivity`
- `Notification` lien ket voi `Account` va co the lien ket `Task`
- `ChatGroup` <-> `Account`; `ChatGroupMessage`; `ChatMessage`

## 6. Quy uoc response backend
- Kieu response chung: `AppResponse<T>`
- Cac list co phan trang: `PagedResponse<T>`

## 7. Bao mat
- API duoc bao ve boi Spring Security
- Phan quyen theo role (`SUPER_ADMIN`, `ADMIN`, `USER`)
- Cac route admin duoc gioi han trong security config
