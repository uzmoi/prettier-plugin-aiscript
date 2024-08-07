import type { Ast } from "@syuilo/aiscript";
import { type Doc, type ParserOptions, doc } from "prettier";
import type { Node } from "../node";
import type { AstPath } from "../types";
import { printDanglingComments } from "./comment";

const { group, softline, line, indent, ifBreak, join } = doc.builders;

export const printArray = (
	path: AstPath<Ast.Arr>,
	options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	return group([
		"[",
		indent([
			softline,
			join([",", line], path.map(print, "value")),
			ifBreak(","),
		]),
		printDanglingComments(path, options),
		softline,
		"]",
	]);
};
