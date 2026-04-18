

# Admin Dashboard - Kế hoạch triển khai

## Tình trạng hiện tại
Dự án hiện tại chưa có gì ngoài template trống. Chưa có Supabase, chưa có auth, chưa có database. Để xây admin dashboard, cần xây nền tảng trước.

---

## Bước 1: Kích hoạt Supabase & Database Schema

Kích hoạt Lovable Cloud (Supabase) và tạo các bảng cần thiết:

**Auth & Users:**
- `profiles` - full_name, avatar_url, is_locked, created_at
- `user_roles` - user_id, role (enum: admin, member, guest) -- bảng riêng cho bảo mật
- Trigger tự tạo profile khi đăng ký

**Boards & Cards (cần có để admin quản lý):**
- `boards` - title, description, owner_id, is_deleted, deleted_at, background_color
- `board_members` - board_id, user_id, role (owner/member/viewer)
- `lists` - board_id, title, position
- `cards` - list_id, title, description, due_date, position, created_by
- `comments` - card_id, user_id, content, is_hidden (cho moderation)

**Admin-specific:**
- `reports` - reporter_id, target_type (card/comment/user), target_id, reason, status (pending/resolved/dismissed)
- `system_settings` - key, value, description (single-row config)
- `notification_logs` - user_id, type, content, status (sent/failed/pending), created_at, retry_count
- `activity_logs` - user_id, action, target_type, target_id, metadata, created_at

**RLS:** Tất cả bảng có RLS. Admin truy cập qua `has_role()` security definer function.

---

## Bước 2: Authentication System

- Trang Login / Register với Supabase Auth (email + password)
- Protected routes: redirect nếu chưa đăng nhập
- Admin guard: check role từ `user_roles`, redirect nếu không phải admin
- Trang reset password

---

## Bước 3: Admin Layout & Navigation

Layout riêng cho `/admin/*` với sidebar navigation:
- Dashboard (tổng quan)
- User Management
- Board Management
- Moderation (Reports)
- Analytics
- System Settings
- Notification Control

---

## Bước 4: Các trang Admin

### 4.1 User Management (`/admin/users`)
- Bảng danh sách users với search, filter, pagination
- Actions: Khoá/Mở khoá, Xoá user, Gán role (admin/member/guest)
- Reset password (gửi email reset qua Supabase Auth admin API -- cần Edge Function)
- Dialog xác nhận cho mỗi action nguy hiểm

### 4.2 Board Management (`/admin/boards`)
- Bảng tất cả boards với owner, member count, card count, trạng thái
- Tab: Active / Deleted (soft delete)
- Actions: Xoá board, Transfer ownership (chọn user mới), Restore board đã xoá
- Filter theo owner, ngày tạo

### 4.3 Moderation (`/admin/moderation`)
- Danh sách reports từ users (pending/resolved/dismissed)
- Xem nội dung bị report (comment/card)
- Actions: Ẩn comment toxic, Ban user spam (khoá tài khoản), Dismiss report
- Badge count cho pending reports trên sidebar

### 4.4 Analytics Dashboard (`/admin/dashboard`)
- Cards thống kê: Tổng users, Boards active, Tasks hôm nay, Active users (7 ngày)
- Charts (Recharts):
  - Line chart: Users đăng ký theo ngày (30 ngày)
  - Bar chart: Tasks tạo theo ngày
  - Pie chart: Phân bổ roles

### 4.5 System Settings (`/admin/settings`)
- Form cấu hình:
  - Max boards per user (number input)
  - Max members per board (number input)
  - Toggle features: comments on/off, file upload on/off
  - Email/notification config
- Lưu vào bảng `system_settings` (key-value)

### 4.6 Notification Control (`/admin/notifications`)
- Bảng log notifications với status (sent/failed/pending)
- Filter theo status, user, type
- Retry button cho failed notifications
- Config rules gửi thông báo

---

## Bước 5: Edge Functions

- `admin-reset-password` - Reset password cho user (dùng Supabase Admin API)
- `admin-stats` - Aggregate analytics data (tránh query nặng từ client)

---

## Tech chi tiết

- **State management**: React Query cho data fetching
- **Forms**: React Hook Form + Zod validation
- **Tables**: shadcn/ui Table + custom pagination
- **Charts**: Recharts (đã có sẵn trong project)
- **Drag & Drop**: @dnd-kit (cho board view sau này)
- **Routing**: React Router với nested routes cho admin

---

## Thứ tự triển khai

Do project chưa có gì, sẽ build theo thứ tự:
1. Supabase + Database schema (migrations)
2. Auth (login/register/guard)
3. Admin layout + Dashboard analytics
4. User Management
5. Board Management
6. Moderation system
7. System Settings
8. Notification Control

Dự kiến chia thành nhiều lần build. Bắt đầu với items 1-4 trước.

