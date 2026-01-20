import type { Ast } from "@syuilo/aiscript";
import type * as dst from "../../dst";
import { BINARY_OPERATOR_SUGAR_MAP, isBinaryOperatorSugar } from "../../sugar";
import { block, identifier, loc } from "./helpers";
import { liftStatement } from "./statement";
import { liftType } from "./type";

export const liftExpression = (
	node: Ast.Expression,
	source: string,
): dst.Expression => {
	switch (node.type) {
		case "if": {
			return {
				type: "If",
				condition: liftExpression(node.cond, source),
				then: liftStatement(node.then, source),
				elseif: node.elseif.map(node => ({
					type: "ElseIf",
					condition: liftExpression(node.cond, source),
					then: liftStatement(node.then, source),
					// TODO: loc
					loc: loc(undefined),
				})),
				else: node.else == null ? null : liftStatement(node.else, source),
				loc: loc(node.loc),
			};
		}
		case "fn": {
			return {
				type: "Fn",
				params: node.params.map(param => ({
					type: "FnParameter",
					// TODO: loc
					name: identifier(param.name, loc(undefined)),
					ty: liftType(param.argType),
					optional: false,
					default: null,
					// TODO: loc
					loc: loc(undefined),
				})),
				returnTy: liftType(node.retType),
				// FIXME: loc.start
				body: block(node.children, loc(node.loc), source),
				loc: loc(node.loc),
			};
		}
		case "match": {
			return {
				type: "Match",
				value: liftExpression(node.about, source),
				cases: node.qs
					.map(
						({ q, a }): dst.MatchCase => ({
							type: "MatchCase",
							pattern: liftExpression(q, source),
							body: liftStatement(a, source),
							// TODO: loc
							loc: loc(undefined),
						}),
					)
					.concat(
						node.default ?
							{
								type: "MatchCase",
								pattern: null,
								body: liftStatement(node.default, source),
								// TODO: loc
								loc: loc(undefined),
							}
						:	[],
					),
				loc: loc(node.loc),
			};
		}
		case "block": {
			return {
				type: "EvalBlock",
				// FIXME: loc.start += "eval".length
				body: block(node.statements, loc(node.loc), source),
				loc: loc(node.loc),
			};
		}
		case "exists": {
			return {
				type: "UnaryOperator",
				operator: "exists",
				body: liftExpression(node.identifier, source),
				loc: loc(node.loc),
			};
		}
		case "identifier": {
			return identifier(node.name, loc(node.loc));
		}
		case "null": {
			return { type: "NullLiteral", loc: loc(node.loc) };
		}
		case "bool": {
			return { type: "BoolLiteral", value: node.value, loc: loc(node.loc) };
		}
		case "num": {
			return { type: "NumberLiteral", value: node.value, loc: loc(node.loc) };
		}
		case "str": {
			return { type: "StringLiteral", value: node.value, loc: loc(node.loc) };
		}
		case "tmpl": {
			return {
				type: "Template",
				parts: node.tmpl.map(element => {
					if (typeof element === "string") {
						return {
							type: "TemplatePart",
							content: element,
							// TODO: loc
							loc: loc(undefined),
						};
					}

					const part = liftExpression(element, source);

					if (part.type === "StringLiteral" && source[part.loc.end] !== "}") {
						return { type: "TemplatePart", content: part.value, loc: part.loc };
					}

					return part;
				}),
				loc: loc(node.loc),
			};
		}
		case "arr": {
			return {
				type: "ArrayLiteral",
				elements: node.value.map(element => liftExpression(element, source)),
				loc: loc(node.loc),
			};
		}
		case "obj": {
			return {
				type: "ObjectLiteral",
				properties: Array.from(node.value, ([key, value]) => ({
					type: "ObjectProperty",
					// TODO: loc
					key: identifier(key, loc(undefined)),
					value: liftExpression(value, source),
					// TODO: loc
					loc: loc(undefined),
				})),
				loc: loc(node.loc),
			};
		}
		case "not": {
			return {
				type: "UnaryOperator",
				operator: "!",
				body: liftExpression(node.expr, source),
				loc: loc(node.loc),
			};
		}
		case "and":
		case "or": {
			const lhs = liftExpression(node.left, source);
			const rhs = liftExpression(node.right, source);
			return {
				type: "BinaryOperator",
				operator: ({ and: "&&", or: "||" } as const)[node.type],
				lhs,
				rhs,
				// FIXME: issue #4, loc.start
				loc: loc(node.loc && { start: lhs.loc.start, end: node.loc.end }),
			};
		}
		case "call": {
			if (isBinaryOperatorSugar(node)) {
				const lhs = liftExpression(node.args[0], source);
				const rhs = liftExpression(node.args[1], source);
				return {
					type: "BinaryOperator",
					operator: BINARY_OPERATOR_SUGAR_MAP[node.target.name],
					lhs,
					rhs,
					// FIXME: issue #4, loc.start
					loc: loc(node.loc && { start: lhs.loc.start, end: node.loc.end }),
				};
			}

			const callee = liftExpression(node.target, source);

			return {
				type: "Call",
				callee,
				args: node.args.map(arg => liftExpression(arg, source)),
				// FIXME: issue #4, loc.start
				loc: loc(node.loc && { start: callee.loc.start, end: node.loc.end }),
			};
		}
		case "index": {
			const target = liftExpression(node.target, source);
			return {
				type: "Index",
				target,
				index: liftExpression(node.index, source),
				// FIXME: issue #4, loc.start
				loc: loc(node.loc && { start: target.loc.start, end: node.loc.end }),
			};
		}
		case "prop": {
			const target = liftExpression(node.target, source);
			return {
				type: "Prop",
				target,
				// TODO: loc
				name: identifier(node.name, loc(undefined)),
				// FIXME: issue #4, loc.start
				loc: loc(node.loc && { start: target.loc.start, end: node.loc.end }),
			};
		}
		default: {
			throw new Error(
				`Unknown node type: ${(node satisfies never as { type: string }).type}`,
			);
		}
	}
};
