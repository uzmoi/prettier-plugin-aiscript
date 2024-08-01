import { describe, expect, test } from "vitest";
import dedent from "dedent";
import { format } from "./util";

describe("comment", () => {
	test("single line", async () => {
		const source = "// comment\n";
		expect(await format(source)).toBe(source);
	});
	test("multi line", async () => {
		const source = dedent`
			/*
			multi
			line
			comment
			*/\n
		`;
		expect(await format(source)).toBe(source);
	});
	test("leading line", async () => {
		const source = dedent`
			// comment
			let foo = 0\n
		`;
		expect(await format(source)).toBe(source);
	});
	test("end of line", async () => {
		const source = "let foo = 0 // comment\n";
		expect(await format(source)).toBe(source);
	});
	test("trailing line", async () => {
		const source = dedent`
			let foo = 0
			// comment\n
		`;
		expect(await format(source)).toBe(source);
	});
	test("empty block", async () => {
		const source = "@() { /* comment */ }\n";
		expect(await format(source)).toBe(source);
	});
	test("comment only source", async () => {
		const source = "// comment\n";
		expect(await format(source)).toBe(source);
	});
});

test("prettier-ignore comment", async () => {
	const source = dedent`
		// prettier-ignore
		    ::
		 n
		   {
		        @f(

		     ) {
		         }
		   }
	`;
	expect(await format(source)).toMatchInlineSnapshot(`
		"// prettier-ignore
		::
		 n
		   {
		        @f(

		     ) {
		         }
		   }
		"
	`);
});
