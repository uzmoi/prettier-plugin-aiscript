import { Parser } from "@syuilo/aiscript";
import { describe, expect, test } from "vitest";
import { format, parserPlugin } from "../../tests/utils";

const cases = Object.entries({
	expression: Object.entries({
		"if-then": "if (cond) { 'then' }",
		"if-then-else": "if (cond) { 'then' } else { 'else' }",
		"if-then-elif-else":
			"if (cond1) { 'then1' } elif (cond2) { 'then2' } else { 'else' }",
		match: "match n { 0 => 'zero' 1 => 'one' * => 'default' }",
		eval: "eval { 0 }",
		exists: "exists foo",
		not: "!a",
		and: "a && b",
		or: "a || b",
		index: "array[index]",
		prop: "object.prop",
		print: "<: 'Hello AiScript!'",
	}),
	括弧: Object.entries({
		call: "(a + b)()",
		property: "(a + b).prop",
		index: "(a + b)[index]",

		function: "(@() {})()",
		exists: "(exists a) || b",
		eval: "(eval { a }).b",
		not: "(!a).b",

		高優先度: "(1 + 2) / (3 + 4)",
		"同優先度 右結合": "1 - (2 + 3)",
	}),
});

const parser = new Parser();

parser.addPlugin(
	"transform",
	// biome-ignore lint: in test.
	parserPlugin(node => (delete node.loc, node)),
);

describe.concurrent("フォーマットがASTを変更しないこと。", () => {
	describe.each(cases)("%s", (_, cases) => {
		test.each(cases)("%s", async (_, source) => {
			const formatted = await format(source);
			try {
				expect(parser.parse(formatted)).toStrictEqual(parser.parse(source));
			} catch {
				expect(formatted).toBe(`${source}\n`);
			}
		});
	});
});
