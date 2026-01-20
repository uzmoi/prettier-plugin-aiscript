import type { Ast } from "@syuilo/aiscript";
import type * as dst from "../../dst";
import { getSugarWhile, isOutSugar } from "../../sugar";
import { liftExpression } from "./expression";
import { block, identifier, loc } from "./helpers";
import { liftType } from "./type";

export const liftStatement = (
	node: Ast.Statement | Ast.Expression,
	source: string,
): dst.Statement => {
	if (isOutSugar(node, source)) {
		return {
			type: "Out",
			body: liftExpression(node.args[0], source),
			loc: loc(node.loc),
		};
	}

	if (node.type === "block" && !source.startsWith("eval", node.loc?.start)) {
		return block(node.statements, loc(node.loc), source);
	}

	switch (node.type) {
		case "def": {
			// "@"で始まっていれば関数宣言
			if (node.expr.type === "fn" && source.startsWith("@", node.loc?.start)) {
				return {
					type: "FnDefinition",
					// TODO: loc
					name: identifier(node.name, loc(undefined)),
					params: node.expr.args.map(param => ({
						type: "FnParameter",
						// TODO: loc
						name: identifier(param.name, loc(undefined)),
						ty: liftType(param.argType),
						optional: false,
						default: null,
						// TODO: loc
						loc: loc(undefined),
					})),
					returnTy: liftType(node.varType),
					// FIXME: loc.start
					body: block(node.expr.children, loc(node.loc), source),
					loc: loc(node.loc),
				};
			}
			return {
				type: "VariableDefinition",
				mutable: node.mut,
				// TODO: loc
				name: identifier(node.name, loc(undefined)),
				ty: liftType(node.varType),
				init: liftExpression(node.expr, source),
				loc: loc(node.loc),
			};
		}
		case "return": {
			return {
				type: "Return",
				body: liftExpression(node.expr, source),
				loc: loc(node.loc),
			};
		}
		case "each": {
			return {
				type: "Each",
				definition: {
					type: "VariableDefinition",
					mutable: false,
					// TODO: loc
					name: identifier(node.var, loc(undefined)),
					ty: null,
					// init は使われないのでダミーの NullLiteral
					init: { type: "NullLiteral", loc: loc(undefined) },
					// TODO: loc
					loc: loc(undefined),
				},
				source: liftExpression(node.items, source),
				body: liftStatement(node.for, source),
				loc: loc(node.loc),
			};
		}
		case "for": {
			let enumerator: dst.For["enumerator"];

			if (node.times != null) {
				enumerator = {
					type: "Times",
					times: liftExpression(node.times, source),
				};
			} else if (node.var != null && node.to != null) {
				// fromを省略した記法でもfromが補完されるので、sourceのlocの位置を見る
				const isFromOmitted =
					node.from === undefined ||
					(node.from.type === "num" &&
						node.from.value === 0 &&
						!source.startsWith("0", node.from.loc?.start));
				enumerator = {
					type: "Range",
					definition: {
						type: "VariableDefinition",
						mutable: false,
						// TODO: loc
						name: identifier(node.var, loc(undefined)),
						ty: null,
						// init は使われないのでダミーの NullLiteral
						init: { type: "NullLiteral", loc: loc(undefined) },
						// TODO: loc
						loc: loc(undefined),
					},
					from: isFromOmitted ? null : liftExpression(node.from!, source),
					to: liftExpression(node.to!, source),
				};
			} else {
				throw new Error("Invalid 'for' node.");
			}

			return {
				type: "For",
				enumerator,
				body: liftStatement(node.for, source),
				loc: loc(node.loc),
			};
		}
		case "loop": {
			const sugar = getSugarWhile(node, source);
			if (sugar) {
				return {
					type: "While",
					do: sugar.type === "do-while",
					condition: liftExpression(sugar.condition, source),
					body: liftStatement(sugar.body, source),
					loc: loc(node.loc),
				};
			}
			return {
				type: "Loop",
				body: block(
					node.statements,
					// FIXME: loc.start += "loop".length
					loc(node.loc),
					source,
				),
				loc: loc(node.loc),
			};
		}
		case "break": {
			return { type: "Break", loc: loc(node.loc) };
		}
		case "continue": {
			return { type: "Continue", loc: loc(node.loc) };
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
				dest: liftExpression(node.dest, source),
				value: liftExpression(node.expr, source),
				loc: loc(node.loc),
			};
		}
		default: {
			const expression = liftExpression(node, source);
			return {
				type: "ExpressionStatement",
				expression,
				loc: expression.loc,
			};
		}
	}
};
