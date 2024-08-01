import type { Ast } from "@syuilo/aiscript";
import { type Doc, type ParserOptions, doc } from "prettier";
import { assert } from "emnorst";
import type { Node } from "../node";
import type { AstPath } from "../types";
import { needsParens } from "../needs-parens";
import { printFunction } from "./function";
import { printBlock } from "./block";
import { printString, printTemplate } from "./string";

const { group, line, softline, hardline, indent, ifBreak, join } = doc.builders;

export const printExpression = (
	path: AstPath<Ast.Expression>,
	options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const doc = printExpressionWithoutParens(path, options, print);

	if (needsParens(path, options)) {
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
			if (options.originalText.startsWith("eval", options.locStart(node))) {
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
			if (Number.isInteger(node.value)) {
				// toStringだと巨大な数が1+e10のような指数表記になってしまうため、一旦BigIntに変換
				return BigInt(node.value).toString();
			}
			// TODO: floatのprint
			throw new Error("not implemented.");
		case "bool":
			return node.value ? "true" : "false";
		case "null":
			return "null";
		case "arr":
			dev: assert.as<AstPath<typeof node>>(path);
			return group([
				"[",
				indent([
					softline,
					join([",", line], path.map(print, "value")),
					ifBreak(","),
				]),
				softline,
				"]",
			]);
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
			return [path.call(print, "left"), " && ", path.call(print, "right")];
		case "or":
			dev: assert.as<AstPath<typeof node>>(path);
			return [path.call(print, "left"), " || ", path.call(print, "right")];
		case "call":
			dev: assert.as<AstPath<typeof node>>(path);
			return printCall(path, options, print);
		case "index":
			dev: assert.as<AstPath<typeof node>>(path);
			return [
				path.call(print, "target"),
				"[",
				indent([softline, path.call(print, "index")]),
				softline,
				"]",
			];
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

const printObject = (
	path: AstPath<Ast.Obj>,
	_options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	if (node.value.size === 0) {
		return "{}";
	}

	const entries: [key: string, value: Doc][] = [];

	const { stack } = path;
	const length = stack.length;
	try {
		for (const [key, value] of node.value) {
			stack.push(key, value);
			entries.push([key, print(path)]);
			stack.length -= 2;
		}
	} finally {
		stack.length = length;
	}

	return group([
		"{",
		indent([
			line,
			join(
				[",", line],
				entries.map(([key, value]) => [key, ": ", value]),
			),
			ifBreak(","),
		]),
		line,
		"}",
	]);
};

const printCall = (
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
