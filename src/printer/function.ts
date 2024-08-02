import type { Ast } from "@syuilo/aiscript";
import { type Doc, type ParserOptions, doc } from "prettier";
import type { Node } from "../node";
import type { AstPath } from "../types";
import { printBlock } from "./block";

const { group, line, softline, indent, join } = doc.builders;

export const printFunction = (
	path: AstPath<Ast.Fn>,
	options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	return [
		"(",
		group([
			indent([
				softline,
				join(
					[",", line],
					path.map(arg => {
						const { node } = arg;
						if (node.argType == null) return node.name;
						return [node.name, ": ", arg.call(print, "argType")];
					}, "args"),
				),
			]),
			softline,
		]),
		")",
		path.node.retType == null ? "" : [": ", path.call(print, "retType")],
		" ",
		printBlock(path, options, print, "children"),
	];
};
