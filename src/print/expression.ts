import type { Ast } from "@syuilo/aiscript";
import { type AstPath, type Doc, type ParserOptions, doc } from "prettier";
import type { Node } from "../node";
import { printFunction } from "./function";
import { printBlock } from "./block";

const { group, line, softline, hardline, indent, ifBreak, join } = doc.builders;

export const printExpression = (
	path: AstPath<Node> & { node: Ast.Expression },
	options: ParserOptions<Ast.Node>,
	print: (path: AstPath<Ast.Node>) => Doc,
): Doc => {
	const { node } = path;

	switch (node.type) {
		case "if":
			return printIf(path as AstPath<Node> & { node: Ast.If }, options, print);
		case "match":
			return printMatch(
				path as AstPath<Node> & { node: Ast.Match },
				options,
				print,
			);
		case "block":
			return printBlock(path as AstPath<Ast.Node>, options, print);
		case "identifier":
			return node.name;

		// literals
		case "str":
			return options.singleQuote ?
					`'${node.value.replace(/'/g, "\\'")}'`
				:	`"${node.value.replace(/"/g, '\\"')}"`;
		case "tmpl":
			return printTemplate(
				path as AstPath<Node> & { node: Ast.Tmpl },
				options,
				print,
			);
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
			return printObject(
				path as AstPath<Node> & { node: Ast.Obj },
				options,
				print,
			);
		case "fn":
			return group([
				"@",
				printFunction(
					path as AstPath<Ast.Node> & { node: Ast.Fn },
					options,
					print,
				),
			]);

		// operators
		case "exists":
			return ["exists ", path.call(print, "identifier")];
		case "not":
			return ["!", path.call(print, "expr")];
		case "and":
			return [path.call(print, "left"), " && ", path.call(print, "right")];
		case "or":
			return [path.call(print, "left"), " || ", path.call(print, "right")];
		case "call":
			return printCall(path, node, print);
		case "index":
			return [
				path.call(print, "target"),
				"[",
				indent([softline, path.call(print, "index")]),
				softline,
				"]",
			];
		case "prop":
			// 改行やスペースは不許可
			return [path.call(print, "target"), ".", node.name];
	}
};

const printIf = (
	path: AstPath<Node> & { node: Ast.If },
	_options: ParserOptions<Ast.Node>,
	print: (path: AstPath<Ast.Node>) => Doc,
): Doc => {
	const { node } = path;

	return group([
		"if ",
		path.call(print, "cond"),
		" ",
		path.call(print, "then"),
		path.map(
			a => [" elif ", a.call(print, "cond"), " ", a.call(print, "then")],
			"elseif",
		),
		...(node.else ?
			[
				" else ",
				path.call(elseBody => print(elseBody as AstPath<Ast.Node>), "else"),
			]
		:	[]),
	]);
};

const printMatch = (
	path: AstPath<Node> & { node: Ast.Match },
	_options: ParserOptions<Ast.Node>,
	print: (path: AstPath<Ast.Node>) => Doc,
): Doc => {
	const { node } = path;

	return group([
		"match ",
		path.call(print, "about"),
		" {",
		indent([
			hardline,
			join(
				hardline,
				path.map(q => [q.call(print, "q"), " => ", q.call(print, "a")], "qs"),
			),
			...(node.default ?
				[
					hardline,
					"* => ",
					path.call(
						defaultBody => print(defaultBody as AstPath<Ast.Node>),
						"default",
					),
				]
			:	[]),
		]),
		hardline,
		"}",
	]);
};

const printTemplate = (
	path: AstPath<Node> & { node: Ast.Tmpl },
	_options: ParserOptions<Ast.Node>,
	print: (path: AstPath<Ast.Node>) => Doc,
): Doc => {
	return [
		"`",
		path.map(
			part =>
				typeof part.node === "string" ?
					part.node.replace(/[`{]/g, "\\$&")
				:	["{", (part as AstPath<Ast.Expression>).call(print), "}"],
			"tmpl",
		),
		"`",
	];
};

const printObject = (
	path: AstPath<Node> & { node: Ast.Obj },
	_options: ParserOptions<Ast.Node>,
	print: (path: AstPath<Ast.Node>) => Doc,
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
			// @ts-expect-error keyの型を無視
			stack.push(key, value);
			entries.push([key, print(path as AstPath<Ast.Node>)]);
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
	path: AstPath<Node>,
	node: Ast.Call,
	print: (path: AstPath<Ast.Node>) => Doc,
): Doc => {
	const { target } = node;

	if (target.type === "identifier") {
		// <:演算子
		if (
			target.name === "print" &&
			target.loc &&
			target.loc.start === node.loc?.start &&
			target.loc.end === node.loc?.end
		) {
			return ["<: ", (path as AstPath<Ast.Call>).call(print, "args", 0)];
		}

		// 糖衣構文の二項演算子
		// HACK: 糖衣構文で作られるnodeはlocが無い
		if (!node.loc && !target.loc) {
			const lhs = (path as AstPath<Ast.Call>).call(print, "args", 0);
			const rhs = (path as AstPath<Ast.Call>).call(print, "args", 1);

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
		indent([
			softline,
			join([",", line], (path as AstPath<Ast.Call>).map(print, "args")),
		]),
		softline,
		")",
	]);
};
