import { assert } from "emnorst";
import { type Doc, doc, type ParserOptions } from "prettier";
import type * as dst from "../dst";
import type { AstPath } from "../types";
import { printStatementSequence } from "./block";
import { printDanglingComments } from "./comment";
import { printExpressionWithParens } from "./expression";
import { printStatement } from "./statement";
import { printTypeSource } from "./type-source";

const { line, hardline, indent, group } = doc.builders;

export const printAiScript = (
	path: AstPath,
	options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	switch (node.type) {
		case "Script":
			dev: assert.as<AstPath<typeof node>>(path);
			return [
				printStatementSequence(path, options, print),
				printDanglingComments(path, options),
				hardline,
			];
		case "Namespace":
			dev: assert.as<AstPath<typeof node>>(path);
			if (node.body.length === 0) {
				return `:: ${node.name.name} {}`;
			}
			return group([
				`:: ${node.name.name} {`,
				indent([line, printStatementSequence(path, options, print)]),
				line,
				"}",
			]);
		case "Meta":
			dev: assert.as<AstPath<typeof node>>(path);
			return [
				"### ",
				node.name ? [node.name.name, " "] : "",
				path.call(print, "value"),
			];
		case "TypeReference":
		case "FnType":
			dev: assert.as<AstPath<typeof node>>(path);
			return printTypeSource(path, options, print);
		default:
			return (
				printStatement(path as AstPath<dst.Statement>, options, print) ??
				printExpressionWithParens(
					path as AstPath<dst.Expression>,
					options,
					print,
				)
			);
	}
};
