/// <reference types="vite/client" />
declare module "prerender-node";

interface ImportMetaEnv {
  readonly VITE_BASE_API: string;
  // thêm các biến khác nếu có, ví dụ:
  // readonly VITE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
