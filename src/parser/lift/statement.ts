import type { Ast } from "@syuilo/aiscript";
import type * as dst from "../../dst";
import type { LiftContext } from "./context";
import { liftExpression } from "./expression";
import {
	block,
	DUMMY_LOC,
	identifier,
	liftLoc,
	readBackComments,
} from "./helpers";
import { getSugarWhile, isOutSugar, isSugarFnDefinition } from "./sugar";
import { liftType } from "./type";

export const liftStatement = (
	node: Ast.Statement | Ast.Expression,
	ctx: LiftContext,
): dst.Statement => {
	const loc = liftLoc(node.loc, ctx);

	if (isOutSugar(node, ctx)) {
		return {
			type: "Out",
			body: liftExpression(node.args[0], ctx),
			loc,
		};
	}

	if (node.type === "block" && !ctx.source.startsWith("eval", loc.start)) {
		return block(node.statements, loc, ctx);
	}

	switch (node.type) {
		case "def": {
			if (isSugarFnDefinition(node, ctx, loc.start)) {
				// FIXME: loc.start
				const body = block(node.expr.children, { start: 0, end: loc.end }, ctx);
				// { の直後の位置
				const afterBracket =
					body.body[0] ? body.body[0].loc.start : loc.end - 1;
				// { を読み戻す
				body.loc.start = readBackComments(ctx, afterBracket) - 1;
				return {
					type: "FnDefinition",
					name: identifier(node.dest.name, liftLoc(node.dest.loc, ctx)),
					params: node.expr.params.map(param => ({
						type: "FnParameter",
						dest: liftExpression(param.dest, ctx),
						ty: liftType(param.argType, ctx),
						optional: param.optional,
						default:
							param.default == null ? null : liftExpression(param.default, ctx),
						loc: DUMMY_LOC,
					})),
					returnTy: liftType(node.varType, ctx),
					body,
					loc,
				};
			}

			return {
				type: "VariableDefinition",
				mutable: node.mut,
				dest: liftExpression(node.dest, ctx),
				ty: liftType(node.varType, ctx),
				init: liftExpression(node.expr, ctx),
				loc,
			};
		}
		case "return": {
			return {
				type: "Return",
				body: liftExpression(node.expr, ctx),
				loc,
			};
		}
		case "each": {
			return {
				type: "Each",
				definition: {
					type: "VariableDefinition",
					mutable: false,
					dest: liftExpression(node.var, ctx),
					ty: null,
					// init は使われないのでダミーの NullLiteral
					init: { type: "NullLiteral", loc: DUMMY_LOC },
					loc: DUMMY_LOC,
				},
				source: liftExpression(node.items, ctx),
				body: liftStatement(node.for, ctx),
				loc,
			};
		}
		case "for": {
			let enumerator: dst.For["enumerator"];

			if (node.times != null) {
				enumerator = {
					type: "Times",
					times: liftExpression(node.times, ctx),
				};
			} else if (node.var != null && node.to != null) {
				// fromを省略した記法でもfromが補完されるので、sourceのlocの位置を見る
				const isFromOmitted =
					node.from === undefined ||
					(node.from.type === "num" &&
						node.from.value === 0 &&
						!ctx.source.startsWith("0", liftLoc(node.from.loc, ctx).start));
				enumerator = {
					type: "Range",
					definition: {
						type: "VariableDefinition",
						mutable: false,
						dest: identifier(node.var, DUMMY_LOC),
						ty: null,
						// init は使われないのでダミーの NullLiteral
						init: { type: "NullLiteral", loc: DUMMY_LOC },
						loc: DUMMY_LOC,
					},
					from: isFromOmitted ? null : liftExpression(node.from!, ctx),
					to: liftExpression(node.to!, ctx),
				};
			} else {
				throw new Error("Invalid 'for' node.");
			}

			return {
				type: "For",
				enumerator,
				body: liftStatement(node.for, ctx),
				loc,
			};
		}
		case "loop": {
			const sugar = getSugarWhile(node, ctx);
			if (sugar) {
				return {
					type: "While",
					do: sugar.type === "do-while",
					condition: liftExpression(sugar.condition, ctx),
					body: liftStatement(sugar.body, ctx),
					loc,
				};
			}
			return {
				type: "Loop",
				body: block(
					node.statements,
					// FIXME: loc.start += "loop".length
					liftLoc(node.loc, ctx),
					ctx,
				),
				loc,
			};
		}
		case "break": {
			return { type: "Break", loc };
		}
		case "continue": {
			return { type: "Continue", loc };
		}
		case "assign":
		case "addAssign":
		case "subAssign": {
			const operators = {
				assign: "=",
				addAssign: "+=",
				subAssign: "-=",
			} as const;
			return {
				type: "Assignment",
				operator: operators[node.type],
				dest: liftExpression(node.dest, ctx),
				value: liftExpression(node.expr, ctx),
				loc,
			};
		}
		default: {
			const expression = liftExpression(node, ctx);
			return {
				type: "ExpressionStatement",
				expression,
				loc: expression.loc,
			};
		}
	}
};
