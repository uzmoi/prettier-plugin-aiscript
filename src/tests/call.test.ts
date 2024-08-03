import dedent from "dedent";
import { describe, expect, test } from "vitest";
import { format } from "./utils";

const callCases = Object.entries({
	"f()": "f()",
	"f(0)": "f(0)",
	"f(0, 1)": "f(0, 1)",

	引数が一つならbreakしてもインデントしない: dedent`
		f(@() {
			//
		})
	`,
	最後の引数がbreakしてもインデントしない: dedent`
		f(arg1, arg2, @() {
			//
		})
	`,
	一行が長ければインデントする: dedent`
		Namespace:function(
			long_argument_expression_one,
			long_argument_expression_two,
			@() {
				//
			}
		)
	`,
	それ以外でbreakしたらインデントする: dedent`
		f(
			arg1,
			arg2,
			@() {
				//
			},
			arg_last
		)
	`,
});

describe("call", () => {
	test.each(callCases)("%s", async (_, source) => {
		expect(await format(source, { useTabs: true })).toBe(`${source}\n`);
	});
});
