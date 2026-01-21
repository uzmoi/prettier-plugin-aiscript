import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	minify: {
		compress: {
			dropLabels: ["dev"],
			joinVars: false,
		},
		mangle: false,
		codegen: false,
	},
	platform: "neutral",
});
