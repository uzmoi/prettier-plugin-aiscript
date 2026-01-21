import { type Doc, doc, type ParserOptions } from "prettier";
import type * as dst from "../dst";
import type { AstPath } from "../types";

const { group, line, softline, indent, join } = doc.builders;

export const printFunction = (
	path: AstPath<dst.Fn | dst.FnDefinition>,
	_options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	return [
		"(",
		group([
			indent([
				softline,
				join(
					[",", line],
					path.map(param => {
						return [
							param.call(print, "dest"),
							param.node.ty == null ? "" : [": ", param.call(print, "ty")],
						];
					}, "params"),
				),
			]),
			softline,
		]),
		")",
		path.node.returnTy == null ? "" : [": ", path.call(print, "returnTy")],
		" ",
		path.call(print, "body"),
	];
};
