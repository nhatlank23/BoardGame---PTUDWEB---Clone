#  Backend 



Backend xây dựng theo mô hình MVC sử dụng:

- **Node.js + Express**
- **Knex.js** (Query Builder)
- **Supabase** (PostgreSQL)
- **JWT Authentication**
- **Bcrypt**
- **Git & GitHub** cho teamwork

##  Cấu trúc thư mục dự án

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
├── .env                    # Biến môi trường 
├── .gitignore              # Ignore node_modules, .env
├── knexfile.js             # Cấu hình Knex
├── package.json
└── README.md
```

## Flow làm việc với Git & GitHub 

### Quy tắc chung

- **KHÔNG** code trực tiếp trên `main`
- Mỗi task → 1 branch
- Mỗi Pull Request → 1 người review

### Khởi tạo project 

```bash
git clone <repo-url>
cd backend
npm install
```

### Tạo branch mới cho task

```bash
git checkout -b feature/auth-login
```

### Code & commit

```bash
git status
git add .
git commit -m "feat: implement login API"
```


###  Push & tạo Pull Request

```bash
git push origin feature/auth-login
```

**Tạo Pull Request lên `main`**


###  Review & Merge

- Ít nhất 1 người approve
- Resolve conflict 

##  Migration & Seed Database

**Chạy migration:**
```bash
npx knex migrate:latest
```

**Chạy seed:**
```bash
npx knex seed:run
```

**Server chạy tại:** `http://localhost:3000`


## flow:
```
Task → Branch → Code → Commit → PR → Review → Merge
```
