import { type Cst, Parser } from "@syuilo/aiscript";
import { visitNode } from "@syuilo/aiscript/parser/visit.js";
import {
	correctLocation,
	parseCommentsByPreprocessDiff,
} from "./parse-comments";
import type { Root } from "./node";

export const parserPlugin =
	(f: (node: Cst.Node) => Cst.Node) => (nodes: Cst.Node[]) =>
		nodes.map(node => visitNode(node, f));

export const parse = (text: string): Root => {
	const comments = parseCommentsByPreprocessDiff(text);

	const parser = new Parser();

	// HACK: 糖衣構文のノードにはlocが無い。
	// TODO: 次のアップデートで修正されるので、ソースを見るように変更する。
	parser.addPlugin(
		"transform",
		parserPlugin(node =>
			(
				node.loc == null &&
				node.type === "call" &&
				node.target.loc == null &&
				node.args.length === 2
			) ?
				{ ...node, sugar: true }
			:	node,
		),
	);

	parser.addPlugin(
		"transform",
		parserPlugin(node => correctLocation(node, comments)),
	);

	const body = parser.parse(text);

	return { type: "root", body, comments };
};
