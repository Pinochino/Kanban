# 🗄️ Database ERD – Hệ Thống Quản Lý Task (Trello-like)

> **Công nghệ:** Relational Database (JPA/Hibernate style)  
> **Kiểu dữ liệu ID:** `Long` (Auto Increment)  
> **Thời gian:** `LocalDateTime`

---

## Mục Lục

- [🗄️ Database ERD – Hệ Thống Quản Lý Task (Trello-like)](#️-database-erd--hệ-thống-quản-lý-task-trello-like)
  - [Mục Lục](#mục-lục)
  - [1. Sơ đồ quan hệ tổng quan](#1-sơ-đồ-quan-hệ-tổng-quan)
  - [2. Chi tiết các bảng](#2-chi-tiết-các-bảng)
    - [👤 Account](#-account)
    - [🔑 Role](#-role)
    - [🔗 Account\_Role](#-account_role)
    - [📁 Project](#-project)
    - [👥 ProjectMember](#-projectmember)
    - [🏷️ ProjectLabel](#️-projectlabel)
    - [📋 List](#-list)
    - [✅ Task](#-task)
    - [👤 TaskMember](#-taskmember)
    - [🏷️ TaskLabel](#️-tasklabel)
    - [📎 TaskAttachment](#-taskattachment)
    - [☑️ Checklist](#️-checklist)
    - [☑️ ChecklistItem](#️-checklistitem)
    - [💬 Comment](#-comment)
    - [📜 TaskActivity](#-taskactivity)
  - [3. Quan hệ giữa các bảng](#3-quan-hệ-giữa-các-bảng)
    - [Bảng quan hệ tổng hợp](#bảng-quan-hệ-tổng-hợp)
    - [Sơ đồ quan hệ dạng text (Chi tiết)](#sơ-đồ-quan-hệ-dạng-text-chi-tiết)
  - [4. Indexes \& Constraints](#4-indexes--constraints)
    - [Indexes được định nghĩa](#indexes-được-định-nghĩa)
    - [Composite Primary Keys](#composite-primary-keys)
    - [Soft Delete](#soft-delete)
    - [Enum Values (gợi ý)](#enum-values-gợi-ý)

---

## 1. Sơ đồ quan hệ tổng quan

```
Account ──────────────────── Account_Role ──── Role
   │
   ├──── ProjectMember ──── Project ──── List ──── Task ──── TaskMember ──── Account
   │                           │            │         │
   │                           │            │         ├──── TaskLabel ──── ProjectLabel
   │                           │            │         ├──── TaskAttachment
   │                           │            │         ├──── Checklist ──── ChecklistItem
   │                           │            │         └──── Comment
   │                           │            │
   │                      ProjectLabel      └── (INDEX: projectID, orderIndex)
   │
   ├──── TaskActivity (log)
   └──── Comment
```

---

## 2. Chi tiết các bảng

---

### 👤 Account

> Lưu thông tin tài khoản người dùng trong hệ thống.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `accountID` | Long | **PK** | Khóa chính, tự tăng |
| `username` | String | NOT NULL | Tên hiển thị |
| `email` | String | NOT NULL, UNIQUE | Email đăng nhập |
| `password` | String | NOT NULL | Mật khẩu (đã hash) |
| `avatarUrl` | String | NULLABLE | Đường dẫn ảnh đại diện |
| `createdAt` | LocalDateTime | NOT NULL | Thời điểm tạo tài khoản |
| `updatedAt` | LocalDateTime | NOT NULL | Thời điểm cập nhật gần nhất |
| `status` | Enum | NOT NULL | Trạng thái: `ACTIVE`, `LOCKED` |

**Quan hệ:**
- 1 Account → nhiều `Account_Role` (nhiều-nhiều với Role qua bảng trung gian)
- 1 Account → nhiều `ProjectMember` (tham gia nhiều dự án)
- 1 Account → nhiều `Comment` (viết bình luận)
- 1 Account → nhiều `TaskActivity` (ghi log hành động)
- 1 Account → nhiều `TaskMember` (được giao nhiều task)
- 1 Account → nhiều `Project` (sở hữu dự án, qua FK `accountID`)

---

### 🔑 Role

> Định nghĩa các vai trò trong hệ thống.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `roleID` | Long | **PK** | Khóa chính, tự tăng |
| `name` | Enum | NOT NULL | Tên vai trò: `ADMIN`, `USER` |

**Quan hệ:**
- 1 Role → nhiều `Account_Role`

---

### 🔗 Account_Role

> Bảng trung gian liên kết Account và Role (quan hệ nhiều-nhiều).

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `accountID` | Long | **PK, FK** → Account | Khóa chính kép, khóa ngoại tới Account |
| `roleID` | Long | **PK, FK** → Role | Khóa chính kép, khóa ngoại tới Role |

**Quan hệ:**
- Nhiều-nhiều giữa `Account` và `Role`
- Composite PK: (`accountID`, `roleID`)

---

### 📁 Project

> Lưu thông tin dự án.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `projectID` | Long | **PK** | Khóa chính, tự tăng |
| `title` | String | NOT NULL | Tên dự án |
| `description` | String | NULLABLE | Mô tả dự án |
| `createdAt` | LocalDateTime | NOT NULL | Ngày tạo dự án |
| `updatedAt` | LocalDateTime | NOT NULL | Ngày cập nhật gần nhất |
| `isPublic` | boolean | NOT NULL | Dự án công khai hay riêng tư |
| `isDelete` | boolean | NOT NULL | Soft delete (true = đã xóa) |
| `accountID` | Long | **FK** → Account | Người tạo / sở hữu dự án |

**Quan hệ:**
- 1 Project → nhiều `ProjectMember`
- 1 Project → nhiều `List`
- 1 Project → nhiều `ProjectLabel`
- 1 Project → nhiều `TaskActivity` (log hoạt động)
- Thuộc về 1 `Account` (owner)

---

### 👥 ProjectMember

> Bảng trung gian lưu thành viên của từng dự án, kèm vai trò trong dự án.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `accountID` | Long | **PK, FK** → Account | Tài khoản thành viên |
| `projectID` | Long | **PK, FK** → Project | Dự án |
| `boardRole` | Enum | NOT NULL | Vai trò trong dự án: `OWNER`, `ADMIN`, `MEMBER` |

**Quan hệ:**
- Nhiều-nhiều giữa `Account` và `Project`
- Composite PK: (`accountID`, `projectID`)

---

### 🏷️ ProjectLabel

> Nhãn (Label/Tag) thuộc về một dự án, dùng để phân loại task.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `projectLabelID` | Long | **PK** | Khóa chính, tự tăng |
| `name` | String | NOT NULL | Tên nhãn (ví dụ: "Bug", "Feature") |
| `colour` | String | NOT NULL | Màu sắc nhãn (hex color) |
| `projectId` | Long | **FK** → Project | Dự án sở hữu nhãn này |

**Quan hệ:**
- Thuộc về 1 `Project`
- 1 ProjectLabel → nhiều `TaskLabel` (gán cho nhiều task)

---

### 📋 List

> Các cột trạng thái (column) trong Kanban Board của một dự án.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `listID` | Long | **PK** | Khóa chính, tự tăng |
| `title` | String | NOT NULL | Tên cột (ví dụ: "To Do", "In Progress") |
| `orderIndex` | Long | NOT NULL | Thứ tự hiển thị của cột |
| `createdAt` | LocalDateTime | NOT NULL | Ngày tạo |
| `updatedAt` | LocalDateTime | NOT NULL | Ngày cập nhật |
| `projectID` | Long | **FK** → Project | Dự án chứa cột này |

**Index:** `INDEX(projectID, orderIndex)` – tối ưu truy vấn lấy danh sách cột theo dự án và thứ tự.

**Quan hệ:**
- Thuộc về 1 `Project`
- 1 List → nhiều `Task`

---

### ✅ Task

> Lưu thông tin chi tiết của từng task (thẻ công việc).

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `taskID` | Long | **PK** | Khóa chính, tự tăng |
| `title` | String | NOT NULL | Tiêu đề task |
| `description` | String | NULLABLE | Mô tả chi tiết task |
| `dueDate` | LocalDateTime | NULLABLE | Deadline của task |
| `orderIndex` | Long | NOT NULL | Thứ tự task trong List |
| `isActive` | Boolean | NOT NULL | Task đang hoạt động hay đã lưu trữ |
| `createdAt` | LocalDateTime | NOT NULL | Ngày tạo |
| `updatedAt` | LocalDateTime | NOT NULL | Ngày cập nhật gần nhất |
| `reminderDate` | LocalDateTime | NULLABLE | Ngày nhắc nhở task |
| `listID` | Long | **FK** → List | Cột (List) chứa task này |

**Index:** `INDEX(listID, orderIndex)` – tối ưu truy vấn lấy task theo cột và thứ tự.

**Quan hệ:**
- Thuộc về 1 `List`
- 1 Task → nhiều `TaskMember` (nhiều người được giao)
- 1 Task → nhiều `TaskLabel` (nhiều nhãn)
- 1 Task → nhiều `TaskAttachment` (nhiều file đính kèm)
- 1 Task → nhiều `Checklist`
- 1 Task → nhiều `Comment`
- 1 Task → nhiều `TaskActivity` (log)

---

### 👤 TaskMember

> Bảng trung gian lưu người được giao thực hiện task.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `accountID` | Long | **PK, FK** → Account | Tài khoản được giao |
| `taskID` | Long | **PK, FK** → Task | Task được giao |

**Quan hệ:**
- Nhiều-nhiều giữa `Account` và `Task`
- Composite PK: (`accountID`, `taskID`)

---

### 🏷️ TaskLabel

> Bảng trung gian gán nhãn (Label) cho task.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `projectLabelID` | Long | **PK, FK** → ProjectLabel | Nhãn của dự án |
| `taskID` | Long | **PK, FK** → Task | Task được gán nhãn |

**Quan hệ:**
- Nhiều-nhiều giữa `ProjectLabel` và `Task`
- Composite PK: (`projectLabelID`, `taskID`)

---

### 📎 TaskAttachment

> Lưu các file đính kèm của task.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `attachmentID` | Long | **PK** | Khóa chính, tự tăng |
| `uploadedDate` | LocalDateTime | NOT NULL | Ngày upload file |
| `fileName` | String | NOT NULL | Tên file gốc |
| `location` | String | NOT NULL | Đường dẫn lưu trữ (URL / path) |
| `fileSize` | Long | NOT NULL | Dung lượng file (bytes) |
| `mimeType` | String | NOT NULL | Loại file (image/png, application/pdf...) |
| `cardID` | Long | **FK** → Task | Task chứa file đính kèm này |

**Quan hệ:**
- Thuộc về 1 `Task` (qua `cardID` → `taskID`)

---

### ☑️ Checklist

> Danh sách kiểm tra (checklist) trong một task.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `checklistID` | Long | **PK** | Khóa chính, tự tăng |
| `title` | String | NOT NULL | Tiêu đề checklist |
| `isChecked` | Boolean | NOT NULL | Trạng thái hoàn thành tổng thể |
| `orderIndex` | Long | NOT NULL | Thứ tự checklist trong task |
| `createdAt` | LocalDateTime | NOT NULL | Ngày tạo |
| `updatedAt` | LocalDateTime | NOT NULL | Ngày cập nhật |
| `taskID` | Long | **FK** → Task | Task chứa checklist này |

**Quan hệ:**
- Thuộc về 1 `Task`
- 1 Checklist → nhiều `ChecklistItem`

---

### ☑️ ChecklistItem

> Từng mục nhỏ trong một Checklist.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `checklistItemID` | Long | **PK** | Khóa chính, tự tăng |
| `content` | String | NOT NULL | Nội dung mục checklist |
| `isDone` | boolean | NOT NULL | Đã hoàn thành chưa |
| `orderIndex` | Long | NOT NULL | Thứ tự trong checklist |
| `createdAt` | LocalDateTime | NOT NULL | Ngày tạo |
| `updatedAt` | LocalDateTime | NOT NULL | Ngày cập nhật |
| `isChecked` | Boolean | NOT NULL | Trạng thái check (đồng bộ với `isDone`) |
| `checkListID` | Long | **FK** → Checklist | Checklist chứa mục này |

**Quan hệ:**
- Thuộc về 1 `Checklist`

---

### 💬 Comment

> Bình luận của người dùng trên task.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `commentID` | Long | **PK** | Khóa chính, tự tăng |
| `content` | String | NOT NULL | Nội dung bình luận |
| `createdAt` | LocalDateTime | NOT NULL | Thời điểm bình luận |
| `updatedAt` | LocalDateTime | NOT NULL | Thời điểm chỉnh sửa gần nhất |
| `cartID` | Long | **FK** → Task | Task được bình luận (`cardID`) |
| `accountID` | Long | **FK** → Account | Người viết bình luận |

**Quan hệ:**
- Thuộc về 1 `Task` (qua `cartID` → `taskID`)
- Thuộc về 1 `Account` (người bình luận)

---

### 📜 TaskActivity

> Ghi log toàn bộ hành động xảy ra trong dự án / task (audit log).

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `taskActivityIDL` | Long | **PK** | Khóa chính, tự tăng |
| `actionType` | Enum | NOT NULL | Loại hành động: `CREATE`, `UPDATE`, `DELETE`, `MOVE`, `ASSIGN`... |
| `details` | String / Json | NULLABLE | Chi tiết hành động (dạng JSON) |
| `createdAt` | LocalDateTime | NOT NULL | Thời điểm xảy ra hành động |
| `cardID` | Long | **FK** → Task | Task liên quan |
| `accountID` | Long | **FK** → Account | Người thực hiện hành động |

**Quan hệ:**
- Thuộc về 1 `Task` (qua `cardID`)
- Thuộc về 1 `Account` (người thực hiện)
- Liên kết gián tiếp với `Project` (qua Task → List → Project)

---

## 3. Quan hệ giữa các bảng

### Bảng quan hệ tổng hợp

| Bảng A | Quan hệ | Bảng B | Qua bảng / FK |
|---|---|---|---|
| Account | nhiều-nhiều | Role | `Account_Role` |
| Account | nhiều-nhiều | Project | `ProjectMember` |
| Account | nhiều-nhiều | Task | `TaskMember` |
| Account | 1-nhiều | Comment | `Comment.accountID` |
| Account | 1-nhiều | TaskActivity | `TaskActivity.accountID` |
| Account | 1-nhiều | Project | `Project.accountID` (owner) |
| Project | 1-nhiều | List | `List.projectID` |
| Project | 1-nhiều | ProjectLabel | `ProjectLabel.projectId` |
| Project | 1-nhiều | TaskActivity | (qua Task → List → Project) |
| List | 1-nhiều | Task | `Task.listID` |
| Task | nhiều-nhiều | Account | `TaskMember` |
| Task | nhiều-nhiều | ProjectLabel | `TaskLabel` |
| Task | 1-nhiều | TaskAttachment | `TaskAttachment.cardID` |
| Task | 1-nhiều | Checklist | `Checklist.taskID` |
| Task | 1-nhiều | Comment | `Comment.cartID` |
| Task | 1-nhiều | TaskActivity | `TaskActivity.cardID` |
| Checklist | 1-nhiều | ChecklistItem | `ChecklistItem.checkListID` |
| ProjectLabel | nhiều-nhiều | Task | `TaskLabel` |

---

### Sơ đồ quan hệ dạng text (Chi tiết)

```
┌─────────────┐         ┌──────────────┐         ┌──────────┐
│   Account   │──1:N────│ Account_Role │────N:1──│   Role   │
└─────────────┘         └──────────────┘         └──────────┘
       │
       │ 1:N (owner)
       ▼
┌─────────────┐         ┌───────────────┐
│   Project   │──1:N────│ ProjectMember │────N:1── Account
│             │         └───────────────┘
│             │──1:N────┐
│             │         ▼
│             │    ┌────────────────┐
│             │    │  ProjectLabel  │
│             │    └────────────────┘
│             │              │ 1:N (via TaskLabel)
│             │──1:N──────┐  │
└─────────────┘           ▼  ▼
                       ┌──────┐
                       │ List │
                       └──────┘
                           │ 1:N
                           ▼
                       ┌──────┐         ┌─────────────┐
                       │ Task │──1:N────│TaskAttachment│
                       │      │──1:N────│  Checklist  │──1:N── ChecklistItem
                       │      │──1:N────│  Comment    │
                       │      │──1:N────│TaskActivity │
                       │      │──N:N────│TaskMember   │────── Account
                       │      │──N:N────│  TaskLabel  │────── ProjectLabel
                       └──────┘         └─────────────┘
```

---

## 4. Indexes & Constraints

### Indexes được định nghĩa

| Bảng | Index | Mục đích |
|---|---|---|
| `List` | `INDEX(projectID, orderIndex)` | Lấy danh sách cột theo dự án, sắp xếp theo thứ tự |
| `Task` | `INDEX(listID, orderIndex)` | Lấy task theo cột, sắp xếp theo thứ tự |

### Composite Primary Keys

| Bảng | Composite PK |
|---|---|
| `Account_Role` | (`accountID`, `roleID`) |
| `ProjectMember` | (`accountID`, `projectID`) |
| `TaskMember` | (`accountID`, `taskID`) |
| `TaskLabel` | (`projectLabelID`, `taskID`) |

### Soft Delete

| Bảng | Cột | Mô tả |
|---|---|---|
| `Project` | `isDelete: boolean` | Xóa mềm – không xóa thật khỏi DB |

### Enum Values (gợi ý)

| Bảng | Cột | Giá trị Enum |
|---|---|---|
| `Account` | `status` | `ACTIVE`, `LOCKED` |
| `Role` | `name` | `ADMIN`, `USER` |
| `ProjectMember` | `boardRole` | `OWNER`, `ADMIN`, `MEMBER` |
| `TaskActivity` | `actionType` | `CREATE`, `UPDATE`, `DELETE`, `MOVE`, `ASSIGN`, `COMMENT` |

---

*Tài liệu được tổng hợp từ ERD diagram – Trello-like Task Management System.*