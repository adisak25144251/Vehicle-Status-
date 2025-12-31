import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // ✅ GitHub Pages repo name (ของคุณคือ Vehicle-Status-)
  // สามารถ override ได้ด้วย GH_REPO_NAME ใน .env.production ถ้าต้องการ
  const repoName = env.GH_REPO_NAME || "Vehicle-Status-";

  return {
    // ✅ สำคัญสำหรับ GitHub Pages: ต้องเป็น "/ชื่อrepo/"
    base: mode === "production" ? `/${repoName}/` : "/",

    server: {
      port: 3000,
      host: "0.0.0.0",
    },

    plugins: [react()],

    // ⚠️ จะฝังคีย์ลง bundle ฝั่ง client
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY ?? ""),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY ?? ""),
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
