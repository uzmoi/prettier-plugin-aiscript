import type { ParserOptions } from "prettier";
import type { Ast } from "@syuilo/aiscript";
import type { Node } from "./node";

export type SugarOut = Ast.Call & {
	target: { type: "identifier"; name: "print" };
	args: [Ast.Expression];
};

export const isSugarOut = (
	node: Node,
	options: ParserOptions,
): node is SugarOut => {
	if (node.type !== "call" || node.args.length !== 1) return false;
	const { target } = node;
	if (target.type !== "identifier" || target.name !== "print") return false;
	return options.originalText.startsWith("<:", options.locStart(target));
};

export type SugarCall = Ast.Call & {
	target: {
		type: "identifier";
		name:
			| "Core:mul"
			| "Core:pow"
			| "Core:div"
			| "Core:mod"
			| "Core:add"
			| "Core:sub"
			| "Core:eq"
			| "Core:neq"
			| "Core:lt"
			| "Core:gt"
			| "Core:lteq"
			| "Core:gteq";
	};
	args: [Ast.Expression, Ast.Expression];
};

const SUGAR_FNS = new Set([
	"Core:mul",
	"Core:pow",
	"Core:div",
	"Core:mod",
	"Core:add",
	"Core:sub",
	"Core:eq",
	"Core:neq",
	"Core:lt",
	"Core:gt",
	"Core:lteq",
	"Core:gteq",
]);

export const isSugarCall = (
	node: Node,
	options: ParserOptions,
): node is SugarCall => {
	if (node.type !== "call" || node.args.length !== 2) return false;
	const { target } = node;
	if (target.type !== "identifier" || !SUGAR_FNS.has(target.name)) return false;
	if (target.loc == null) return true;
	return !options.originalText.startsWith(
		target.name,
		options.locStart(target),
	);
};

const isSugarLoopIf = (node: Node) =>
	node.type === "if" && node.cond.type === "not" && node.then.type === "break";

export const getSugarLoopType = (
	node: Node,
	options: ParserOptions,
): "while" | "do-while" | undefined => {
	if (node.type !== "loop" || node.statements.length !== 2) return;
	const [first, second] = node.statements;

	if (
		isSugarLoopIf(first) &&
		options.originalText.startsWith("while", options.locStart(node))
	) {
		return "while";
	}

	if (
		isSugarLoopIf(second) &&
		options.originalText.startsWith("do", options.locStart(node))
	) {
		return "do-while";
	}
};
