# Game App UI - React + Vite

Ứng dụng game platform được xây dựng với **React** và **Vite** (không sử dụng framework Next.js).

## Công nghệ sử dụng

- **React 18** - Thư viện UI
- **Vite** - Build tool và dev server
- **React Router** - Routing
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Component primitives
- **Lucide React** - Icons

## Cấu trúc thư mục

```
├── public/           # Static assets
├── src/
│   ├── components/   # Reusable components
│   │   ├── ui/       # UI components (buttons, cards, etc.)
│   │   ├── header.tsx
│   │   └── sidebar.tsx
│   ├── pages/        # Page components
│   │   ├── Landing.tsx
│   │   ├── Home.tsx
│   │   ├── Auth.tsx
│   │   ├── Profile.tsx
│   │   ├── Ranking.tsx
│   │   ├── Friends.tsx
│   │   ├── Messages.tsx
│   │   ├── GamePlay.tsx
│   │   ├── GameSettings.tsx
│   │   └── admin/    # Admin pages
│   ├── hooks/        # Custom hooks
│   ├── lib/          # Utilities
│   ├── App.tsx       # Main app component với routing
│   └── main.tsx      # Entry point
├── index.html        # HTML template
├── vite.config.ts    # Vite configuration
└── package.json
```

## Cài đặt

```bash
npm install
```

## Development

Chạy development server:

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:5173`

## Build

Build cho production:

```bash
npm run build
```

Files build sẽ được tạo trong thư mục `dist/`

## Preview Production Build

Xem trước bản build production:

```bash
npm run preview
```

## Routing

Ứng dụng sử dụng React Router với các routes sau:

- `/` - Landing page
- `/home` - Home page (danh sách game)
- `/auth` - Đăng nhập / Đăng ký
- `/profile` - Trang cá nhân
- `/ranking` - Bảng xếp hạng
- `/friends` - Danh sách bạn bè
- `/messages` - Tin nhắn
- `/game/:gameId/play` - Chơi game
- `/game/:gameId/settings` - Cài đặt game
- `/admin/dashboard` - Admin dashboard
- `/admin/games` - Quản lý games
- `/admin/games/:gameId/config` - Config game
- `/admin/users` - Quản lý users

## Các thay đổi từ Next.js sang React

### 1. Routing

- **Trước**: Next.js App Router (file-based)
- **Sau**: React Router (component-based trong App.tsx)

### 2. Links

- **Trước**: `<Link href="/path">`
- **Sau**: `<Link to="/path">`

### 3. Navigation hooks

- **Trước**: `useRouter()` từ `next/navigation`
- **Sau**: `useNavigate()` từ `react-router-dom`

### 4. Path params

- **Trước**: `useParams()` từ `next/navigation`
- **Sau**: `useParams()` từ `react-router-dom`

### 5. Current path

- **Trước**: `usePathname()` từ `next/navigation`
- **Sau**: `useLocation()` từ `react-router-dom`

### 6. Import paths

- Giữ nguyên alias `@/` đã được config trong `vite.config.ts` và `tsconfig.json`

## Notes

- Không còn sử dụng `"use client"` directive (chỉ dành cho Next.js)
- Không có server-side rendering (SSR) - ứng dụng chạy hoàn toàn ở client
- Images có thể đặt trong thư mục `public/`
- Environment variables sử dụng prefix `VITE_` thay vì `NEXT_PUBLIC_`
