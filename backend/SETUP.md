# Hướng dẫn cấu hình Backend

## Bước 1: Cài đặt dependencies
```bash
cd backend
npm install
```

## Bước 2: Cấu hình môi trường

### 2.1. Copy file .env.example
```bash
cp .env.example .env
```

### 2.2. Cập nhật thông tin trong file `.env`

#### Database (đã có sẵn)
- `DATABASE_URL`: Kết nối Supabase PostgreSQL

#### JWT Secret (đã có sẵn)
- `JWT_SECRET`: Key để mã hóa JWT token

#### Email Configuration (cần cấu hình)

**Quan trọng**: Đây là **App Password** của Gmail, không phải mật khẩu thường!

##### Cách tạo Gmail App Password:

1. **Bật 2-Step Verification**:
   - Truy cập: https://myaccount.google.com/security
   - Tìm "2-Step Verification" và bật lên

2. **Tạo App Password**:
   - Truy cập: https://myaccount.google.com/apppasswords
   - Chọn app: **Mail**
   - Chọn device: **Other** → đặt tên "GameHub Backend"
   - Click **Generate**
   - Copy mật khẩu 16 ký tự (dạng: `abcd efgh ijkl mnop`)

3. **Cập nhật vào .env**:
   ```env
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop
   ```

##### Lưu ý bảo mật:
- ⚠️ **File `.env` đã được thêm vào `.gitignore`** → không bị commit lên Git
- ⚠️ **Mỗi developer nên dùng email riêng** cho môi trường development
- ⚠️ **Không share App Password** với người khác
- ⚠️ **Có thể thu hồi App Password** bất cứ lúc nào tại: https://myaccount.google.com/apppasswords

## Bước 3: Chạy server

### Development mode (auto-reload)
```bash
npm run dev
```

### Production mode
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

## Bước 4: Test API

### Test health check:
```bash
curl http://localhost:3000/api/health
```

### Test forgot password (cần có App Password):
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## Troubleshooting

### Lỗi: "Invalid login: 535-5.7.8 Username and Password not accepted"
→ Bạn đang dùng mật khẩu thường của Gmail thay vì App Password. Hãy tạo App Password theo hướng dẫn trên.

### Lỗi: "Less secure app access"
→ Gmail đã ngừng hỗ trợ "Less secure apps". Bắt buộc phải dùng App Password.

### App Password không xuất hiện
→ Bạn cần bật 2-Step Verification trước. Truy cập: https://myaccount.google.com/security
