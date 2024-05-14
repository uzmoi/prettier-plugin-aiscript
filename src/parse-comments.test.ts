import { describe, expect, test } from "vitest";
import { correctLocation } from "./parse-comments";

const range = (start: number, end: number) => ({ start, end });

describe("correctLocation", () => {
	const loc = range(100, 200);
	const node = { loc: range(loc.start, loc.end - 1) };

	test("indexのズレを吸収するために +1", () => {
		expect(correctLocation(node, [])).toEqual({ loc });
	});
	test("コメントがnodeの前にあれば両方加算", () => {
		expect(
			correctLocation(node, [[range(loc.start, loc.start + 10), "// comment"]]),
		).toEqual({
			loc: range(loc.start + 10, loc.end + 10),
		});
	});
	test("コメントがnodeの中にあればendだけ加算", () => {
		expect(
			correctLocation(node, [
				[range(loc.start + 10, loc.start + 20), "// comment"],
				[range(loc.end - 10, loc.end), "// comment"],
			]),
		).toEqual({ loc: range(loc.start, loc.end + 20) });
	});
	test("コメントがnodeの後ろにあれば加算しない", () => {
		expect(
			correctLocation(node, [[range(loc.end, loc.end + 10), "// comment"]]),
		).toEqual({ loc });
	});
});
