import { AISCRIPT_VERSION } from "@syuilo/aiscript";
import { describe, expect, test } from "vitest";
import type { Comment } from "../node";
import {
	correctLocation,
	parseCommentsByPreprocessDiff,
	parseCommentsByStringLocations,
} from "./parse-comments";

const range = (start: number, end: number) => ({ start, end });
const comment = (value: string, start: number): Comment => ({
	type: "comment",
	value,
	loc: range(start, start + value.length),
});

describe.runIf(AISCRIPT_VERSION === "0.19.0")(
	"parseCommentsByStringLocations",
	() => {
		test("文字列中のコメントを無視", () => {
			expect(
				parseCommentsByStringLocations('"/**/"', [{ start: 0, end: 6 }]),
			).toEqual([]);
		});
		test("連続したコメント", () => {
			expect(parseCommentsByStringLocations("/**//**/", [])).toEqual([
				comment("/**/", 0),
				comment("/**/", 4),
			]);
		});
	},
);

describe.skipIf(AISCRIPT_VERSION === "0.19.0")(
	"parseCommentsByPreprocessDiff",
	() => {
		test("文字列中のコメントを無視", () => {
			expect(parseCommentsByPreprocessDiff('"/**/"')).toEqual([]);
		});
		test("連続したコメント", () => {
			expect(parseCommentsByPreprocessDiff("/**//**/")).toEqual([
				comment("/**/", 0),
				comment("/**/", 4),
			]);
		});
		test("コメントの直後にコメント以外の/", () => {
			expect(parseCommentsByPreprocessDiff("1/**//2")).toEqual([
				comment("/**/", 1),
			]);
		});
	},
);

describe("correctLocation", () => {
	const loc = range(100, 200);
	const node = { loc: range(loc.start, loc.end - 1) };

	test("indexのズレを吸収するために +1", () => {
		expect(correctLocation(node, [])).toEqual({ loc });
	});
	test("コメントがnodeの前にあれば両方加算", () => {
		expect(correctLocation(node, [comment("// comment", loc.start)])).toEqual({
			loc: range(loc.start + 10, loc.end + 10),
		});
	});
	test("コメントがnodeの中にあればendだけ加算", () => {
		expect(
			correctLocation(node, [
				comment("// comment", loc.start + 10),
				comment("// comment", loc.end - 10),
			]),
		).toEqual({ loc: range(loc.start, loc.end + 20) });
	});
	test("コメントがnodeの後ろにあれば加算しない", () => {
		expect(correctLocation(node, [comment("// comment", loc.end)])).toEqual({
			loc,
		});
	});
});
