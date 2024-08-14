import type { Ast } from "@syuilo/aiscript";
import { type Doc, type ParserOptions, doc } from "prettier";
import type { Node } from "../node";
import type { AstPath } from "../types";

const { group, fill, line, ifBreak, indent } = doc.builders;

export const binaryOperator = (lhs: Doc, op: string, rhs: Doc): Doc => {
	return fill([lhs, group(ifBreak(" \\")), indent([line, op, " "]), rhs]);
};

export const printBinaryOperator = (
	op: string,
	path: AstPath<{
		left: Ast.Expression;
		right: Ast.Expression;
	}>,
	_options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	return binaryOperator(
		path.call(print, "left"),
		op,
		path.call(print, "right"),
	);
};
