import { assert } from "emnorst";
import { type Doc, doc, type ParserOptions } from "prettier";
import type * as dst from "../dst";
import type { AstPath } from "../types";
import { printBlock } from "./block";
import { printFunction } from "./function";

const { group, line, indent, indentIfBreak, lineSuffixBoundary } = doc.builders;

export const printStatement = (
	path: AstPath<dst.Statement>,
	options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	switch (node.type) {
		case "Assignment":
			dev: assert.as<AstPath<typeof node>>(path);
			return printAssign(path, options, print);
		case "VariableDefinition":
			dev: assert.as<AstPath<typeof node>>(path);
			return printDefinition(path, options, print);
		case "FnDefinition":
			dev: assert.as<AstPath<typeof node>>(path);
			return group(["@", node.name.name, printFunction(path, options, print)]);
		case "Return":
			dev: assert.as<AstPath<typeof node>>(path);
			return ["return ", path.call(print, "body")];
		case "Each":
			dev: assert.as<AstPath<typeof node>>(path);
			return group([
				"each (let ",
				path.call(print, "definition", "dest"),
				", ",
				path.call(print, "source"),
				") ",
				path.call(print, "body"),
			]);
		case "For":
			dev: assert.as<AstPath<typeof node>>(path);
			return printFor(path, options, print);
		case "Loop":
			dev: assert.as<AstPath<typeof node>>(path);
			return ["loop ", path.call(print, "body")];
		case "While": {
			dev: assert.as<AstPath<typeof node>>(path);
			const whileCondition = ["while (", path.call(print, "condition"), ")"];
			const body = path.call(print, "body");

			return node.do ?
					["do ", body, " ", whileCondition]
				:	[whileCondition, " ", body];
		}
		case "Break":
			return "break";
		case "Continue":
			return "continue";
		case "Out":
			dev: assert.as<AstPath<typeof node>>(path);
			return ["<: ", path.call(print, "body")];
		case "ExpressionStatement":
			dev: assert.as<AstPath<typeof node>>(path);
			return path.call(print, "expression");
		case "Block":
			dev: assert.as<AstPath<typeof node>>(path);
			return printBlock(path, options, print);
	}
};

const printAssign = (
	path: AstPath<dst.Assignment>,
	_options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const groupId = Symbol("assign");
	const { node } = path;

	return group([
		path.call(print, "dest"),
		" ",
		node.operator,
		group(indent(line), { id: groupId }),
		lineSuffixBoundary,
		indentIfBreak(path.call(print, "value"), { groupId }),
	]);
};

const printDefinition = (
	path: AstPath<dst.VariableDefinition>,
	_options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const groupId = Symbol("assign");
	const { node } = path;

	return group([
		node.mutable ? "var" : "let",
		" ",
		path.call(print, "dest"),
		node.ty == null ? "" : [": ", path.call(print, "ty")],
		" =",
		group(indent(line), { id: groupId }),
		lineSuffixBoundary,
		indentIfBreak(path.call(print, "init"), { groupId }),
	]);
};

const printFor = (
	path: AstPath<dst.For>,
	_options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	return [
		"for (",
		path.call(path => {
			if (path.node.type === "Range") {
				dev: assert.as<AstPath<typeof path.node>>(path);
				const { from } = path.node;

				return group([
					"let ",
					path.call(print, "definition", "dest"),
					...(from == null ? [] : [" = ", path.call(print, "from")]),
					", ",
					path.call(print, "to"),
				]);
			}

			dev: assert.as<AstPath<typeof path.node>>(path);
			return path.call(print, "times");
		}, "enumerator"),
		") ",
		path.call(print, "body"),
	];
};
