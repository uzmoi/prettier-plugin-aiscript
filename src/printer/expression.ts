import type { Ast } from "@syuilo/aiscript";
import { assert } from "emnorst";
import { type Doc, type ParserOptions, doc } from "prettier";
import { needsParens } from "../needs-parens";
import type { Node } from "../node";
import type { AstPath } from "../types";
import { getNodeSourceCode, startsWith } from "../utils";
import { printArray } from "./array";
import { printBlock } from "./block";
import { printCall } from "./call";
import { printFunction } from "./function";
import { printObject } from "./object";
import { printBinaryOperator } from "./operator";
import { printString, printTemplate } from "./string";

const { group, softline, hardline, indent, join } = doc.builders;

export const printExpression = (
	path: AstPath<Ast.Expression>,
	options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const doc = printExpressionWithoutParens(path, options, print);

	if (needsParens(path)) {
		return group(["(", indent([softline, doc]), softline, ")"]);
	}

	return doc;
};

export const printExpressionWithoutParens = (
	path: AstPath<Ast.Expression>,
	options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	switch (node.type) {
		case "if":
			dev: assert.as<AstPath<typeof node>>(path);
			return printIf(path, options, print);
		case "match":
			dev: assert.as<AstPath<typeof node>>(path);
			return printMatch(path, options, print);
		case "block": {
			dev: assert.as<AstPath<typeof node>>(path);
			const block = printBlock(path, options, print);
			if (startsWith("eval", node, options)) {
				return ["eval ", block];
			}
			return block;
		}
		case "identifier":
			return node.name;

		// literals
		case "str":
			dev: assert.as<AstPath<typeof node>>(path);
			return printString(path, options);
		case "tmpl":
			dev: assert.as<AstPath<typeof node>>(path);
			return printTemplate(path, options, print);
		case "num":
			if (Number.isSafeInteger(node.value)) {
				return node.value.toString();
			}
			return getNodeSourceCode(node, options) || node.value.toString();
		case "bool":
			return node.value ? "true" : "false";
		case "null":
			return "null";
		case "arr":
			dev: assert.as<AstPath<typeof node>>(path);
			return printArray(path, options, print);
		case "obj":
			dev: assert.as<AstPath<typeof node>>(path);
			return printObject(path, options, print);
		case "fn":
			dev: assert.as<AstPath<typeof node>>(path);
			return group(["@", printFunction(path, options, print)]);

		// operators
		case "exists":
			dev: assert.as<AstPath<typeof node>>(path);
			return ["exists ", path.call(print, "identifier")];
		case "not":
			dev: assert.as<AstPath<typeof node>>(path);
			return ["!", path.call(print, "expr")];
		case "and":
			dev: assert.as<AstPath<typeof node>>(path);
			return printBinaryOperator("&&", path, options, print);
		case "or":
			dev: assert.as<AstPath<typeof node>>(path);
			return printBinaryOperator("||", path, options, print);
		case "call":
			dev: assert.as<AstPath<typeof node>>(path);
			return printCall(path, options, print);
		case "index":
			dev: assert.as<AstPath<typeof node>>(path);
			return group([
				path.call(print, "target"),
				"[",
				indent([softline, path.call(print, "index")]),
				softline,
				"]",
			]);
		case "prop":
			dev: assert.as<AstPath<typeof node>>(path);
			// 改行やスペースは不許可
			return [path.call(print, "target"), ".", node.name];
	}
};

const printIf = (
	path: AstPath<Ast.If>,
	_options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	return group([
		"if (",
		path.call(print, "cond"),
		") ",
		path.call(print, "then"),
		path.map(
			a => [" elif (", a.call(print, "cond"), ") ", a.call(print, "then")],
			"elseif",
		),
		...(node.else ? [" else ", path.call(print, "else")] : []),
	]);
};

const printMatch = (
	path: AstPath<Ast.Match>,
	_options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	return group([
		"match (",
		path.call(print, "about"),
		") {",
		indent([
			hardline,
			join(
				hardline,
				path.map(q => [q.call(print, "q"), " => ", q.call(print, "a")], "qs"),
			),
			...(node.default ? [hardline, "* => ", path.call(print, "default")] : []),
		]),
		hardline,
		"}",
	]);
};
