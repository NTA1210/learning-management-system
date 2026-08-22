# LMS Frontend (FE_LMS)

Modern, responsive Single Page Application (SPA) for the Learning Management System (LMS), built with **React 19**, **Vite**, and **TypeScript**.

---

## 🛠️ Tech Stack & Libraries

- **Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Lucide React, Bootstrap Icons
- **State Management**: Zustand, Jotai
- **Server State & Data Fetching**: TanStack React Query v5, Axios
- **Real-Time Communication**: Socket.io Client
- **Interactive & Analytics**: Three.js, React Three Fiber, Recharts
- **Content & Markdown**: React Markdown, Remark GFM, DOMPurify
- **OAuth**: `@react-oauth/google`

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in `FE_LMS/` (or copy `.env.development`):
```ini
VITE_BASE_API=http://localhost:4004
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm run preview
```
