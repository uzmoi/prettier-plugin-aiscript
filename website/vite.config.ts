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
});
