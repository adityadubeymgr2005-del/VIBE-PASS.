import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // or your framework plugin

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',   // point explicitly to your index.html
      },
    },
  },
});