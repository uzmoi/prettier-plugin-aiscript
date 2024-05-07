import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
    base: "https://uzmoi.github.io/prettier-plugin-aiscript/",
    plugins: [svelte()],
});
