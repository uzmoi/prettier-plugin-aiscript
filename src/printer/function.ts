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
) => {
	return [
		"(",
		group([
			indent([
				softline,
				join(
					[",", line],
					path.node.args.map(arg => arg.name),
				),
			]),
			softline,
		]),
		") ",
		printBlock(path, options, print, "children"),
	];
};
