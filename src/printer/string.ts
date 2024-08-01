import type { Ast } from "@syuilo/aiscript";
import type { Doc, ParserOptions } from "prettier";
import type { Node } from "../node";
import type { AstPath } from "../types";

export const printString = (
	path: AstPath<Ast.Str>,
	options: ParserOptions<Node>,
): Doc => {
	const { node } = path;

	return options.singleQuote ?
			`'${node.value.replace(/'/g, "\\'")}'`
		:	`"${node.value.replace(/"/g, '\\"')}"`;
};

export const printTemplate = (
	path: AstPath<Ast.Tmpl>,
	_options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	return [
		"`",
		path.map(
			part =>
				typeof part.node === "string" ?
					part.node.replace(/[`{]/g, "\\$&")
				:	["{", print(part as AstPath<Ast.Expression>), "}"],
			"tmpl",
		),
		"`",
	];
};
