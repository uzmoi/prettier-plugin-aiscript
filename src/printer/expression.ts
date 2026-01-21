import { assert } from "emnorst";
import { type Doc, doc, type ParserOptions } from "prettier";
import type * as dst from "../dst";
import { needsParens } from "../needs-parens";
import type { AstPath } from "../types";
import { getNodeSourceCode } from "../utils";
import { printArray } from "./array";
import { printCall } from "./call";
import { printFunction } from "./function";
import { printObject } from "./object";
import { printBinaryOperator } from "./operator";
import { printString, printTemplate } from "./string";

const { group, softline, hardline, indent, join } = doc.builders;

export const printExpressionWithParens = (
	path: AstPath<dst.Expression>,
	options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const doc = printExpression(path, options, print);

	if (needsParens(path)) {
		return group(["(", indent([softline, doc]), softline, ")"]);
	}

	return doc;
};

export const printExpression = (
	path: AstPath<dst.Expression>,
	options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	switch (node.type) {
		case "Identifier":
			return node.name;
		case "NullLiteral":
			return "null";
		case "BoolLiteral":
			return node.value ? "true" : "false";
		case "NumberLiteral":
			if (Number.isSafeInteger(node.value)) {
				return node.value.toString();
			}
			return getNodeSourceCode(node, options);
		case "StringLiteral":
			dev: assert.as<AstPath<typeof node>>(path);
			return printString(path, options);
		case "Template":
			dev: assert.as<AstPath<typeof node>>(path);
			return printTemplate(path, options, print);
		case "ArrayLiteral":
			dev: assert.as<AstPath<typeof node>>(path);
			return printArray(path, options, print);
		case "ObjectLiteral":
			dev: assert.as<AstPath<typeof node>>(path);
			return printObject(path, options, print);
		case "UnaryOperator":
			dev: assert.as<AstPath<typeof node>>(path);
			return [
				node.operator,
				/\w/.test(node.operator) ? " " : "",
				path.call(print, "body"),
			];
		case "BinaryOperator":
			dev: assert.as<AstPath<typeof node>>(path);
			return printBinaryOperator(path, options, print);
		case "Fn":
			dev: assert.as<AstPath<typeof node>>(path);
			return group(["@", printFunction(path, options, print)]);
		case "Call":
			dev: assert.as<AstPath<typeof node>>(path);
			return printCall(path, options, print);
		case "Index":
			dev: assert.as<AstPath<typeof node>>(path);
			return group([
				path.call(print, "target"),
				"[",
				path.call(print, "index"),
				"]",
			]);
		case "Prop":
			dev: assert.as<AstPath<typeof node>>(path);
			// 改行やスペースは不許可
			return [path.call(print, "target"), ".", node.name.name];
		case "If":
			dev: assert.as<AstPath<typeof node>>(path);
			return printIf(path, options, print);
		case "Match":
			dev: assert.as<AstPath<typeof node>>(path);
			return printMatch(path, options, print);
		case "EvalBlock":
			dev: assert.as<AstPath<typeof node>>(path);
			return ["eval ", path.call(print, "body")];
		default:
			throw new Error(
				`Unknown node type: ${(node satisfies never as { type: string }).type}`,
			);
	}
};

const printIf = (
	path: AstPath<dst.If>,
	_options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	return group([
		"if (",
		path.call(print, "condition"),
		") ",
		path.call(print, "then"),
		path.map(
			a => [" elif (", a.call(print, "condition"), ") ", a.call(print, "then")],
			"elseif",
		),
		...(node.else ? [" else ", path.call(print, "else")] : []),
	]);
};

const printMatch = (
	path: AstPath<dst.Match>,
	_options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	return group([
		"match (",
		path.call(print, "value"),
		") {",
		indent([
			hardline,
			join(
				hardline,
				path.map(q => {
					return [
						q.node.pattern == null ?
							"default"
						:	["case ", q.call(print, "pattern")],
						" => ",
						q.call(print, "body"),
						",",
					];
				}, "cases"),
			),
		]),
		hardline,
		"}",
	]);
};
