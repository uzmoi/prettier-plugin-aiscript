import { util, type Doc, type ParserOptions, doc } from "prettier";
import type * as dst from "../dst";
import type { AstPath } from "../types";
import { hasComments, printDanglingComments } from "./comment";

const { fill, group, line, indent, ifBreak, join } = doc.builders;

export const printObject = (
	path: AstPath<dst.ObjectLiteral>,
	options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	const isEmpty = node.properties.length === 0;

	if (isEmpty && !hasComments(node)) {
		return "{}";
	}

	const shouldBreak = util.hasNewlineInRange(
		options.originalText,
		options.locStart(node),
		isEmpty ?
			options.locEnd(node)
		:	options.locStart(node.properties[0]!.value),
	);

	return group(
		[
			"{",
			indent([
				line,
				join(
					[",", line],
					path.map(
						path =>
							fill([
								path.call(print, "key"),
								":",
								indent([line, path.call(print, "value")]),
							]),
						"properties",
					),
				),
				isEmpty ? printDanglingComments(path, options) : ifBreak(","),
			]),
			line,
			"}",
		],
		{ shouldBreak },
	);
};
