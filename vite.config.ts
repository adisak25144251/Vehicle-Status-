import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const REPO_NAME = "Vehicle-Status-";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    // ✅ GitHub Pages (project pages) ต้องเป็น "/ชื่อrepo/"
    base: mode === "production" ? `/${REPO_NAME}/` : "/",

    server: {
      port: 3000,
      host: true,
    },

    plugins: [react()],

    define: {
      // ✅ กันหน้าเว็บขาวจาก error: process / process.env not defined
      "process.env": {},

      // (คงของเดิมไว้ให้ backward-compatible)
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY ?? ""),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY ?? ""),
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },

    // ✅ เปิด sourcemap ช่วยดู error ใน Console ได้ชัด (ถ้าอยากปิดทีหลังค่อยลบออก)
    build: {
      sourcemap: true,
    },
  };
});
