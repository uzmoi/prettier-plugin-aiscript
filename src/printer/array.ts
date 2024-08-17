import type { Ast } from "@syuilo/aiscript";
import { util, type Doc, type ParserOptions, doc } from "prettier";
import type { Node } from "../node";
import type { AstPath } from "../types";
import { hasComments, printDanglingComments } from "./comment";

const { group, softline, line, indent, ifBreak, join } = doc.builders;

export const printArray = (
	path: AstPath<Ast.Arr>,
	options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	if (node.value.length === 0 && !hasComments(node)) {
		return "[]";
	}

	const [first] = node.value;
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
				join([",", line], path.map(print, "value")),
				ifBreak(","),
			]),
			printDanglingComments(path, options),
			softline,
			"]",
		],
		{ shouldBreak },
	);
};
