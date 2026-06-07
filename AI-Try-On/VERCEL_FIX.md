# Vercel Deployment Fix - AI-Try-On

## 🔴 Vấn đề
Khi deploy AI-Try-On lên Vercel, Frontend gặp lỗi:
```
Error fetching products: SyntaxError: Unexpected token '<', " <!DOCTYPE "... is not valid JSON
```

## 🔍 Nguyên nhân
Frontend đang gọi `/api/products/fetch-by-ids` nhưng:
1. **Không có API URL configuration** - Frontend không biết Backend API nằm ở đâu
2. **Backend không được integrate** - vercel.json chỉ handle Frontend, không rewrite `/api` requests
3. **Vercel trả về HTML error page** - Khi request `/api/*`, Vercel không tìm thấy route nên trả về 404 HTML
4. **Frontend parse HTML thành JSON** - Dẫn đến lỗi "Unexpected token '<'"

## ✅ Giải pháp được thực hiện

### 1. **Tạo API Client Centralized** (`Frontend/lib/apiClient.ts`)
```typescript
const API_BASE_URL = process.env.VITE_API_URL || '';

// Centralized API calls với error handling
export const api = {
  get: (endpoint) => apiCall(endpoint, { method: 'GET' }),
  post: (endpoint, data) => apiCall(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  // ... PUT, PATCH, DELETE
};
```

### 2. **Thêm Environment Variables**
- **`.env.production`** - Config cho production deployment
  - `VITE_API_URL=""` - Empty (relative URL) vì Backend cùng deployment
  - `MONGODB_URI`, `CLOUDINARY_*`, `GEMINI_API_KEY` - Sensitive data
  
### 3. **Cập nhật vite.config.ts**
- Expose `process.env.VITE_API_URL` để Frontend access được
- Remove `process.env.API_KEY` (dùng `GEMINI_API_KEY` thay thế)

### 4. **Cập nhật tất cả API calls**
- **HistoryContext.tsx** - 10 fetch calls thay thế bằng `api.get/post/put/patch/delete`
- **Home.tsx** - 3 fetch calls thay thế bằng `api.post/get`

### 5. **Cấu hình vercel.json cho Full-Stack Deployment**
```json
{
  "builds": [
    {
      "src": "Backend/server.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist",
        "buildCommand": "npm run build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "Backend/server.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html",
      "status": 200
    }
  ]
}
```

### 6. **Cập nhật package.json Scripts**
- `build`: Compile TypeScript + build Vite
- `build:backend`: Chỉ compile Backend
- `build:frontend`: Chỉ build Frontend

## 📋 Các files đã sửa
1. ✅ `.env.production` - Created
2. ✅ `Frontend/lib/apiClient.ts` - Created
3. ✅ `vite.config.ts` - Updated
4. ✅ `Frontend/context/HistoryContext.tsx` - Updated (10 fetch → api calls)
5. ✅ `Frontend/pages/Home.tsx` - Updated (3 fetch → api calls)
6. ✅ `vercel.json` - Updated (full-stack config)
7. ✅ `package.json` - Updated (build scripts)

## 🚀 Cách deploy

### Option 1: Deploy toàn bộ AI-Try-On lên Vercel
```bash
cd AI-Try-On
npm install
npm run build
# Then push to GitHub và link với Vercel
```

**Vercel Settings:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `VITE_API_URL` = "" (empty for relative URLs)
  - `MONGODB_URI` = "your-mongodb-url"
  - `GEMINI_API_KEY` = "your-gemini-key"
  - `CLOUDINARY_*` = "your-cloudinary-credentials"
  - `JWT_SECRET` = "your-secret"

### Option 2: Deploy Backend riêng (Advanced)
Nếu muốn deploy Backend riêng lẻ trên Vercel khác:
1. Update `VITE_API_URL` = "https://your-backend.vercel.app"
2. Deploy Backend với vercel.json config từ `/backend` folder

## ✨ Lợi ích
- ✅ Centralized API handling
- ✅ Environment-aware API URLs
- ✅ Better error handling
- ✅ Full-stack deployment support
- ✅ Dễ dàng switch giữa local dev (port 3000) và production

## 🧪 Testing trước deploy
```bash
# Local development
npm run dev

# Build & preview production
npm run build
npm run preview
```

## 📝 Lưu ý
- Đảm bảo `.env.production` không commit lên Git
- Tất cả environment variables cần set trong Vercel Dashboard
- Khi thay đổi API endpoints, update `apiClient.ts` + `api.ts` routes
