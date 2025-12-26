import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // تحميل ملفات البيئة (.env) من المجلد الرئيسي
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // حل مشكلة process.env: نقوم بتعريف المتغيرات ليفهمها المتصفح
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        // يسمح لك باستخدام @ للإشارة للمجلد الرئيسي في الـ imports
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // إعدادات اختيارية لضمان عمل السيرفر بشكل مستقر
      port: 3000,
      host: true,
      open: true
    }
  };
});