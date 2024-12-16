import type { Doc, ParserOptions } from "prettier";
import type * as dst from "../dst";
import type { AstPath } from "../types";

export const printString = (
	path: AstPath<dst.StringLiteral>,
	options: ParserOptions<dst.Node>,
): Doc => {
	const { value } = path.node;

	const includesSingleQuote = value.includes("'");
	const includesDoubleQuote = value.includes('"');

	const isSingleQuote =
		options.singleQuote ?
			!includesSingleQuote || includesDoubleQuote
		:	!includesSingleQuote && includesDoubleQuote;

	return isSingleQuote ?
			`'${value.replace(/['\\]/g, "\\$&")}'`
		:	`"${value.replace(/["\\]/g, "\\$&")}"`;
};

export const printTemplate = (
	path: AstPath<dst.Template>,
	_options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	return [
		"`",
		path.map(
			part =>
				part.node.type === "TemplatePart" ?
					part.node.content.replace(/[`{\\]/g, "\\$&")
				:	["{", print(part as AstPath<dst.Expression>), "}"],
			"parts",
		),
		"`",
	];
};
