import type { Ast } from "@syuilo/aiscript";
import { parse } from "@syuilo/aiscript/parser/parser.js";

// コメントの構文
// https://github.com/aiscript-dev/aiscript/blob/master/src/parser/parser.peggy#L30

const getCommentLocations = (source: string, preprocessedString: string) => {
	const comments: Ast.Loc[] = [];

	let state: null | { type: "slc" | "mlc"; start: number } = null;

	for (let i = 0, j = 0; i < source.length; i++) {
		if (state === null) {
			if (source[i] === preprocessedString[j++]) continue;

			switch (source.slice(i, i + 2)) {
				case "//":
					state = { type: "slc", start: i };
					break;
				case "/*":
					state = { type: "mlc", start: i };
					break;
				default:
					throw new Error("Preprocessにコメント以外の差分が存在します。");
			}
		} else if (
			(state.type === "slc" && source[i] === "\n") ||
			(state.type === "mlc" && source.slice(i - 2, i) === "*/")
		) {
			comments.push({ start: state.start, end: i });
			state = null;
		}
	}

	return comments;
};

export const parseComments = (source: string): [Ast.Loc, string][] => {
	const preprocessedString = parse(source, { startRule: "Preprocess" });

	return getCommentLocations(source, preprocessedString).map(range => [
		range,
		source.slice(range.start, range.end),
	]);
};

export const correctLocation = <T extends { loc?: Ast.Loc }>(
	node: T,
	comments: Iterable<readonly [Ast.Loc, string]>,
): T => {
	if (!node.loc) return node;

	let { start, end } = node.loc;

	// AiScriptのパーサーがendに最後の文字のindexを入れるので+1する。
	end++;

	for (const [loc, { length }] of comments) {
		// コメントの位置がnodeのendよりも前ならendをずらす。
		if (loc.start >= end) break;
		end += length;

		// コメントの位置がnodeのstartよりも前ならstartをずらす。
		// そうでないなら、まだコメントがnodeの内側にある可能性があるのでcontinue。
		if (loc.start > start) continue;
		start += length;
	}

	const loc = { start, end };

	return { ...node, loc };
};
