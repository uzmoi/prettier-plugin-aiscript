import type { Ast } from "@syuilo/aiscript";
import { LinesAndColumns } from "lines-and-columns";
import type { Comment } from "../dst";

export const parseCommentsByStringLocations = (
	source: string,
	stringLocations: readonly Ast.Loc[],
): Comment[] => {
	const lines = new LinesAndColumns(source);

	// 文字列リテラルを同じ長さの空白に置き換え。
	const sourceWithoutStrings = stringLocations.reduce(
		(source, { start, end }) => {
			// aiscript は両方 1-origin
			// lines-and-columns は両方 0-origin
			const s = lines.indexForLocation({
				line: start.line - 1,
				column: start.column - 1,
			});
			const e = lines.indexForLocation({
				line: end.line - 1,
				column: end.column - 1,
			});

			if (s == null || e == null) {
				throw new Error("Internal: Invalid location");
			}

			return source.slice(0, s) + " ".repeat(e - s) + source.slice(e);
		},
		source,
	);

	const commentMatches = sourceWithoutStrings.matchAll(/\/\/.*|\/\*[^]*?\*\//g);

	return Array.from(
		commentMatches,
		({ 0: match, index }): Comment => ({
			type: "Comment",
			value: match,
			loc: { start: index, end: index + match.length },
		}),
	);
};
