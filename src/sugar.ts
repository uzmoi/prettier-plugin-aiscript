import type { Ast } from "@syuilo/aiscript";
import { has } from "emnorst";
import type { Node } from "./node";

type OutSugar = Ast.Call & {
	target: { type: "identifier"; name: "print" };
	args: [Ast.Expression];
};

export const isOutSugar = (
	node: Ast.Statement | Ast.Expression,
	source: string,
): node is OutSugar => {
	if (node.type !== "call" || node.args.length !== 1) return false;

	const { target } = node;

	if (
		target.type !== "identifier" ||
		target.name !== "print" ||
		target.loc == null
	) {
		return false;
	}

	return source.startsWith("<:", target.loc.start);
};

type BinaryOperatorSugar = Ast.Call & {
	target: { type: "identifier"; name: keyof typeof BINARY_OPERATOR_SUGAR_MAP };
	args: [Ast.Expression, Ast.Expression];
};

export const BINARY_OPERATOR_SUGAR_MAP = {
	"Core:eq": "==",
	"Core:neq": "!=",
	"Core:gt": ">",
	"Core:gteq": ">=",
	"Core:lt": "<",
	"Core:lteq": "<=",
	"Core:add": "+",
	"Core:sub": "-",
	"Core:mul": "*",
	"Core:div": "/",
	"Core:mod": "%",
	"Core:pow": "^",
} as const;

export const isBinaryOperatorSugar = (
	node: Node,
): node is BinaryOperatorSugar => {
	if (node.type !== "call" || node.args.length !== 2) return false;

	const { target } = node;

	if (
		target.type !== "identifier" ||
		!has(BINARY_OPERATOR_SUGAR_MAP, target.name)
	) {
		return false;
	}

	if (target.loc == null) return true;

	const { start, end } = target.loc;
	return target.name.length !== end - start;
};

const isSugarLoopIf = (node: Ast.Node): node is Ast.If & { cond: Ast.Not } =>
	node.type === "if" && node.cond.type === "not" && node.then.type === "break";

type SugarWhile = {
	type: "while" | "do-while";
	condition: Ast.Expression;
	body: Ast.Statement | Ast.Expression;
};

export const getSugarWhile = (
	node: Ast.Loop,
	source: string,
): SugarWhile | undefined => {
	if (node.statements.length !== 2 || node.loc == null) return;
	const [first, second] = node.statements;

	if (isSugarLoopIf(first!) && source.startsWith("while", node.loc.start)) {
		return {
			type: "while",
			condition: first.cond.expr,
			body: second!,
		};
	}

	if (isSugarLoopIf(second!) && source.startsWith("do", node.loc.start)) {
		return {
			type: "do-while",
			condition: second.cond.expr,
			body: first!,
		};
	}
};
