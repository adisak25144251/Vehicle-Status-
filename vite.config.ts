import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // ✅ สำหรับ GitHub Pages: ต้องเป็น "/ชื่อrepo/"
  // ถ้าคุณใช้ repo ชื่อ Vehicle-Statuts ก็ปล่อยตามนี้ได้เลย
  const repoName = env.GH_REPO_NAME || 'Vehicle-Statuts';

  return {
    base: mode === 'production' ? `/${repoName}/` : '/',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    // ⚠️ เตือน: ตรงนี้จะ "ฝังคีย์ลงไฟล์ JS" เมื่อ build
    // GitHub Pages เป็น static hosting => เก็บ secret ไม่ได้แบบปลอดภัย
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? ''),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
