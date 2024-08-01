import type { Ast } from "@syuilo/aiscript";
import { type Doc, type ParserOptions, doc } from "prettier";
import type { Node } from "../node";
import type { AstPath } from "../types";

const { group, line, indent, ifBreak, join } = doc.builders;

export const printObject = (
	path: AstPath<Ast.Obj>,
	_options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	if (node.value.size === 0) {
		return "{}";
	}

	const entries: [key: string, value: Doc][] = [];

	const { stack } = path;
	const length = stack.length;
	try {
		for (const [key, value] of node.value) {
			stack.push(key, value);
			entries.push([key, print(path)]);
			stack.length -= 2;
		}
	} finally {
		stack.length = length;
	}

	return group([
		"{",
		indent([
			line,
			join(
				[",", line],
				entries.map(([key, value]) => [key, ": ", value]),
			),
			ifBreak(","),
		]),
		line,
		"}",
	]);
};
