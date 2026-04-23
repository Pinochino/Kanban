# API Reference (Tom Tat)

Base URL:
- `http://localhost:9000/api`

Response chung:
- `AppResponse<T>`
- `PagedResponse<T>` cho du lieu phan trang

## 1. Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh-token`
- `POST /auth/logout`

## 2. Accounts
- `GET /accounts/list`
- `GET /accounts/detail/{id}`
- `PATCH /accounts/update-active/{accountId}`
- `PUT /accounts/update/{accountId}`
- `PATCH /accounts/update-profile/{accountId}`
- `PATCH /accounts/soft-delete/{accountId}`
- `PATCH /accounts/restore/{accountId}`
- `GET /accounts/count`
- `GET /accounts/count-active`
- `GET /accounts/count-login`
- `GET /accounts/count-by-role`

## 3. Projects
- `GET /projects/list`
- `GET /projects/detail/{projectId}`
- `POST /projects/create`
- `DELETE /projects/delete/{projectId}`

## 4. Tasks
- `GET /tasks/list`
- `GET /tasks/search`
- `GET /tasks/detail/{taskId}`
- `POST /tasks/create`
- `PUT /tasks/update/{taskId}`
- `PATCH /tasks/update-status/{taskId}`
- `DELETE /tasks/delete`

## 5. Notifications
- `POST /notifications/admin/create`
- `GET /notifications/admin/list`
- `DELETE /notifications/admin/{notificationId}`
- `GET /notifications/my/list`
- `PATCH /notifications/{notificationId}/read`

## 6. Chat
### Direct
- `GET /chats/contacts`
- `GET /chats/conversation/{otherUserId}`
- `POST /chats/send`

### Group
- `GET /chats/groups`
- `POST /chats/groups`
- `GET /chats/groups/{groupId}/conversation`
- `POST /chats/groups/{groupId}/send`

## 7. Dashboard
- `GET /dashboard/stats`

## 8. Labels / Roles
- `GET /labels/list/{projectId}`
- `POST /labels/create`
- `PUT /labels/update/{labelId}`
- `DELETE /labels/delete`
- `GET /roles/list`

## 9. Pagination convention
- Request: `page`, `size`
- Response: `items`, `totalElements`, `totalPages`, `page`, `size`, `hasNext`, `hasPrevious`

## 10. Auth header
Voi endpoint can login:
- `Authorization: Bearer <access_token>`
