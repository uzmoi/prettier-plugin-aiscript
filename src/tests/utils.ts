import * as prettier from "prettier";
import plugin from "..";

export const format = (source: string, options?: prettier.Options) =>
	prettier.format(source, {
		parser: "aiscript",
		plugins: [plugin],
		...options,
	});

// biome-ignore lint/performance/noBarrelFile: in test.
export { parserPlugin } from "../parser/utils";
