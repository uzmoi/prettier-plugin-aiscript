import { type Doc, doc, type ParserOptions, util } from "prettier";
import type * as dst from "../dst";
import type { AstPath } from "../types";
import { hasComments, printDanglingComments } from "./comment";
import { semi } from "./semi";

const { group, indent, line, hardline } = doc.builders;

export const printBlock = (
	path: AstPath<dst.Block>,
	options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	if (node.body.length === 0 && !hasComments(node)) {
		return "{}";
	}

	const shouldBreak = util.hasNewlineInRange(
		options.originalText,
		options.locStart(node),
		node.body.length > 0 ?
			options.locStart(node.body[0]!)
		:	options.locEnd(node),
	);

	return group(
		[
			"{",
			indent([
				line,
				printDanglingComments(path, options),
				printStatementSequence(path, options, print),
			]),
			line,
			"}",
		],
		{ shouldBreak },
	);
};

export const printStatementSequence = (
	path: AstPath<Extract<dst.Node, { body: dst.Node[] }>>,
	options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;
	const result: Doc[] = [];

	path.each((path, index) => {
		result.push(print(path));

		const isLast = index === node.body.length - 1;
		// Blockの中 かつ 最後 かつ 式 のときはセミコロンを省略する。
		if (
			node.type !== "Block" ||
			!isLast ||
			path.node.type !== "ExpressionStatement"
		) {
			result.push(semi(path.node, options));
		}
		if (isLast) return;
		result.push(hardline);

		const { originalText, locEnd } = options;
		if (util.isNextLineEmpty(originalText, locEnd(path.node))) {
			result.push(hardline);
		}
	}, "body");

	return result;
};
