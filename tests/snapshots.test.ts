import { Parser } from "@syuilo/aiscript";
import { describe, test } from "vitest";
import { emptyNsPlugin } from "../src/parser";
import { format, parserPlugin } from "./utils";

const cases = import.meta.glob<string>("./src/*.ais", {
	eager: true,
	query: "raw",
	import: "default",
});

const parser = new Parser();

// @ts-expect-error
parser.plugins.validate.unshift(emptyNsPlugin());

parser.addPlugin(
	"transform",
	// @ts-expect-error
	// biome-ignore lint: in test.
	parserPlugin(node => (delete node.loc, delete node.operatorLoc, node)),
);

describe.concurrent.each(
	Object.entries(cases).map(([path, source]) => {
		const name = path.replace(/^.*\/([^/]+)\.ais$/, "$1");
		return [name, source] as const;
	}),
)("%s", (_, source) => {
	test("snapshot", async ({ expect }) => {
		expect(await format(source)).toMatchSnapshot();
	});

	test("ast no change", async ({ expect }) => {
		const formatted = await format(source);
		expect(parser.parse(formatted)).toStrictEqual(parser.parse(source));
	});
});
