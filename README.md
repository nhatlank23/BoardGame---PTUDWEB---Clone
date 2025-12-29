# 🚀 Backend Project Documentation

## 📌 Giới thiệu

Đây là backend của hệ thống game (REST API) được xây dựng theo mô hình MVC sử dụng:

- **Node.js + Express**
- **Knex.js** (Query Builder)
- **Supabase** (PostgreSQL)
- **JWT Authentication**
- **Bcrypt**
- **Git & GitHub** cho teamwork

## 📂 Cấu trúc thư mục dự án

```
backend/
├── src/
│   ├── configs/            # Cấu hình hệ thống
│   │   ├── db.js           # Khởi tạo kết nối Knex với Supabase
│   │   └── auth.js         # JWT Secret, JWT config
│   │
│   ├── controllers/        # Xử lý logic nghiệp vụ (Controller - MVC)
│   │   ├── authController.js    # Đăng ký, đăng nhập
│   │   ├── userController.js    # Profile, bạn bè, tin nhắn
│   │   ├── gameController.js    # Lưu/Load game, logic computer
│   │   └── adminController.js   # Quản lý user, thống kê hệ thống
│   │
│   ├── models/             # Tương tác Database (Model - MVC)
│   │   ├── userModel.js
│   │   ├── gameModel.js
│   │   ├── scoreModel.js
│   │   └── socialModel.js
│   │
│   ├── routes/             # Định nghĩa các API Endpoint
│   │   ├── index.js        # Tổng hợp routes
│   │   ├── authRoutes.js
│   │   ├── gameRoutes.js
│   │   └── adminRoutes.js
│   │
│   ├── middlewares/        # Middleware xử lý trung gian
│   │   ├── authMiddleware.js    # Kiểm tra JWT
│   │   ├── roleMiddleware.js    # Phân quyền Admin/User
│   │   └── errorMiddleware.js   # Xử lý lỗi tập trung
│   │
│   ├── utils/              # Helper functions
│   │   ├── hashPassword.js      # Hash mật khẩu (bcrypt)
│   │   └── validator.js         # Validate input
│   │
│   ├── db/
│   │   ├── migrations/     # Knex migrations (tạo bảng)
│   │   └── seeds/          # Seed dữ liệu mẫu
│   │
│   └── app.js              # Entry point của Express app
│
├── .env                    # Biến môi trường (KHÔNG push lên Git)
├── .gitignore              # Ignore node_modules, .env
├── knexfile.js             # Cấu hình Knex
├── package.json
└── README.md
```

## 🧠 Kiến trúc tổng quát (MVC)

```
Client (Frontend)
        ↓
     Routes
        ↓
   Controller
        ↓
      Model
        ↓
    Database
```

- **Routes**: Định tuyến API
- **Controller**: Xử lý logic
- **Model**: Truy vấn DB bằng Knex
- **Middleware**: Auth, Role, Error handling

## 🔐 Quy tắc bảo mật

- Không commit file `.env`
- Token JWT gửi qua `Authorization: Bearer <token>`
- Password luôn được hash bằng **bcrypt**
- Route admin phải qua `roleMiddleware`

## 🌱 Flow làm việc với Git & GitHub (BẮT BUỘC)

### 1️⃣ Quy tắc chung

- **KHÔNG** code trực tiếp trên `main`
- Mỗi task → 1 branch
- Mỗi Pull Request → 1 người review

### 2️⃣ Khởi tạo project (chỉ làm 1 lần)

```bash
git clone <repo-url>
cd backend
npm install
```

### 3️⃣ Tạo branch mới cho task

```bash
git checkout -b feature/auth-login
```

**📌 Quy ước đặt tên branch:**
- `feature/...` → tính năng mới
- `fix/...` → sửa bug
- `refactor/...` → tối ưu code
- `docs/...` → tài liệu

### 4️⃣ Code & commit

```bash
git status
git add .
git commit -m "feat: implement login API"
```

**📌 Commit message chuẩn:**
- `feat:` thêm tính năng
- `fix:` sửa lỗi
- `refactor:` cải tiến code
- `docs:` cập nhật tài liệu

### 5️⃣ Push & tạo Pull Request

```bash
git push origin feature/auth-login
```

**Tạo Pull Request lên `main`**

Mô tả rõ:
- Làm gì
- API nào
- Có breaking change không

### 6️⃣ Review & Merge

- Ít nhất 1 người approve
- Resolve conflict (nếu có)
- Sau khi merge → xóa branch

## 🧪 Migration & Seed Database

**Chạy migration:**
```bash
npx knex migrate:latest
```

**Chạy seed:**
```bash
npx knex seed:run
```

## ▶️ Chạy project

```bash
npm run dev
```

**Server chạy tại:** `http://localhost:3000`

## 📌 Quy tắc code

- Không logic DB trong Controller
- Không validate trong Model
- Middleware dùng cho:
  - Auth
  - Role
  - Error
- Mỗi file 1 nhiệm vụ rõ ràng

## 🤝 Team Workflow Summary

```
Task → Branch → Code → Commit → PR → Review → Merge
```