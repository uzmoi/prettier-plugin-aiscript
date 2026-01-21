import type { Ast } from "@syuilo/aiscript";
import type { LiftContext } from "./context";
import { liftLoc } from "./helpers";

type OutSugar = Ast.Call & {
	target: { type: "identifier"; name: "print" };
	args: [Ast.Expression];
};

export const isOutSugar = (
	node: Ast.Statement | Ast.Expression,
	ctx: LiftContext,
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

	return ctx.source.startsWith("<:", liftLoc(target.loc, ctx).start);
};

type SugarFnDef = Ast.Definition & {
	dest: Ast.Identifier;
	expr: Ast.Fn;
};

export const isSugarFnDefinition = (
	node: Ast.Definition,
	ctx: LiftContext,
	start: number,
): node is SugarFnDef =>
	!node.mut &&
	node.expr.type === "fn" &&
	node.dest.type === "identifier" &&
	// "@"で始まっていれば関数宣言
	ctx.source.startsWith("@", start);

const isSugarLoopIf = (node: Ast.Node): node is Ast.If & { cond: Ast.Not } =>
	node.type === "if" && node.cond.type === "not" && node.then.type === "break";

type SugarWhile = {
	type: "while" | "do-while";
	condition: Ast.Expression;
	body: Ast.Statement | Ast.Expression;
};

export const getSugarWhile = (
	node: Ast.Loop,
	ctx: LiftContext,
): SugarWhile | undefined => {
	if (node.statements.length !== 2 || node.loc == null) return;
	const loc = liftLoc(node.loc, ctx);
	const [first, second] = node.statements;

	if (isSugarLoopIf(first!) && ctx.source.startsWith("while", loc.start)) {
		return {
			type: "while",
			condition: first.cond.expr,
			body: second!,
		};
	}

	if (isSugarLoopIf(second!) && ctx.source.startsWith("do", loc.start)) {
		return {
			type: "do-while",
			condition: second.cond.expr,
			body: first!,
		};
	}
};
