import { type Doc, doc, type ParserOptions } from "prettier";
import type * as dst from "../dst";
import type { AstPath } from "../types";

const { group, fill, line, ifBreak, indent } = doc.builders;

export const binaryOperator = (lhs: Doc, op: string, rhs: Doc): Doc => {
	return fill([lhs, group(ifBreak(" \\")), indent([line, op, " "]), rhs]);
};

export const printBinaryOperator = (
	path: AstPath<dst.BinaryOperator>,
	_options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	return binaryOperator(
		path.call(print, "lhs"),
		path.node.operator,
		path.call(print, "rhs"),
	);
};
