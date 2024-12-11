import type * as dst from "./dst";
import type { AstPath } from "./types";

// https://github.com/aiscript-dev/aiscript/blob/9e618049b5753b26d7527ee736dff10d65289b18/src/parser/plugins/infix-to-fncall.ts#L92-L133
const opPrecedenceTable: Record<dst.BinaryOperator["operator"], number> = {
	"*": 7,
	"^": 7,
	"/": 7,
	"%": 7,
	"+": 6,
	"-": 6,
	"==": 4,
	"!=": 4,
	"<": 4,
	">": 4,
	"<=": 4,
	">=": 4,
	"&&": 3,
	"||": 3,
};

const getPrecedence = (node: dst.BinaryOperator): number =>
	opPrecedenceTable[node.operator];

const isTrailingTarget = (node: dst.Node, parent: dst.Node): boolean =>
	((parent.type === "Prop" || parent.type === "Index") &&
		parent.target === node) ||
	(parent.type === "Call" && parent.callee === node);

export const needsParens = (path: AstPath): boolean => {
	const { node, parent } = path;

	if (parent == null) return false;

	switch (node.type) {
		case "UnaryOperator":
		case "Fn":
			return isTrailingTarget(node, parent) || parent.type === "BinaryOperator";
	}

	if (node.type === "BinaryOperator") {
		if (isTrailingTarget(node, parent)) return true;

		if (parent.type === "BinaryOperator") {
			const precedence = getPrecedence(node);
			const parentPrecedence = getPrecedence(parent);

			if (
				parentPrecedence > precedence ||
				(node === parent.rhs && parentPrecedence === precedence)
			) {
				return true;
			}
		}
	}

	return false;
};
