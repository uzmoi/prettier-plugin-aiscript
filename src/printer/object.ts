import { util, type Doc, type ParserOptions, doc } from "prettier";
import type * as dst from "../dst";
import type { AstPath } from "../types";
import { hasComments, printDanglingComments } from "./comment";

const { group, line, indent, ifBreak, join } = doc.builders;

export const printObject = (
	path: AstPath<dst.ObjectLiteral>,
	options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	if (node.properties.length === 0 && !hasComments(node)) {
		return "{}";
	}

	const first = node.properties[0];
	const shouldBreak = util.hasNewlineInRange(
		options.originalText,
		options.locStart(node),
		first == null ? options.locEnd(node) : options.locStart(first.value),
	);

	return group(
		[
			"{",
			indent([
				line,
				join(
					[",", line],
					path.map(
						path => [path.call(print, "key"), ": ", path.call(print, "value")],
						"properties",
					),
				),
				ifBreak(","),
			]),
			printDanglingComments(path, options),
			line,
			"}",
		],
		{ shouldBreak },
	);
};
