import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
	base: "https://uzmoi.github.io/prettier-plugin-aiscript/",
	plugins: [svelte()],
	resolve: {
		alias: {
			prettier: "prettier/standalone",
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					"prettier-standalone": ["prettier"],
					aiscript: ["@syuilo/aiscript"],
				},
			},
			treeshake: {
				preset: "smallest",
				moduleSideEffects(id) {
					return /\/website\/src\/main.ts$/.test(id);
				},
			},
		},
	},
});
