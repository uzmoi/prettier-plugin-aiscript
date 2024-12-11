import type { Ast } from "@syuilo/aiscript";
import type * as dst from "./dst";
import type { Root } from "./node";
import {
	BINARY_OPERATOR_SUGAR_MAP,
	getSugarWhile,
	isBinaryOperatorSugar,
	isOutSugar,
} from "./sugar";

const loc = (loc: Ast.Loc | undefined): dst.Loc => ({
	start: loc?.start ?? 0,
	end: loc?.end ?? 0,
});

const identifierLocOf = (start: number, source: string) => {
	const mat = /\s+(\w+)/y.exec(source);
	if (mat == null) return;
	const end = start + mat[0].length;
	return { start: end - mat[1]!.length, end };
};

const block = (
	statements: (Ast.Statement | Ast.Expression)[],
	loc: dst.Loc,
	source: string,
): dst.Block => ({
	type: "Block",
	body: statements.map(statement => upStatement(statement, source)),
	loc,
});

const identifier = (name: string, loc: dst.Loc): dst.Identifier => ({
	type: "Identifier",
	name,
	loc,
});

export const upRoot = (root: Root, source: string): dst.Script => {
	return {
		type: "Script",
		body: root.body.map(body => upTopLevel(body, source)),
		comments: root.comments.map(comment => ({
			type: "Comment",
			value: comment.value,
			loc: loc(comment.loc),
		})),
		loc: loc({ start: 0, end: source.length }),
	};
};

const upTopLevel = (
	node: Ast.Node,
	source: string,
): dst.TopLevel | dst.Statement => {
	switch (node.type) {
		case "ns":
			return {
				type: "Namespace",
				name: identifier(
					node.name,
					// "::" を読み飛ばして次の identifier が name
					loc(node.loc && identifierLocOf(node.loc.start + 2, source)),
				),
				body: node.members.map(
					// ns の .members には ns もしくは def しかない
					member => upTopLevel(member, source) as dst.NamespaceItem,
				),
				loc: loc(node.loc),
			};
		case "meta":
			return {
				type: "Meta",
				name:
					node.name == null ?
						null
					:	identifier(
							node.name,
							// "###" を読み飛ばして次の identifier が name
							loc(node.loc && identifierLocOf(node.loc.start + 3, source)),
						),
				value: upExpression(node.value, source),
				loc: loc(node.loc),
			};
		case "namedTypeSource":
		case "fnTypeSource":
			throw new Error("エラーはでないはずだよ");
		default:
			return upStatement(node, source);
	}
};

const upStatement = (
	node: Ast.Statement | Ast.Expression,
	source: string,
): dst.Statement => {
	if (isOutSugar(node, source)) {
		return {
			type: "Out",
			body: upExpression(node.args[0], source),
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
						ty: upType(param.argType),
						optional: false,
						default: null,
						// TODO: loc
						loc: loc(undefined),
					})),
					returnTy: upType(node.varType),
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
				ty: upType(node.varType),
				init: upExpression(node.expr, source),
				loc: loc(node.loc),
			};
		}
		case "return":
			return {
				type: "Return",
				body: upExpression(node.expr, source),
				loc: loc(node.loc),
			};
		case "each":
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
				source: upExpression(node.items, source),
				body: upStatement(node.for, source),
				loc: loc(node.loc),
			};
		case "for": {
			let enumerator: dst.For["enumerator"];

			if (node.times != null) {
				enumerator = {
					type: "Times",
					times: upExpression(node.times, source),
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
					from: isFromOmitted ? null : upExpression(node.from!, source),
					to: upExpression(node.to!, source),
				};
			} else {
				throw new Error("Invalid 'for' node.");
			}

			return {
				type: "For",
				enumerator,
				body: upStatement(node.for, source),
				loc: loc(node.loc),
			};
		}
		case "loop": {
			const sugar = getSugarWhile(node, source);
			if (sugar) {
				return {
					type: "While",
					do: sugar.type === "do-while",
					condition: upExpression(sugar.condition, source),
					body: upStatement(sugar.body, source),
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
		case "break":
			return { type: "Break", loc: loc(node.loc) };
		case "continue":
			return { type: "Continue", loc: loc(node.loc) };
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
				dest: upExpression(node.dest, source),
				value: upExpression(node.expr, source),
				loc: loc(node.loc),
			};
		}
		default: {
			const expression = upExpression(node, source);
			return {
				type: "ExpressionStatement",
				expression,
				loc: expression.loc,
			};
		}
	}
};

const upExpression = (node: Ast.Expression, source: string): dst.Expression => {
	switch (node.type) {
		case "if":
			return {
				type: "If",
				condition: upExpression(node.cond, source),
				// biome-ignore lint/suspicious/noThenProperty:
				then: upStatement(node.then, source),
				elseif: node.elseif.map(node => ({
					type: "ElseIf",
					condition: upExpression(node.cond, source),
					// biome-ignore lint/suspicious/noThenProperty:
					then: upStatement(node.then, source),
					// TODO: loc
					loc: loc(undefined),
				})),
				else: node.else == null ? null : upStatement(node.else, source),
				loc: loc(node.loc),
			};
		case "fn":
			return {
				type: "Fn",
				params: node.args.map(param => ({
					type: "FnParameter",
					// TODO: loc
					name: identifier(param.name, loc(undefined)),
					ty: upType(param.argType),
					optional: false,
					default: null,
					// TODO: loc
					loc: loc(undefined),
				})),
				returnTy: upType(node.retType),
				// FIXME: loc.start
				body: block(node.children, loc(node.loc), source),
				loc: loc(node.loc),
			};
		case "match":
			return {
				type: "Match",
				value: upExpression(node.about, source),
				cases: node.qs
					.map(
						({ q, a }): dst.MatchCase => ({
							type: "MatchCase",
							pattern: upExpression(q, source),
							body: upStatement(a, source),
							// TODO: loc
							loc: loc(undefined),
						}),
					)
					.concat(
						node.default ?
							{
								type: "MatchCase",
								pattern: null,
								body: upStatement(node.default, source),
								// TODO: loc
								loc: loc(undefined),
							}
						:	[],
					),
				loc: loc(node.loc),
			};
		case "block":
			return {
				type: "EvalBlock",
				// FIXME: loc.start += "eval".length
				body: block(node.statements, loc(node.loc), source),
				loc: loc(node.loc),
			};
		case "exists":
			return {
				type: "UnaryOperator",
				operator: "exists",
				body: upExpression(node.identifier, source),
				loc: loc(node.loc),
			};
		case "identifier":
			return identifier(node.name, loc(node.loc));
		case "null":
			return { type: "NullLiteral", loc: loc(node.loc) };
		case "bool":
			return { type: "BoolLiteral", value: node.value, loc: loc(node.loc) };
		case "num":
			return { type: "NumberLiteral", value: node.value, loc: loc(node.loc) };
		case "str":
			return { type: "StringLiteral", value: node.value, loc: loc(node.loc) };
		case "tmpl":
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

					const part = upExpression(element, source);

					if (part.type === "StringLiteral" && source[part.loc.end] !== "}") {
						return { type: "TemplatePart", content: part.value, loc: part.loc };
					}

					return part;
				}),
				loc: loc(node.loc),
			};
		case "arr":
			return {
				type: "ArrayLiteral",
				elements: node.value.map(element => upExpression(element, source)),
				loc: loc(node.loc),
			};
		case "obj":
			return {
				type: "ObjectLiteral",
				properties: Array.from(node.value, ([key, value]) => ({
					type: "ObjectProperty",
					// TODO: loc
					key: identifier(key, loc(undefined)),
					value: upExpression(value, source),
					// TODO: loc
					loc: loc(undefined),
				})),
				loc: loc(node.loc),
			};
		case "not":
			return {
				type: "UnaryOperator",
				operator: "!",
				body: upExpression(node.expr, source),
				loc: loc(node.loc),
			};
		case "and":
		case "or": {
			const lhs = upExpression(node.left, source);
			const rhs = upExpression(node.right, source);
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
				const lhs = upExpression(node.args[0], source);
				const rhs = upExpression(node.args[1], source);
				return {
					type: "BinaryOperator",
					operator: BINARY_OPERATOR_SUGAR_MAP[node.target.name],
					lhs,
					rhs,
					// FIXME: issue #4, loc.start
					loc: loc(node.loc && { start: lhs.loc.start, end: node.loc.end }),
				};
			}

			const callee = upExpression(node.target, source);

			return {
				type: "Call",
				callee,
				args: node.args.map(arg => upExpression(arg, source)),
				// FIXME: issue #4, loc.start
				loc: loc(node.loc && { start: callee.loc.start, end: node.loc.end }),
			};
		}
		case "index": {
			const target = upExpression(node.target, source);
			return {
				type: "Index",
				target,
				index: upExpression(node.index, source),
				// FIXME: issue #4, loc.start
				loc: loc(node.loc && { start: target.loc.start, end: node.loc.end }),
			};
		}
		case "prop": {
			const target = upExpression(node.target, source);
			return {
				type: "Prop",
				target,
				// TODO: loc
				name: identifier(node.name, loc(undefined)),
				// FIXME: issue #4, loc.start
				loc: loc(node.loc && { start: target.loc.start, end: node.loc.end }),
			};
		}
		default:
			throw new Error(
				`Unknown node type: ${(node satisfies never as { type: string }).type}`,
			);
	}
};

const upType = <T extends Ast.TypeSource | undefined>(
	node: T,
): dst.Ty | (undefined extends T ? null : never) => {
	if (node == null) {
		return null as undefined extends T ? null : never;
	}

	switch (node.type) {
		case "namedTypeSource":
			return {
				type: "TypeReference",
				name: {
					type: "Identifier",
					name: node.name,
					// TODO: loc
					loc: loc(undefined),
				},
				argument: upType(node.inner),
				loc: loc(node.loc),
			};
		case "fnTypeSource":
			return {
				type: "FnType",
				params: node.args.map(upType),
				return: upType(node.result),
				loc: loc(node.loc),
			};
	}
};
