import { type Doc, doc, type ParserOptions } from "prettier";
import type * as dst from "../dst";
import type { AstPath } from "../types";

const { group, conditionalGroup, line, softline, indent, join } = doc.builders;

export const printCall = (
	path: AstPath<dst.Call>,
	options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	return [
		path.call(print, "callee"),
		"(",
		printArguments(path, options, print),
		")",
	];
};

export const printArguments = (
	path: AstPath<dst.Call>,
	_options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const args = join([",", line], path.map(print, "args"));

	if (path.node.args.length < 2) {
		return args;
	}

	const argsWithIndent = [
		indent([softline, args]),
		// 末尾カンマは不許可
		// ifBreak(","),
		softline,
	];

	const lastArg = args.at(-1)!;

	if (doc.utils.canBreak(lastArg)) {
		return conditionalGroup([
			[...args.slice(0, -1), group(lastArg, { shouldBreak: true })],
			argsWithIndent,
		]);
	}

	return group(argsWithIndent);
};
