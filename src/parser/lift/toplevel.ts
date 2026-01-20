import type { Ast } from "@syuilo/aiscript";
import type * as dst from "../../dst";
import type { Root } from "../../node";
import { LiftContext } from "./context";
import { liftExpression } from "./expression";
import { identifier, identifierLocOf, liftLoc } from "./helpers";
import { liftStatement } from "./statement";

export const liftRoot = (root: Root, source: string): dst.Script => {
	const ctx = new LiftContext(source);

	return {
		type: "Script",
		body: root.body.map(body => liftTopLevel(body, ctx)),
		comments: root.comments.map(comment => ({
			type: "Comment",
			value: comment.value,
			loc: liftLoc(comment.loc, ctx),
		})),
		loc: { start: 0, end: source.length },
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
