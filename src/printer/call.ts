import type { Ast } from "@syuilo/aiscript";
import { type Doc, type ParserOptions, doc } from "prettier";
import type { Node } from "../node";
import type { AstPath } from "../types";

const { group, line, softline, indent, join } = doc.builders;

export const printCall = (
	path: AstPath<Ast.Call>,
	_options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;
	const { target } = node;

	if (target.type === "identifier") {
		// <:演算子
		if (
			target.name === "print" &&
			target.loc &&
			target.loc.start === node.loc?.start &&
			target.loc.end === node.loc?.end
		) {
			return ["<: ", path.call(print, "args", 0)];
		}

		// 糖衣構文の二項演算子
		if (node.sugar) {
			const lhs = path.call(print, "args", 0);
			const rhs = path.call(print, "args", 1);

			// https://github.com/aiscript-dev/aiscript/blob/master/src/parser/plugins/infix-to-fncall.ts#L87
			const op = {
				"Core:mul": "*",
				"Core:pow": "^",
				"Core:div": "/",
				"Core:mod": "%",
				"Core:add": "+",
				"Core:sub": "-",
				"Core:eq": "==",
				"Core:neq": "!=",
				"Core:lt": "<",
				"Core:gt": ">",
				"Core:lteq": "<=",
				"Core:gteq": ">=",
			}[target.name];

			return [lhs, ` ${op} `, rhs];
		}
	}

	// 通常の関数呼び出し
	// 末尾カンマは不許可

	return group([
		path.call(print, "target"),
		"(",
		indent([softline, join([",", line], path.map(print, "args"))]),
		softline,
		")",
	]);
};
