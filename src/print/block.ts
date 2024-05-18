import { doc, util, type Doc, type ParserOptions } from "prettier";
import type { Ast } from "@syuilo/aiscript";
import type { Node } from "../node";
import type { AstPath } from "../types";

const { group, indent, line, hardline } = doc.builders;

export const printBlock = (
	path: AstPath<Ast.Namespace | Ast.Block | Ast.Fn | Ast.Loop>,
	options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
	key: "statements" | "children" | "members" = "statements",
) => {
	return group([
		"{",
		indent([
			line,
			path.call(path => printStatementSequence(path, options, print), key),
		]),
		line,
		"}",
	]);
};

export const printStatementSequence = (
	path: AstPath<Node[]>,
	options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;
	const result: Doc[] = [];

	path.each((path, index) => {
		result.push(print(path));

		const isLast = index === node.length - 1;
		if (isLast) return;
		result.push(hardline);

		const { originalText, locEnd } = options;
		if (util.isNextLineEmpty(originalText, locEnd(path.node))) {
			result.push(hardline);
		}
	});

	return result;
};
