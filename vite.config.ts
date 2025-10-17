// frontend/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const buildVersion = new Date().toISOString().replace(/[:.]/g, "-");

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    {
      name: "html-transform",
      transformIndexHtml(html) {
        return html
          .replace(/__BUILD_VERSION__/g, buildVersion)
          .replace(/(<script[^>]*src="[^"]*\.js")/g, `$1?v=${buildVersion}`)
          .replace(/(<link[^>]*href="[^"]*\.css")/g, `$1?v=${buildVersion}`);
      }
    }
  ]
});