import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
			// Proxy uploaded files (logos, images) to backend in dev mode
			'/api/uploads': {
				target: process.env.PUBLIC_BACKEND_URL || 'http://localhost:3015',
				changeOrigin: true
			},
			// Proxy admin API to backend (authentication via Express sessions)
			'/api/admin': {
				target: process.env.PUBLIC_BACKEND_URL || 'http://localhost:3015',
				changeOrigin: true
			}
		}
	}
});
