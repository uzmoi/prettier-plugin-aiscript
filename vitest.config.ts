import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			enabled: true,
			reportOnFailure: true,
			exclude: [...coverageConfigDefaults.exclude, "website/**"],
		},
	},
});
