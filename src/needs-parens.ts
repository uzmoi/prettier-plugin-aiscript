import type { AstPath, ParserOptions } from "prettier";
import type { Ast } from "@syuilo/aiscript";
import type { Node } from "./node";

type SugarCallNode = Ast.Call & {
	target: {
		type: "identifier";
		name: keyof typeof opPrecedenceTable;
	};
	args: [Ast.Expression, Ast.Expression];
};

const isSugarCallNode = (node: Node): node is SugarCallNode =>
	node.type === "call" &&
	node.target.type === "identifier" &&
	!node.loc &&
	!node.target.loc &&
	node.args.length === 2;

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

type OperatorNode = Ast.And | Ast.Or | SugarCallNode;

const getPrecedence = (node: OperatorNode): number =>
	opPrecedenceTable[node.type === "call" ? node.target.name : node.type];

const isRhs = (node: Node, parent: OperatorNode): boolean =>
	(parent.type === "call" ? parent.args[1] : parent.right) === node;

export const needsParens = (
	path: AstPath<Node>,
	_options: ParserOptions,
): boolean => {
	const { node, parent } = path;

	if (parent == null) return false;

	if (
		(node.type === "and" || node.type === "or" || isSugarCallNode(node)) &&
		(parent.type === "and" || parent.type === "or" || isSugarCallNode(parent))
	) {
		const precedence = getPrecedence(node);
		const parentPrecedence = getPrecedence(parent);

		if (parentPrecedence > precedence) {
			return true;
		}

		if (isRhs(node, parent) && parentPrecedence === precedence) {
			return true;
		}
	}

	return false;
};
