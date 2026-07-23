import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Não observar public/: evita crash EBUSY do watcher com arquivos travados
  // pelo OneDrive (a pasta public é servida estaticamente, não precisa de HMR).
  server: { port: 5173, watch: { ignored: ["**/public/**"] } },
  test: { globals: true, environment: "jsdom", setupFiles: ["./vitest.setup.ts"] },
});
