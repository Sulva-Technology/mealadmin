import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
const project = fileURLToPath(new URL('../../../', import.meta.url));
export default defineConfig({ root, publicDir: `${project}/public`, plugins: [react()], resolve: { alias: { '@': project } }, define: { 'process.env.NEXT_PUBLIC_API_URL': 'undefined' }, server: { host: '127.0.0.1', port: 3100, strictPort: true, fs: { allow: [project] } } });
