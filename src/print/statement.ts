import type { Ast } from "@syuilo/aiscript";
import { type AstPath, type Doc, type ParserOptions, doc } from "prettier";
import type { Node } from "../node";
import { printFunction } from "./function";
import { printBlock } from "./block";

const { group, line, indent, indentIfBreak, lineSuffixBoundary } = doc.builders;

export const printStatement = (
	path: AstPath<Node> & { node: Ast.Statement },
	options: ParserOptions<Node>,
	print: (path: AstPath<Ast.Node>) => Doc,
): Doc => {
	const { node } = path;

	switch (node.type) {
		case "def":
			return printDefinition(
				path as AstPath<Node> & { node: Ast.Definition },
				options,
				print,
			);
		case "return":
			return ["return ", path.call(print, "expr")];
		case "each":
			return group([
				`each let ${node.var}, `,
				path.call(print, "items"),
				" ",
				path.call(print, "for"),
			]);
		case "for":
			return printFor(
				path as AstPath<Node> & { node: Ast.For },
				options,
				print,
			);
		case "loop":
			return ["loop ", printBlock(path as AstPath<Ast.Node>, options, print)];
		case "break":
			return "break";
		case "continue":
			return "continue";
		case "assign":
			return printAssign(path, print, path.call(print, "dest"));
		case "addAssign":
			return printAssign(path, print, path.call(print, "dest"), "+=");
		case "subAssign":
			return printAssign(path, print, path.call(print, "dest"), "-=");
	}
};

const printDefinition = (
	path: AstPath<Node> & { node: Ast.Definition },
	options: ParserOptions<Node>,
	print: (path: AstPath<Ast.Node>) => Doc,
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
	path: AstPath<Node> & { node: Ast.For },
	options: ParserOptions<Node>,
	print: (path: AstPath<Ast.Node>) => Doc,
): Doc => {
	const { node } = path;

	if (node.times) {
		return group([
			"for ",
			path.call(times => print(times as AstPath<Ast.Expression>), "times"),
			" ",
			path.call(print, "for"),
		]);
	}

	if (node.var && node.to) {
		// HACK: fromを省略した記法でもfromが補完されるので、originalTextのlocの位置を見る
		const isFromOmitted =
			node.from === undefined ||
			(node.from.type === "num" &&
				node.from.value === 0 &&
				options.originalText[options.locStart(node.from)] !== "0");

		if (isFromOmitted) {
			return group([
				`for let ${node.var}, `,
				path.call(to => print(to as AstPath<Ast.Expression>), "to"),
				" ",
				path.call(print, "for"),
			]);
		}

		return group([
			"for let ",
			node.var,
			" = ",
			path.call(from => print(from as AstPath<Ast.Expression>), "from"),
			", ",
			path.call(to => print(to as AstPath<Ast.Expression>), "to"),
			" ",
			path.call(print, "for"),
		]);
	}

	throw new Error("Invalid 'for' node.");
};

const printAssign = (
	path: AstPath<Node>,
	print: (path: AstPath<Ast.Node>) => Doc,
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
