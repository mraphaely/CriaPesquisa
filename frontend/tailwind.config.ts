import type { Config } from "tailwindcss";
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="escuro"]'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
