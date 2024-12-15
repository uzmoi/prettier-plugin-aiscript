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

	if (node.elements.length === 0 && !hasComments(node)) {
		return "[]";
	}

	const first = node.elements[0];
	const shouldBreak = util.hasNewlineInRange(
		options.originalText,
		options.locStart(node),
		first == null ? options.locEnd(node) : options.locStart(first),
	);

	return group(
		[
			"[",
			indent([
				softline,
				join([",", line], path.map(print, "elements")),
				ifBreak(","),
			]),
			printDanglingComments(path, options),
			softline,
			"]",
		],
		{ shouldBreak },
	);
};
