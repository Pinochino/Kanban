# 📋 User Stories – Hệ Thống Quản Lý Task Kiểu Kanban

> **Phiên bản:** 1.0  
> **Cập nhật lần cuối:** 2025  
> **Phạm vi:** Toàn bộ hệ thống – Admin (Boss) & User (Staff)

---

## Mục Lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Phân quyền người dùng](#2-phân-quyền-người-dùng)
3. [Module: Xác thực (Auth)](#3-module-xác-thực-auth)
4. [Module: Dự án (Project)](#4-module-dự-án-project)
5. [Module: Danh sách cột (List)](#5-module-danh-sách-cột-list)
6. [Module: Task](#6-module-task)
7. [Module: Chi tiết Task (Task Detail)](#7-module-chi-tiết-task-task-detail)
8. [Module: Quản trị người dùng (Admin – User)](#8-module-quản-trị-người-dùng-admin--user)
9. [Module: Quản trị dự án (Admin – Project)](#9-module-quản-trị-dự-án-admin--project)
10. [Bảng tổng hợp User Stories](#10-bảng-tổng-hợp-user-stories)

---

## 1. Tổng quan hệ thống

Hệ thống quản lý công việc theo phong cách **Kanban** cho phép:

- **Admin (Boss)** tạo và quản lý dự án, phân công nhiệm vụ, theo dõi tiến độ toàn hệ thống.
- **User (Staff)** nhận nhiệm vụ, cập nhật trạng thái công việc, cộng tác trong dự án.

Hệ thống hỗ trợ 2 chế độ hiển thị:
- 🗂️ **Kanban Board** – các cột theo trạng thái, kéo thả trực quan.
- 📊 **Table View** – dạng bảng, dễ lọc và sắp xếp.

---

## 2. Phân quyền người dùng

| Vai trò | Mô tả | Ký hiệu |
|---|---|---|
| **Admin / Boss** | Quản trị viên toàn hệ thống, tạo/xóa dự án, phân công task, quản lý người dùng | 👑 |
| **User / Staff** | Nhân viên, thành viên dự án, thực hiện và cập nhật task được giao | 👤 |

---

## 3. Module: Xác thực (Auth)

---

### US-001 – Đăng ký tài khoản

| Trường | Nội dung |
|---|---|
| **ID** | US-001 |
| **Module** | Auth |
| **Epic** | Đăng ký |
| **Vai trò** |  Khách (Guest) |

**User Story:**
> *Là một khách chưa có tài khoản, tôi muốn tạo tài khoản mới bằng email và mật khẩu để có thể đăng nhập và sử dụng hệ thống.*

**Acceptance Criteria:**

- [ ] Email phải đúng định dạng (có `@` và domain hợp lệ).
- [ ] Mật khẩu tối thiểu **8 ký tự**; nên có chữ hoa, số, ký tự đặc biệt.
- [ ] Hệ thống kiểm tra email chưa tồn tại trong database trước khi tạo.
- [ ] Sau khi đăng ký thành công, tài khoản được tạo và **JWT token** được trả về.
- [ ] Hiển thị thông báo lỗi rõ ràng nếu: email đã tồn tại, mật khẩu quá ngắn, form bỏ trống.
- [ ] Tự động chuyển hướng về trang Dashboard sau khi đăng ký thành công.

**Ghi chú kỹ thuật:**
- API endpoint: `POST /api/auth/register`
- Response trả về `{ token, user }` khi thành công.
- Mật khẩu phải được hash (bcrypt) trước khi lưu DB.

---

### US-002 – Đăng nhập

| Trường | Nội dung |
|---|---|
| **ID** | US-002 |
| **Module** | Auth |
| **Epic** | Đăng nhập |
| **Vai trò** |  Admin /  User |

**User Story:**
> *Là người dùng đã có tài khoản, tôi muốn đăng nhập bằng email và mật khẩu để truy cập bảng Kanban và các dự án của mình.*

**Acceptance Criteria:**

- [ ] Nhập đúng email + mật khẩu → nhận **JWT token** hợp lệ, chuyển về Dashboard.
- [ ] Nhập sai thông tin → nhận lỗi **401 Unauthorized**, thông báo rõ ràng.
- [ ] Token được lưu phía client (localStorage hoặc cookie httpOnly).
- [ ] Tài khoản bị khoá → thông báo "Tài khoản bị khóa, vui lòng liên hệ quản trị viên".
- [ ] Giao diện có nút "Hiển thị/Ẩn mật khẩu".
- [ ] Hỗ trợ nhấn **Enter** để submit form.

**Ghi chú kỹ thuật:**
- API endpoint: `POST /api/auth/login`
- JWT có thời hạn (ví dụ: 7 ngày), có thể cấu hình.

---

### US-003 – Đăng xuất

| Trường | Nội dung |
|---|---|
| **ID** | US-003 |
| **Module** | Auth |
| **Epic** | Đăng xuất |
| **Vai trò** |  Admin /  User |

**User Story:**
> *Là người dùng đang đăng nhập, tôi muốn đăng xuất khỏi hệ thống để bảo vệ tài khoản khi rời khỏi thiết bị.*

**Acceptance Criteria:**

- [ ] Token phía server bị thu hồi (blacklist) hoặc xóa phía client.
- [ ] Xóa sạch dữ liệu session/token lưu trong localStorage/cookie.
- [ ] Tự động chuyển hướng về trang **Login** sau khi đăng xuất.
- [ ] Nếu token đã hết hạn, tự động đăng xuất và redirect về Login.

---

### US-004 – Bảo vệ route (Route Guard)

| Trường | Nội dung |
|---|---|
| **ID** | US-004 |
| **Module** | Auth |
| **Epic** | Bảo vệ route |
| **Vai trò** |  Hệ thống |

**User Story:**
> *Là hệ thống, tôi muốn chặn mọi truy cập vào các API và trang cần xác thực nếu request không có JWT hợp lệ, để bảo vệ dữ liệu người dùng.*

**Acceptance Criteria:**

- [ ] Mọi API thuộc nhóm bảo vệ đều trả về **401** nếu thiếu hoặc sai token.
- [ ] Middleware kiểm tra JWT trên **mọi request** đến endpoint bảo vệ.
- [ ] Frontend tự động redirect về `/login` nếu nhận 401.
- [ ] Admin routes (quản lý user, thống kê) chỉ cho phép role `admin`, trả **403** nếu role không hợp lệ.

---

## 4. Module: Dự án (Project)

---

### US-005 – Xem danh sách dự án (Dashboard)

| Trường | Nội dung |
|---|---|
| **ID** | US-005 |
| **Module** | Project |
| **Epic** | Dự án |
| **Vai trò** |  Admin |

**User Story:**
> *Là admin, tôi muốn xem tổng quan toàn bộ dự án của mình trên trang chủ (Dashboard), bao gồm danh sách dự án, danh sách thành viên, và các số liệu thống kê task, để nắm bắt nhanh tình hình công việc.*

**Acceptance Criteria:**

- [ ] Dashboard chỉ hiển thị **dự án của user đang đăng nhập** (không lộ dự án của người khác).
- [ ] Mỗi dự án hiển thị: tên, ngày tạo, ngày hết hạn, số thành viên.
- [ ] Thống kê tổng quan:
  - Tổng số dự án.
  - Tổng số task **chưa bắt đầu** (To Do).
  - Tổng số task **đang làm** (In Progress).
  - Tổng số task **đã hoàn thành** (Done).
- [ ] Hiển thị **empty state** (hình minh họa + nút "Tạo dự án đầu tiên") nếu chưa có dự án.
- [ ] Danh sách dự án được sắp xếp theo ngày tạo mới nhất.

---

### US-006 – Tạo dự án mới

| Trường | Nội dung |
|---|---|
| **ID** | US-006 |
| **Module** | Project |
| **Epic** | Tạo dự án |
| **Vai trò** |  Admin |

**User Story:**
> *Là admin, tôi muốn tạo một dự án mới với tên và ngày hết hạn tùy chọn để bắt đầu quản lý công việc cho nhóm.*

**Acceptance Criteria:**

- [ ] Tên dự án: tối thiểu **1 ký tự**, tối đa **100 ký tự**.
- [ ] Bắt buộc nhập **ngày hết hạn** (deadline) của dự án.
- [ ] Có thể thêm mô tả ngắn cho dự án (tùy chọn, tối đa 500 ký tự).
- [ ] Dự án mới **xuất hiện ngay lập tức** trên Dashboard sau khi tạo (không cần reload trang).
- [ ] Admin tạo dự án tự động trở thành **Owner** của dự án đó.
- [ ] Hiển thị thông báo lỗi nếu tên dự án bỏ trống hoặc vượt giới hạn ký tự.

---

### US-007 – Sửa thông tin dự án

| Trường | Nội dung |
|---|---|
| **ID** | US-007 |
| **Module** | Project |
| **Epic** | Sửa dự án |
| **Vai trò** |  Admin (Boss) |

**User Story:**
> *Là boss, tôi muốn chỉnh sửa tên, mô tả hoặc ngày hết hạn của dự án để phản ánh đúng phạm vi và tiến độ thực tế.*

**Acceptance Criteria:**

- [ ] Tên mới được lưu và **hiển thị ngay lập tức** (không cần reload).
- [ ] Có thể cập nhật: tên dự án, mô tả, ngày hết hạn.
- [ ] Thông tin mới phải thỏa mãn cùng validation với khi tạo mới (tên ≥ 1, ≤ 100 ký tự).
- [ ] Chỉ **Owner** hoặc **Admin** của dự án mới có quyền sửa.
- [ ] Hiển thị timestamp "Cập nhật lần cuối: [thời gian]" sau khi lưu.

---

### US-008 – Xóa dự án

| Trường | Nội dung |
|---|---|
| **ID** | US-008 |
| **Module** | Project |
| **Epic** | Xóa dự án |
| **Vai trò** |  Admin (Boss) |

**User Story:**
> *Là boss, tôi muốn xóa một dự án đã kết thúc hoặc không còn cần thiết để giữ cho hệ thống gọn gàng.*

**Acceptance Criteria:**

- [ ] Hiển thị **hộp thoại xác nhận** trước khi xóa (ví dụ: "Nhập tên dự án để xác nhận xóa").
- [ ] Khi xóa dự án: **toàn bộ List và Task** liên quan bị xóa theo (cascade delete).
- [ ] Sau khi xóa, dự án biến mất khỏi Dashboard ngay lập tức.
- [ ] Chỉ **Owner** hoặc **Admin** của dự án mới có quyền xóa.
- [ ] Hành động xóa được **ghi log** (ai xóa, thời gian xóa).

---

## 5. Module: Danh sách cột (List)

---

### US-009 – Xem các cột List trong dự án

| Trường | Nội dung |
|---|---|
| **ID** | US-009 |
| **Module** | List |
| **Epic** | Xem List |
| **Vai trò** | 👑 Admin / 👤 User |
| **Ưu tiên** | 🔴 Cao |

**User Story:**
> *Là người dùng, khi mở một dự án tôi muốn thấy tất cả các cột (List) theo trạng thái, và có thể chọn xem toàn bộ task hoặc chỉ task của bản thân, để tập trung vào công việc phù hợp.*

**Acceptance Criteria:**

**Chế độ Kanban Board:**
- [ ] Các cột (List) hiển thị theo **thứ tự ngang** (ví dụ: To Do → In Progress → Review → Done).
- [ ] Scroll ngang khi số cột vượt quá màn hình.
- [ ] Mỗi cột hiển thị: tên cột, số lượng task trong cột.
- [ ] Task trong mỗi cột hiển thị dưới dạng **card** với tiêu đề, người được giao, deadline.

**Chế độ Table View:**
- [ ] Hiển thị tất cả task dưới dạng **bảng** với các cột: Tên task, Trạng thái, Người thực hiện, Deadline, Ngày tạo.
- [ ] Có thể **lọc** theo cột, trạng thái, người thực hiện.
- [ ] Có thể **sắp xếp** theo deadline, ngày tạo.

**Bộ lọc cá nhân:**
- [ ] Nút toggle **"Chỉ xem task của tôi"** – lọc hiển thị task được assign cho người dùng hiện tại.
- [ ] Khi bật filter, cả Kanban và Table View đều áp dụng.

---

## 6. Module: Task

---

### US-013 – Tạo Task mới

| Trường | Nội dung |
|---|---|
| **ID** | US-013 |
| **Module** | Task |
| **Epic** | Tạo Task |
| **Vai trò** | 👑 Admin (Boss) |

**User Story:**
> *Là boss, tôi muốn thêm task mới vào một List, giao task cho thành viên, đặt deadline và viết mô tả chi tiết, để nhân viên biết chính xác cần làm gì và khi nào.*

**Acceptance Criteria:**

- [ ] Tiêu đề task: tối thiểu **1 ký tự**, tối đa **200 ký tự**.
- [ ] Các trường bắt buộc: **Tiêu đề**, **List (cột)** mặc định.
- [ ] Các trường tùy chọn:
  - Mô tả chi tiết (rich text hoặc markdown).
  - Người được giao (assignee) – chọn từ danh sách thành viên dự án.
  - Deadline (ngày và giờ cụ thể).
  - Nhãn (Label/Tag) để phân loại.
- [ ] Task xuất hiện **cuối List** theo mặc định.
- [ ] **Vị trí task** trong List tự động sắp xếp theo thời gian hết hạn (task gần deadline nhất lên trên).
- [ ] Thành viên được giao nhận **thông báo** (in-app hoặc email).
- [ ] Task mới xuất hiện ngay không cần reload trang.

---

### US-014 – Sửa Task

| Trường | Nội dung |
|---|---|
| **ID** | US-014 |
| **Module** | Task |
| **Epic** | Sửa Task |
| **Vai trò** |  Admin (Boss) |

**User Story:**
> *Là boss, tôi muốn sửa tiêu đề, mô tả, assignee hoặc deadline của task trực tiếp từ danh sách (inline edit) mà không cần mở modal.*

**Acceptance Criteria:**

- [ ] Click vào tiêu đề task → chuyển sang **inline edit** mode.
- [ ] Nhấn **Enter** hoặc **blur** (click ra ngoài) → tự động lưu.
- [ ] Nhấn **Escape** → hủy thay đổi, khôi phục giá trị cũ.
- [ ] Tiêu đề rỗng → hiển thị lỗi, không cho lưu.
- [ ] Chỉnh sửa assignee và deadline có thể thực hiện trực tiếp từ card Kanban.
- [ ] Thay đổi được lưu ngay lập tức và đồng bộ cho tất cả user cùng xem.

---

### US-015 – Xóa Task

| Trường | Nội dung |
|---|---|
| **ID** | US-015 |
| **Module** | Task |
| **Epic** | Xóa Task |
| **Vai trò** |  Admin (Boss) |

**User Story:**
> *Là boss, tôi muốn xóa các task đã hoàn thành hoặc không còn cần thiết để giữ bảng Kanban gọn gàng.*

**Acceptance Criteria:**

- [ ] Hiển thị **hộp thoại xác nhận** trước khi xóa.
- [ ] Task **biến mất khỏi List ngay lập tức** sau khi xóa.
- [ ] Chỉ Boss/Admin mới có quyền xóa task (nhân viên không thể xóa).
- [ ] Hành động xóa được ghi log.

---

### US-016 – Chuyển trạng thái Task

| Trường | Nội dung |
|---|---|
| **ID** | US-016 |
| **Module** | Task |
| **Epic** | Chuyển Task theo trạng thái |
| **Vai trò** |  Admin (Boss) /  User (Staff) |

**User Story:**
> *Là nhân viên hoặc boss, tôi muốn chuyển trạng thái của task sang cột khác bằng dropdown để cập nhật tiến độ công việc mà không cần kéo thả.*

**Acceptance Criteria:**

- [ ] Mỗi task card có **dropdown chọn trạng thái** liệt kê tất cả List/cột trong dự án.
- [ ] Chọn trạng thái mới → task **di chuyển sang cột tương ứng ngay lập tức**.
- [ ] **Boss:** có thể chuyển task sang bất kỳ trạng thái nào.
- [ ] **Staff:** chỉ có thể chuyển task **được giao cho mình** và chỉ theo luồng hợp lệ (ví dụ: không được chuyển ngược về "To Do" nếu đã ở "Done").
- [ ] Thay đổi được đồng bộ real-time cho tất cả thành viên đang xem.
- [ ] Hiển thị lịch sử thay đổi trạng thái trong phần Task Detail.

---

### US-017 – Kéo thả Task (Drag & Drop)

| Trường | Nội dung |
|---|---|
| **ID** | US-017 |
| **Module** | Task |
| **Epic** | Drag & Drop |
| **Vai trò** |  Admin (Boss) /  User (Staff) |

**User Story:**
> *Là người dùng hoặc boss, tôi muốn kéo thả task giữa các cột trên **Table View** để di chuyển task nhanh chóng và trực quan.*

**Acceptance Criteria:**

- [ ] Kéo thả hoạt động **mượt mà** trên cả desktop và mobile.
- [ ] Hiển thị **placeholder / ghost card** tại vị trí thả khi đang kéo.
- [ ] Vị trí mới của task **được lưu ngay** sau khi thả.
- [ ] Có thể kéo task để **sắp xếp thứ tự** trong cùng một cột.
- [ ] **Lưu ý:** Drag & Drop **KHÔNG áp dụng trên Kanban Board** (chỉ dùng trên Table View).
- [ ] Hoạt động trên thiết bị di động (touch drag).
- [ ] Nếu thả vào cột khác → tự động cập nhật trạng thái tương ứng.

---

## 7. Module: Chi tiết Task (Task Detail)

---

### US-018 – Mở modal chi tiết Task

| Trường | Nội dung |
|---|---|
| **ID** | US-018 |
| **Module** | Task Detail |
| **Epic** | Mở modal chi tiết |
| **Vai trò** |  Admin /  User |

**User Story:**
> *Là người dùng, khi click vào một task tôi muốn thấy modal chi tiết với đầy đủ thông tin để nắm rõ yêu cầu công việc.*

**Acceptance Criteria:**

- [ ] Click vào task card → Modal mở (không chuyển trang, overlay trên Kanban Board).
- [ ] Modal hiển thị đầy đủ:
  - Tiêu đề task.
  - Mô tả chi tiết.
  - Người được giao (assignee) kèm avatar.
  - Ngày tạo và **Due Date** (hiển thị màu đỏ nếu quá hạn).
  - Trạng thái hiện tại.
  - Lịch sử thay đổi trạng thái.
- [ ] Đóng modal bằng nút **✕** hoặc **click ra ngoài** modal.
- [ ] Đóng modal bằng phím **Escape**.
- [ ] Modal hỗ trợ **chỉnh sửa inline** (Boss có thể sửa tiêu đề, mô tả, deadline trực tiếp trong modal).
- [ ] URL cập nhật khi mở modal (ví dụ: `/projects/1/tasks/42`) để có thể chia sẻ link task.

---

## 8. Module: Quản trị người dùng (Admin – User)

---

### US-023 – Xem danh sách người dùng

| Trường | Nội dung |
|---|---|
| **ID** | US-023 |
| **Module** | Admin – User |
| **Epic** | Danh sách người dùng |
| **Vai trò** |  Admin |

**User Story:**
> *Là admin, tôi muốn xem toàn bộ danh sách tài khoản trên hệ thống để kiểm soát và quản lý người dùng hiệu quả.*

**Acceptance Criteria:**

- [ ] Hiển thị danh sách với các thông tin: Avatar, Tên nhân viên, Email, Ngày tạo tài khoản, Trạng thái (active / locked).
- [ ] **Phân trang**: mỗi trang tối đa **20 người dùng**.
- [ ] Có chức năng **tìm kiếm** theo tên hoặc email.
- [ ] Có thể **lọc** theo trạng thái (tất cả / đang hoạt động / bị khóa).
- [ ] Sắp xếp theo ngày tạo mới nhất mặc định.

---

### US-024 – Khóa / Mở khóa tài khoản

| Trường | Nội dung |
|---|---|
| **ID** | US-024 |
| **Module** | Admin – User |
| **Epic** | Khóa / Mở tài khoản |
| **Vai trò** |  Admin |

**User Story:**
> *Là admin, tôi muốn khóa tài khoản của người dùng vi phạm để ngăn họ đăng nhập, và có thể mở khóa lại khi cần.*

**Acceptance Criteria:**

- [ ] Admin có thể **khóa** tài khoản bằng toggle hoặc button "Khóa tài khoản".
- [ ] User bị khóa **không thể đăng nhập**; nếu đang đăng nhập thì bị logout ngay lập tức (token bị thu hồi).
- [ ] Khi user bị khóa cố đăng nhập → thông báo: *"Tài khoản của bạn đã bị khóa. Liên hệ admin để được hỗ trợ."*
- [ ] Admin thấy rõ trạng thái **Locked / Active** trong danh sách.
- [ ] Admin có thể **mở khóa** bất cứ lúc nào; user có thể đăng nhập lại ngay.
- [ ] Hành động khóa/mở khóa được ghi log.

---

### US-025 – Xóa tài khoản người dùng

| Trường | Nội dung |
|---|---|
| **ID** | US-025 |
| **Module** | Admin – User |
| **Epic** | Xóa tài khoản |
| **Vai trò** |  Admin |

**User Story:**
> *Là admin, tôi muốn xóa vĩnh viễn tài khoản không hợp lệ hoặc vi phạm nghiêm trọng để bảo vệ tính toàn vẹn của hệ thống.*

**Acceptance Criteria:**

- [ ] Hiển thị **hộp thoại xác nhận 2 bước** trước khi xóa (ví dụ: nhập email người dùng để xác nhận).
- [ ] Xóa user kéo theo xóa **toàn bộ dữ liệu liên quan**: task được giao, bình luận, thành viên dự án.
- [ ] Task đang được giao cho user bị xóa → chuyển về trạng thái **Unassigned**.
- [ ] Không thể xóa tài khoản **Admin duy nhất** của hệ thống.
- [ ] Hành động xóa được **ghi log chi tiết** (admin thực hiện, thời gian, email user bị xóa).

---

## 9. Module: Quản trị dự án (Admin – Project)

---

### US-026 – Thống kê toàn bộ dự án

| Trường | Nội dung |
|---|---|
| **ID** | US-026 |
| **Module** | Admin – Project |
| **Epic** | Thống kê dự án |
| **Vai trò** |  Admin |

**User Story:**
> *Là admin, tôi muốn xem thống kê tổng quan toàn bộ dự án trên hệ thống để giám sát hoạt động và phân bổ nguồn lực hợp lý.*

**Acceptance Criteria:**

- [ ] Dashboard admin hiển thị:
  - **Tổng số dự án** trên toàn hệ thống.
  - Danh sách dự án với: Tên dự án, Mô tả ngắn, Tên chủ dự án (Owner), Tổng số thành viên, Ngày tạo, Ngày hết hạn, Trạng thái (đang hoạt động / đã kết thúc).
- [ ] Số liệu task tổng hợp: tổng task To Do / In Progress / Done trên toàn hệ thống.
- [ ] Có thể **tìm kiếm dự án** theo tên.
- [ ] Có thể **lọc** theo trạng thái dự án và khoảng thời gian.

---

### US-028 – Xóa dự án vi phạm (Admin)

| Trường | Nội dung |
|---|---|
| **ID** | US-028 |
| **Module** | Admin – Project |
| **Epic** | Xóa dự án vi phạm |
| **Vai trò** |  Admin |

**User Story:**
> *Là admin hệ thống, tôi muốn xóa dự án chứa nội dung vi phạm chính sách để duy trì môi trường làm việc lành mạnh và an toàn.*

**Acceptance Criteria:**

- [ ] Admin có thể xóa **bất kỳ dự án nào** trên hệ thống (không chỉ dự án của mình).
- [ ] Hiển thị **hộp thoại xác nhận** với lý do xóa (bắt buộc nhập).
- [ ] Xóa dự án kéo theo xóa **toàn bộ List và Task** liên quan.
- [ ] **Ghi log hành động**: admin thực hiện, thời gian, tên/ID dự án bị xóa, lý do.
- [ ] Gửi **email thông báo** cho Owner của dự án về việc dự án bị xóa.

---

## 10. Bảng tổng hợp User Stories

| ID | Module | Vai trò | Tên User Story | Ưu tiên |
|---|---|---|---|---|
| US-001 | Auth | 🔓 Guest | Đăng ký tài khoản | 🔴 Cao |
| US-002 | Auth | 👑/👤 | Đăng nhập | 🔴 Cao |
| US-003 | Auth | 👑/👤 | Đăng xuất | 🟡 Trung bình |
| US-004 | Auth | ⚙️ System | Bảo vệ route | 🔴 Cao |
| US-005 | Project | 👑 Admin | Xem dashboard dự án | 🔴 Cao |
| US-006 | Project | 👑 Admin | Tạo dự án mới | 🔴 Cao |
| US-007 | Project | 👑 Boss | Sửa thông tin dự án | 🟡 Trung bình |
| US-008 | Project | 👑 Boss | Xóa dự án | 🟡 Trung bình |
| US-009 | List | 👑/👤 | Xem List (Kanban + Table) | 🔴 Cao |
| US-013 | Task | 👑 Boss | Tạo Task mới | 🔴 Cao |
| US-014 | Task | 👑 Boss | Sửa Task (inline) | 🟡 Trung bình |
| US-015 | Task | 👑 Boss | Xóa Task | 🟡 Trung bình |
| US-016 | Task | 👑/👤 | Chuyển trạng thái Task | 🔴 Cao |
| US-017 | Task | 👑/👤 | Kéo thả Task (Drag & Drop) | 🟡 Trung bình |
| US-018 | Task Detail | 👑/👤 | Mở modal chi tiết Task | 🟡 Trung bình |
| US-023 | Admin – User | 👑 Admin | Xem danh sách người dùng | 🟡 Trung bình |
| US-024 | Admin – User | 👑 Admin | Khóa / Mở khóa tài khoản | 🟡 Trung bình |
| US-025 | Admin – User | 👑 Admin | Xóa tài khoản | 🔴 Cao |
| US-026 | Admin – Project | 👑 Admin | Thống kê toàn bộ dự án | 🟡 Trung bình |
| US-028 | Admin – Project | 👑 Admin | Xóa dự án vi phạm | 🟡 Trung bình |

---

## Ghi chú chung

### Quy ước trạng thái Task mặc định

| Trạng thái | Mô tả | Màu gợi ý |
|---|---|---|
| **To Do** | Chưa bắt đầu | ⚪ Xám |
| **In Progress** | Đang thực hiện | 🔵 Xanh dương |
| **Review** | Chờ kiểm tra | 🟡 Vàng |
| **Done** | Hoàn thành | 🟢 Xanh lá |
| **Blocked** | Bị chặn / có vấn đề | 🔴 Đỏ |

### Quyền hạn theo vai trò

| Hành động | 👤 Staff | 👑 Boss/Admin |
|---|---|---|
| Xem task trong dự án | ✅ | ✅ |
| Xem task của bản thân | ✅ | ✅ |
| Tạo task | ❌ | ✅ |
| Sửa task | ❌ | ✅ |
| Xóa task | ❌ | ✅ |
| Chuyển trạng thái task (task của mình) | ✅ | ✅ |
| Chuyển trạng thái task (bất kỳ) | ❌ | ✅ |
| Tạo / Sửa / Xóa dự án | ❌ | ✅ |
| Quản lý người dùng | ❌ | ✅ (Admin) |
| Xem thống kê hệ thống | ❌ | ✅ (Admin) |

---

*Tài liệu này được tạo dựa trên yêu cầu nghiệp vụ ban đầu và đã được mở rộng chi tiết để phục vụ phát triển sản phẩm.*