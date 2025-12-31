import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // ใช้ชื่อ repo สำหรับ GitHub Pages
  const repoName = env.GH_REPO_NAME || "Vehicle-Status-";

  // Vercel จะมี env var ชื่อ VERCEL
  const isVercel = !!process.env.VERCEL;

  return {
    // ✅ Vercel = '/', GitHub Pages = '/<repo>/'
    base: mode === "production" ? (isVercel ? "/" : `/${repoName}/`) : "/",

    server: {
      port: 3000,
      host: "0.0.0.0",
    },

    plugins: [react()],

    // ✅ อย่าฝังคีย์ลง bundle ฝั่ง client (ใช้ /api/gemini แทน)
    define: {},

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
