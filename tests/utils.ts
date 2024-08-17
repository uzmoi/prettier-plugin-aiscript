import * as prettier from "prettier";
import plugin from "../src";

export const format = (source: string, options?: prettier.Options) =>
	prettier.format(source, {
		parser: "aiscript",
		plugins: [plugin],
		...options,
	});

// biome-ignore lint/performance/noBarrelFile: in test.
export { parserPlugin } from "../src/parser/utils";
