import { util, type Doc, type ParserOptions, doc } from "prettier";
import type * as dst from "../dst";
import type { AstPath } from "../types";
import { hasComments, printDanglingComments } from "./comment";

const { group, softline, line, indent, ifBreak, join } = doc.builders;

export const printArray = (
	path: AstPath<dst.ArrayLiteral>,
	options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	const isEmpty = node.elements.length === 0;

	if (isEmpty && !hasComments(node)) {
		return "[]";
	}

	const shouldBreak = util.hasNewlineInRange(
		options.originalText,
		options.locStart(node),
		isEmpty ? options.locEnd(node) : options.locStart(node.elements[0]!),
	);

	return group(
		[
			"[",
			indent([
				softline,
				join([",", line], path.map(print, "elements")),
				isEmpty ? printDanglingComments(path, options) : ifBreak(","),
			]),
			softline,
			"]",
		],
		{ shouldBreak },
	);
};
