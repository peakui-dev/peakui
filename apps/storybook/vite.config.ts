import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import {defineConfig} from "vite";

/*
 * Storybook (builder-vite) подхватывает этот конфиг сам. Плагины здесь, а не в viteFinal:
 * builder видит уже объявленный react-плагин и не добавляет второй.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
