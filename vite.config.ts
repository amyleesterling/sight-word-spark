import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { devTtsPlugin } from "./server/dev-tts-plugin";

// Static build (dist/) + Cloudflare Pages Function in functions/api/tts.ts.
// The devTtsPlugin mirrors that function locally so `npm run dev` has working audio
// when OPENAI_API_KEY is set in the shell environment.
export default defineConfig({
  plugins: [react(), devTtsPlugin()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "server/**/*.test.ts", "shared/**/*.test.ts"],
  },
});
