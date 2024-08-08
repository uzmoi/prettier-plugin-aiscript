import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
	base: "https://uzmoi.github.io/prettier-plugin-aiscript/",
	plugins: [svelte()],
	resolve: {
		alias: {
			prettier: "prettier/standalone",
		},
	},
	esbuild: {
		keepNames: true,
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
