import type { Ast } from "@syuilo/aiscript";
import { type Doc, type ParserOptions, doc } from "prettier";
import type { Node } from "../node";
import type { AstPath } from "../types";

const { join, line } = doc.builders;

export const printTypeSource = (
	path: AstPath<Ast.TypeSource>,
	_options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
) => {
	const { node } = path;

	switch (node.type) {
		case "namedTypeSource":
			return node.inner != null ?
					[node.name, "<", path.call(print, "inner"), ">"]
				:	node.name;
		case "fnTypeSource":
			return [
				"@(",
				join([",", line], path.map(print, "args")),
				") => ",
				path.call(print, "result"),
			];
	}
};
