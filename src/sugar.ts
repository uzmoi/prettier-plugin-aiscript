import type { ParserOptions } from "prettier";
import type { Ast } from "@syuilo/aiscript";
import type { Node } from "./node";

export type SugarCall = Ast.Call & {
	target: {
		type: "identifier";
		name:
			| "Core:mul"
			| "Core:pow"
			| "Core:div"
			| "Core:mod"
			| "Core:add"
			| "Core:sub"
			| "Core:eq"
			| "Core:neq"
			| "Core:lt"
			| "Core:gt"
			| "Core:lteq"
			| "Core:gteq";
	};
	args: [Ast.Expression, Ast.Expression];
};

const SUGAR_FNS = new Set([
	"Core:mul",
	"Core:pow",
	"Core:div",
	"Core:mod",
	"Core:add",
	"Core:sub",
	"Core:eq",
	"Core:neq",
	"Core:lt",
	"Core:gt",
	"Core:lteq",
	"Core:gteq",
]);

export const isSugarCall = (
	node: Node,
	options: ParserOptions,
): node is SugarCall => {
	if (node.type !== "call" || node.args.length !== 2) return false;
	const { target } = node;
	if (target.type !== "identifier" || !SUGAR_FNS.has(target.name)) return false;
	if (target.loc == null) return true;
	return !options.originalText.startsWith(
		target.name,
		options.locStart(target),
	);
};
