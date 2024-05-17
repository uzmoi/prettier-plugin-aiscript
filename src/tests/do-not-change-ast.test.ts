import { test, expect, describe } from "vitest";
import { Parser } from "@syuilo/aiscript";
import { format, parserPlugin } from "./util";

const cases = Object.entries({
	literal: Object.entries({
		null: "null",
		true: "true",
		false: "false",
		int: "42",
		float: "6.28",
		string: "'foo\\''",
		template: "`foo {bar}\\``",
		array: "[1, 2, 3, 4]",
		object: "{ zero: 0, one: 1, two: 2 }",
		function: "@(a, b) { a + b }",
	}),
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
		call: "add(1, 2)",
	}),
	statement: Object.entries({
		"function-decoration": "@add(a, b) { a + b }",
		return: "return result",
		let: "let a = 0",
		var: "var a = 0",
		assign: "a = 0",
		"add-assign": "a += 0",
		"sub-assign": "a -= 0",
		"for-times": "for times { 'body' }",
		"for-let-to": "for let i, times { 'body' }",
		"for-let-from-to": "for let i = from, to { 'body' }",
		each: "each let item, items { 'body' }",
		loop: "loop { 'body' }",
		break: "break",
		continue: "continue",
	}),
	"top-level": Object.entries({
		meta: "### { foo: 'bar' }",
		namespace: ":: ns { let foo = 0 }",
	}),
	括弧: Object.entries({
		高優先度: "(1 + 2) / (3 + 4)",
		"同優先度 右結合": "1 - (2 + 3)",
	}),
});

const parser = new Parser();

parser.addPlugin(
	"transform",
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
