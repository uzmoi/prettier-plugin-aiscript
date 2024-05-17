import type { Ast } from "@syuilo/aiscript";
import { parse } from "@syuilo/aiscript/parser/parser.js";
import type { Comment } from "./node";

// コメントの構文
// https://github.com/aiscript-dev/aiscript/blob/master/src/parser/parser.peggy#L30

/**
 * aiscript <= 0.18.0 のパーサーのプリプロセスの差分を利用したコメントパーサー
 */
export const parseCommentsByPreprocessDiff = (source: string): Comment[] => {
	// parseの型付けが弱く、anyが返ってくるので型を指定する。
	// このプリプロセスによってコメントが消えた文字列が得られる。
	const preprocessedString: string = parse(source, { startRule: "Preprocess" });

	const comments: Ast.Loc[] = [];

	// slc/mlc: single/multi line comment
	let state: null | { type: "slc" | "mlc"; start: number } = null;

	for (let i = 0, j = 0; i < source.length; i++) {
		if (state === null) {
			// Preprocessで消えている（source[i] !== preprocessedString[j]）ならコメント。
			// source[i] === "/"の場合、直後のPreprocessで消えていない`/`の可能性があるため、
			// 次の文字も見る必要がある。
			// e.g. source=`1/**//2`, preprocessedString=`1/2`
			if (
				source[i] === preprocessedString[j] &&
				(source[i] !== "/" || source[i + 1] === preprocessedString[j + 1])
			) {
				j++;
				continue;
			}

			switch (source.slice(i, i + 2)) {
				case "//":
					state = { type: "slc", start: i };
					break;
				case "/*":
					state = { type: "mlc", start: i };
					break;
				default:
					// sourceとpreprocessedStringが一致せずコメントでもない、すなわち
					// 閉じタグが無い無効なコメントによってiとjがズレている。
					// e.g. source=`/**//*`, preprocessedString=`/*`
					// このようなソースはastパーサーでエラーが出るので、さっさとreturnしてエラーを出してもらう。
					return [];
			}
		} else if (
			(state.type === "slc" && source[i + 1] === "\n") ||
			(state.type === "mlc" && source.endsWith("*/", i + 1))
		) {
			comments.push({ start: state.start, end: i + 1 });
			state = null;
		}
	}

	// 最後の行にslcがあると改行文字が無いのでstateが残る
	if (state !== null) {
		comments.push({ start: state.start, end: source.length });
	}

	return comments.map(range => ({
		type: "comment",
		value: source.slice(range.start, range.end),
		loc: range,
	}));
};

export const correctLocation = <T extends { loc?: Ast.Loc }>(
	node: T,
	comments: Iterable<Comment>,
): T => {
	if (!node.loc) return node;

	let { start, end } = node.loc;

	// AiScriptのパーサーがendに最後の文字のindexを入れるので+1する。
	end++;

	for (const { loc, value } of comments) {
		// コメントの位置がnodeのendよりも前ならendをずらす。
		if (loc.start >= end) break;
		end += value.length;

		// コメントの位置がnodeのstartよりも前ならstartをずらす。
		// そうでないなら、まだコメントがnodeの内側にある可能性があるのでcontinue。
		if (loc.start > start) continue;
		start += value.length;
	}

	const loc = { start, end };

	return { ...node, loc };
};
