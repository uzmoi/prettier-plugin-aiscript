import type { Ast } from "@syuilo/aiscript";
import type * as dst from "../../dst";
import type { LiftContext } from "./context";
import { block, DUMMY_LOC, identifier, liftLoc } from "./helpers";
import { liftStatement } from "./statement";
import { liftType } from "./type";

export const liftExpression = (
	node: Ast.Expression,
	ctx: LiftContext,
): dst.Expression => {
	const loc = liftLoc(node.loc, ctx);

	switch (node.type) {
		case "if": {
			return {
				type: "If",
				condition: liftExpression(node.cond, ctx),
				then: liftStatement(node.then, ctx),
				elseif: node.elseif.map(node => ({
					type: "ElseIf",
					condition: liftExpression(node.cond, ctx),
					then: liftStatement(node.then, ctx),
					loc: DUMMY_LOC,
				})),
				else: node.else == null ? null : liftStatement(node.else, ctx),
				loc,
			};
		}
		case "fn": {
			return {
				type: "Fn",
				params: node.params.map(param => ({
					type: "FnParameter",
					dest: liftExpression(param.dest, ctx),
					ty: liftType(param.argType, ctx),
					optional: param.optional,
					default:
						param.default == null ? null : liftExpression(param.default, ctx),
					loc: DUMMY_LOC,
				})),
				returnTy: liftType(node.retType, ctx),
				// FIXME: loc.start
				body: block(node.children, liftLoc(node.loc, ctx), ctx),
				loc,
			};
		}
		case "match": {
			return {
				type: "Match",
				value: liftExpression(node.about, ctx),
				cases: node.qs
					.map(
						({ q, a }): dst.MatchCase => ({
							type: "MatchCase",
							pattern: liftExpression(q, ctx),
							body: liftStatement(a, ctx),
							loc: DUMMY_LOC,
						}),
					)
					.concat(
						node.default ?
							{
								type: "MatchCase",
								pattern: null,
								body: liftStatement(node.default, ctx),
								loc: DUMMY_LOC,
							}
						:	[],
					),
				loc,
			};
		}
		case "block": {
			return {
				type: "EvalBlock",
				// FIXME: loc.start += "eval".length
				body: block(node.statements, liftLoc(node.loc, ctx), ctx),
				loc,
			};
		}
		case "exists": {
			return {
				type: "UnaryOperator",
				operator: "exists",
				body: liftExpression(node.identifier, ctx),
				loc,
			};
		}
		case "identifier": {
			return identifier(node.name, loc);
		}
		case "null": {
			return { type: "NullLiteral", loc };
		}
		case "bool": {
			return { type: "BoolLiteral", value: node.value, loc };
		}
		case "num": {
			return { type: "NumberLiteral", value: node.value, loc };
		}
		case "str": {
			return { type: "StringLiteral", value: node.value, loc };
		}
		case "tmpl": {
			return {
				type: "Template",
				parts: node.tmpl.map(element => {
					const part = liftExpression(element, ctx);

					if (part.type === "StringLiteral") {
						// パーサーにバグがなければ startChar は " ' ` } の何れかのはず。
						const startChar = ctx.source[part.loc.start];
						if (startChar === "`" || startChar === "}") {
							return {
								type: "TemplatePart",
								content: part.value,
								loc: part.loc,
							};
						}
					}

					return part;
				}),
				loc,
			};
		}
		case "arr": {
			return {
				type: "ArrayLiteral",
				elements: node.value.map(element => liftExpression(element, ctx)),
				loc,
			};
		}
		case "obj": {
			return {
				type: "ObjectLiteral",
				properties: Array.from(node.value, ([key, value]) => ({
					type: "ObjectProperty",
					key: identifier(key, DUMMY_LOC),
					value: liftExpression(value, ctx),
					loc: DUMMY_LOC,
				})),
				loc,
			};
		}
		case "plus":
		case "minus":
		case "not": {
			return {
				type: "UnaryOperator",
				operator: UNARY_OPERATOR_MAP[node.type],
				body: liftExpression(node.expr, ctx),
				loc,
			};
		}
		case "pow":
		case "mul":
		case "div":
		case "rem":
		case "add":
		case "sub":
		case "lt":
		case "lteq":
		case "gt":
		case "gteq":
		case "eq":
		case "neq":
		case "and":
		case "or": {
			const lhs = liftExpression(node.left, ctx);
			const rhs = liftExpression(node.right, ctx);
			return {
				type: "BinaryOperator",
				operator: BINARY_OPERATOR_MAP[node.type],
				lhs,
				rhs,
				// FIXME: issue #4
				loc: { start: lhs.loc.start, end: rhs.loc.end },
			};
		}
		case "call": {
			const callee = liftExpression(node.target, ctx);
			return {
				type: "Call",
				callee,
				args: node.args.map(arg => liftExpression(arg, ctx)),
				// FIXME: issue #4, loc.start
				loc: { start: callee.loc.start, end: loc.end },
			};
		}
		case "index": {
			const target = liftExpression(node.target, ctx);
			return {
				type: "Index",
				target,
				index: liftExpression(node.index, ctx),
				// FIXME: issue #4, loc.start
				loc: { start: target.loc.start, end: loc.end },
			};
		}
		case "prop": {
			const target = liftExpression(node.target, ctx);
			return {
				type: "Prop",
				target,
				name: identifier(node.name, DUMMY_LOC),
				// FIXME: issue #4, loc.start
				loc: { start: target.loc.start, end: loc.end },
			};
		}
		default: {
			node satisfies never;
			throw new Error(`Unknown node type: ${(node as { type: string }).type}`);
		}
	}
};

const UNARY_OPERATOR_MAP = {
	not: "!",
	plus: "+",
	minus: "-",
} as const;

const BINARY_OPERATOR_MAP = {
	and: "&&",
	or: "||",
	eq: "==",
	neq: "!=",
	gt: ">",
	gteq: ">=",
	lt: "<",
	lteq: "<=",
	add: "+",
	sub: "-",
	mul: "*",
	div: "/",
	rem: "%",
	pow: "^",
} as const;
