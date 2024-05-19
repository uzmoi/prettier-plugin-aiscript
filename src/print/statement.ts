import type { Ast } from "@syuilo/aiscript";
import { type Doc, type ParserOptions, doc } from "prettier";
import { assert } from "emnorst";
import type { Node } from "../node";
import type { AstPath } from "../types";
import { printFunction } from "./function";
import { printBlock } from "./block";

const { group, line, indent, indentIfBreak, lineSuffixBoundary } = doc.builders;

export const printStatement = (
	path: AstPath<Ast.Statement>,
	options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	switch (node.type) {
		case "def":
			dev: assert.as<AstPath<typeof node>>(path);
			return printDefinition(path, options, print);
		case "return":
			dev: assert.as<AstPath<typeof node>>(path);
			return ["return ", path.call(print, "expr")];
		case "each":
			dev: assert.as<AstPath<typeof node>>(path);
			return group([
				`each let ${node.var}, `,
				path.call(print, "items"),
				" ",
				path.call(print, "for"),
			]);
		case "for":
			dev: assert.as<AstPath<typeof node>>(path);
			return printFor(path, options, print);
		case "loop":
			dev: assert.as<AstPath<typeof node>>(path);
			return ["loop ", printBlock(path, options, print)];
		case "break":
			return "break";
		case "continue":
			return "continue";
		case "assign":
		case "addAssign":
		case "subAssign": {
			dev: assert.as<AstPath<typeof node>>(path);
			const op =
				node.type === "addAssign" ? "+="
				: node.type === "subAssign" ? "-="
				: "=";
			return printAssign(path, print, path.call(print, "dest"), op);
		}
	}
};

const printDefinition = (
	path: AstPath<Ast.Definition>,
	options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	// HACK: 関数宣言の場合varTypeがundefined、変数宣言だとnull
	if (node.varType === undefined && node.expr.type === "fn") {
		return group([
			"@",
			node.name,
			path.call(
				fn => printFunction(fn as AstPath<Ast.Fn>, options, print),
				"expr",
			),
		]);
	}

	return printAssign(path, print, `${node.mut ? "var" : "let"} ${node.name}`);
};

const printFor = (
	path: AstPath<Ast.For>,
	options: ParserOptions<Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	let enumerator: Doc;

	if (node.times) {
		enumerator = path.call(print, "times");
	} else if (node.var && node.to) {
		// HACK: fromを省略した記法でもfromが補完されるので、originalTextのlocの位置を見る
		const isFromOmitted =
			node.from === undefined ||
			(node.from.type === "num" &&
				node.from.value === 0 &&
				options.originalText[options.locStart(node.from)] !== "0");

		enumerator = group([
			`let ${node.var}`,
			...(isFromOmitted ? [] : [" = ", path.call(print, "from")]),
			", ",
			path.call(print, "to"),
		]);
	} else {
		throw new Error("Invalid 'for' node.");
	}

	return ["for ", enumerator, " ", path.call(print, "for")];
};

const printAssign = (
	path: AstPath<Ast.Definition | Ast.Assign | Ast.SubAssign | Ast.AddAssign>,
	print: (path: AstPath) => Doc,
	lhs: Doc,
	op = "=",
	rhs: Doc = path.call(print, "expr"),
): Doc => {
	const groupId = Symbol("assign");

	return group([
		lhs,
		" " + op,
		group(indent(line), { id: groupId }),
		lineSuffixBoundary,
		indentIfBreak(rhs, { groupId }),
	]);
};
