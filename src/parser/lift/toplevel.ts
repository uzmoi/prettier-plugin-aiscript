import type { Ast } from "@syuilo/aiscript";
import type * as dst from "../../dst";
import type { LiftContext } from "./context";
import { liftExpression } from "./expression";
import { identifier, identifierLocOf, liftLoc } from "./helpers";
import { liftStatement } from "./statement";

export const liftScript = (
	body: readonly Ast.Node[],
	comments: dst.Comment[],
	ctx: LiftContext,
): dst.Script => {
	return {
		type: "Script",
		body: body.map(body => liftTopLevel(body, ctx)),
		comments,
		loc: { start: 0, end: ctx.source.length },
	};
};

const liftTopLevel = (
	node: Ast.Node,
	ctx: LiftContext,
): dst.TopLevel | dst.Statement => {
	switch (node.type) {
		case "ns": {
			const loc = liftLoc(node.loc, ctx);
			return {
				type: "Namespace",
				// "::" を読み飛ばして次の identifier が name
				name: identifier(node.name, identifierLocOf(loc.start + 2, ctx.source)),
				body: node.members.map(
					// ns の .members には ns もしくは def しかない
					member => liftTopLevel(member, ctx) as dst.NamespaceItem,
				),
				loc,
			};
		}
		case "meta": {
			const loc = liftLoc(node.loc, ctx);
			return {
				type: "Meta",
				name:
					node.name == null ?
						null
						// "###" を読み飛ばして次の identifier が name
					:	identifier(node.name, identifierLocOf(loc.start + 3, ctx.source)),
				value: liftExpression(node.value, ctx),
				loc,
			};
		}
		case "namedTypeSource":
		case "fnTypeSource":
		case "unionTypeSource":
		case "attr": {
			throw new Error("エラーはでないはずだよ");
		}
		default: {
			return liftStatement(node, ctx);
		}
	}
};
