import { Ast } from "@syuilo/aiscript";
import { assert } from "emnorst";
import { type Doc, type ParserOptions, doc } from "prettier";
import type { Node } from "../node";
import type { AstPath } from "../types";
import { printBlock, printStatementSequence } from "./block";
import { printDanglingComments } from "./comment";
import { printExpression } from "./expression";
import { printStatement } from "./statement";

const { hardline } = doc.builders;

export const printAiScript = (
	path: AstPath,
	options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	switch (node.type) {
		case "root":
			dev: assert.as<AstPath<typeof node>>(path);
			return [
				path.call(path => printStatementSequence(path, options, print), "body"),
				printDanglingComments(path, options),
				hardline,
			];
		case "ns":
			dev: assert.as<AstPath<typeof node>>(path);
			return [`:: ${node.name} `, printBlock(path, options, print, "members")];
		case "meta":
			dev: assert.as<AstPath<typeof node>>(path);
			return [
				"### ",
				node.name ? ` ${node.name}` : "",
				path.call(print, "value"),
			];
		case "namedTypeSource":
		case "fnTypeSource":
			throw new Error("not implemented.");
		default:
			if (Ast.isStatement(node)) {
				return printStatement(path as AstPath<typeof node>, options, print);
			}
			if (
				node.type === "not" ||
				node.type === "and" ||
				node.type === "or" ||
				Ast.isExpression(node)
			) {
				return printExpression(path as AstPath<typeof node>, options, print);
			}
			throw new TypeError(
				`Unknown node type: '${(node as { type: string }).type}'.`,
			);
	}
};
