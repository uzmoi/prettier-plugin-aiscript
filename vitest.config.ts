import { defineConfig, coverageConfigDefaults } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			enabled: true,
			exclude: [...coverageConfigDefaults.exclude, "website/**"],
		},
	},
});
