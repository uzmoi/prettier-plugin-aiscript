import type { ParserOptions } from "prettier";
import type { Ast } from "@syuilo/aiscript";
import type { Node } from "./node";
import type { AstPath } from "./types";
import { isSugarCall, type SugarCall } from "./sugar";

// https://github.com/aiscript-dev/aiscript/blob/9e618049b5753b26d7527ee736dff10d65289b18/src/parser/plugins/infix-to-fncall.ts#L92-L133
const opPrecedenceTable = {
	"Core:mul": 7,
	"Core:pow": 7,
	"Core:div": 7,
	"Core:mod": 7,
	"Core:add": 6,
	"Core:sub": 6,
	"Core:eq": 4,
	"Core:neq": 4,
	"Core:lt": 4,
	"Core:gt": 4,
	"Core:lteq": 4,
	"Core:gteq": 4,
	and: 3,
	or: 3,
} as const;

type BinaryOperatorNode = Ast.And | Ast.Or | SugarCall;

const isBinaryOperator = (
	node: Node,
	options: ParserOptions,
): node is BinaryOperatorNode =>
	node.type === "and" || node.type === "or" || isSugarCall(node, options);

const getPrecedence = (node: BinaryOperatorNode): number =>
	opPrecedenceTable[node.type === "call" ? node.target.name : node.type];

const isRhs = (node: Node, parent: BinaryOperatorNode): boolean =>
	(parent.type === "call" ? parent.args[1] : parent.right) === node;

const isTrailing = (parent: Node, key: string | null): boolean =>
	parent.type === "prop" ||
	parent.type === "index" ||
	(parent.type === "call" && key === "target");

export const needsParens = (path: AstPath, options: ParserOptions): boolean => {
	const { node, parent, key } = path;

	if (parent == null) return false;

	switch (node.type) {
		case "not":
		case "fn":
		case "exists":
			return isTrailing(parent, key) || isBinaryOperator(parent, options);
	}

	// HACK: これがないと型が正常に絞り込まれない。
	// これがあると何故かisBinaryOperatorでちゃんと絞り込みが効く。
	// TypeScript何もわからん
	if (import.meta.vitest) {
		isSugarCall(node, options) ? 0 : 1;
		isSugarCall(parent, options) ? 0 : 1;
	}

	if (isBinaryOperator(node, options)) {
		if (import.meta.vitest) {
			const { expectTypeOf } = import.meta.vitest;
			expectTypeOf(node.type).extract<"call">().not.toBeNever();
		}

		if (isTrailing(parent, key)) return true;

		if (isBinaryOperator(parent, options)) {
			if (import.meta.vitest) {
				const { expectTypeOf } = import.meta.vitest;
				expectTypeOf(parent.type).extract<"call">().not.toBeNever();
			}

			const precedence = getPrecedence(node);
			const parentPrecedence = getPrecedence(parent);

			if (
				parentPrecedence > precedence ||
				(isRhs(node, parent) && parentPrecedence === precedence)
			) {
				return true;
			}
		}
	}

	return false;
};
