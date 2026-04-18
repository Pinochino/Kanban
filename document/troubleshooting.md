# Troubleshooting

## 1. Frontend hien 'Dang tai du lieu...' lau
Kiem tra:
1. Backend co chay khong (`http://localhost:9000/api`)
2. Token co hop le khong
3. API co tra 401/403/500 khong (Network tab)
4. Redis cache/cofig co dang gay loi deserialize khong

## 2. Loi Docker compose
### Compose validate
```powershell
cd deploy
docker compose config
```

### Rebuild sach
```powershell
docker compose down -v
docker compose up --build -d
```

## 3. Backend khong ket noi database
- Kiem tra `spring.datasource.url`
- Neu chay compose: URL phai tro den host `db`, khong phai `localhost`

## 4. Redis loi hoac khong can dung cache
- Kiem tra host/port redis
- Neu tam thoi khong can cache app-level, co the tat annotation cache
- Xoa key cu khi doi serializer/prefix

## 5. JWT loi 401 lien tuc
- Kiem tra Access token het han
- Kiem tra endpoint refresh token
- Kiem tra Authorization header co duoc gan khong

## 6. CORS hoac cookie refresh token
- Xac nhan backend cho phep origin frontend
- Xac nhan request co `withCredentials: true` o cac endpoint auth can cookie

## 7. Build server loi
```powershell
cd server
.\mvnw.cmd -q -DskipTests compile
```

## 8. Build client loi
```powershell
cd client
pnpm -s tsc --noEmit
```

## 9. Loi chat tao group xong khong thay
- Kiem tra response create group
- Kiem tra query list groups co refetch/set cache sau create
- Kiem tra user hien tai co trong member list cua group

## 10. Checklist khi release
- Chay compile backend
- Chay typecheck frontend
- Chay docker compose config
- Kiem tra login, dashboard, task board, notification, chat
